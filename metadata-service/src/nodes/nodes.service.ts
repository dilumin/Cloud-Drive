import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Node, NodeType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { decodeCursor, encodeCursor } from './utils/cursor';
import { NodeDto } from './types/node.dto';

function toDto(n: Node): NodeDto {
  return {
    id: n.id.toString(),
    ownerId: n.ownerId.toString(),
    type: n.type,
    parentId: n.parentId === null ? null : n.parentId.toString(),
    name: n.name,
    isRoot: n.isRoot,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    deletedAt: n.deletedAt ? n.deletedAt.toISOString() : null,
    rowVersion: n.rowVersion.toString(),
  };
}

function parseBigintId(label: string, value: string): bigint {
  if (!/^[0-9]+$/.test(value)) {
    throw new BadRequestException(`${label} must be a positive integer string`);
  }
  return BigInt(value);
}

@Injectable()
export class NodesService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateRoot(ownerId: bigint) {
    const existing = await this.prisma.node.findFirst({
      where: { ownerId, isRoot: true, deletedAt: null },
    });
    if (existing) return toDto(existing);

    try {
      const created = await this.prisma.node.create({
        data: {
          ownerId,
          type: 'FOLDER',
          parentId: null,
          name: 'root',
          isRoot: true,
        },
      });
      return toDto(created);
    } catch (e: any) {
      // race: another request created the root
      const again = await this.prisma.node.findFirst({
        where: { ownerId, isRoot: true, deletedAt: null },
      });
      if (again) return toDto(again);
      throw e;
    }
  }

  async getNode(ownerId: bigint, idStr: string) {
    const id = parseBigintId('id', idStr);
    const node = await this.prisma.node.findFirst({
      where: { id, ownerId, deletedAt: null },
    });
    if (!node) throw new NotFoundException('Node not found');
    return toDto(node);
  }

  async createFolder(ownerId: bigint, parentIdStr: string | null, name: string) {
    const parentId = parentIdStr ? parseBigintId('parentId', parentIdStr) : null;

    if (parentId === null) {
      // Only allow creating root through getOrCreateRoot to keep invariants tidy
      throw new BadRequestException('parentId is required (use GET /nodes/root to create root)');
    }

    const parent = await this.prisma.node.findFirst({
      where: { id: parentId, ownerId, deletedAt: null },
    });
    if (!parent) throw new NotFoundException('Parent folder not found');
    if (parent.type !== 'FOLDER') throw new BadRequestException('parentId must refer to a folder');

    try {
      const created = await this.prisma.node.create({
        data: { ownerId, type: 'FOLDER', parentId, name, isRoot: false },
      });
      return toDto(created);
    } catch (e: any) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException('A node with the same name already exists in this folder');
      }
      throw e;
    }
  }

  async createFile(ownerId: bigint, parentIdStr: string | null, name: string) {
    const parentId = parentIdStr ? parseBigintId('parentId', parentIdStr) : null;
    if (parentId === null) {
      throw new BadRequestException('parentId is required');
    }

    const parent = await this.prisma.node.findFirst({
      where: { id: parentId, ownerId, deletedAt: null },
    });
    if (!parent) throw new NotFoundException('Parent folder not found');
    if (parent.type !== 'FOLDER') throw new BadRequestException('parentId must refer to a folder');

    try {
      const created = await this.prisma.node.create({
        data: { ownerId, type: 'FILE', parentId, name, isRoot: false },
      });
      return toDto(created);
    } catch (e: any) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException('A node with the same name already exists in this folder');
      }
      throw e;
    }
  }

  async listChildren(ownerId: bigint, folderIdStr: string, limit: number, cursor?: string) {
    const folderId = parseBigintId('folderId', folderIdStr);

    const folder = await this.prisma.node.findFirst({
      where: { id: folderId, ownerId, deletedAt: null },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.type !== 'FOLDER') throw new BadRequestException('Node is not a folder');

    let cursorCreatedAt: Date | null = null;
    let cursorId: bigint | null = null;

    if (cursor) {
      try {
        const payload = decodeCursor(cursor);
        cursorCreatedAt = new Date(payload.createdAt);
        if (Number.isNaN(cursorCreatedAt.getTime())) throw new Error();
        cursorId = parseBigintId('cursor.id', payload.id);
      } catch {
        throw new BadRequestException('Invalid cursor');
      }
    }

    // Use raw SQL for stable tuple pagination: (created_at, id) > (cursorCreatedAt, cursorId)
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT *
      FROM nodes
      WHERE owner_id = $1
        AND parent_id = $2
        AND deleted_at IS NULL
        AND (
          $3::timestamptz IS NULL
          OR (created_at, id) > ($3::timestamptz, $4::bigint)
        )
      ORDER BY created_at ASC, id ASC
      LIMIT $5
      `,
      ownerId,
      folderId,
      cursorCreatedAt ? cursorCreatedAt.toISOString() : null,
      cursorId ?? BigInt(0),
      limit + 1,
    );

    const items = rows.slice(0, limit).map((r) =>
      toDto({
        id: BigInt(r.id),
        ownerId: BigInt(r.owner_id),
        type: r.type as NodeType,
        parentId: r.parent_id === null ? null : BigInt(r.parent_id),
        name: r.name,
        isRoot: r.is_root,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
        deletedAt: r.deleted_at ? new Date(r.deleted_at) : null,
        rowVersion: BigInt(r.row_version),
      } as any),
    );

    let nextCursor: string | null = null;
    if (rows.length > limit) {
      const last = rows[limit - 1];
      nextCursor = encodeCursor({ createdAt: new Date(last.created_at).toISOString(), id: String(last.id) });
    }

    return { folder: toDto(folder), items, nextCursor };
  }

  async renameNode(ownerId: bigint, idStr: string, newName: string, expectedRowVersion?: string) {
    const id = parseBigintId('id', idStr);

    const node = await this.prisma.node.findFirst({
      where: { id, ownerId, deletedAt: null },
    });
    if (!node) throw new NotFoundException('Node not found');
    if (node.isRoot) throw new BadRequestException('Root cannot be renamed');

    // If name unchanged, return quickly
    if (node.name === newName) return toDto(node);

    // If optimistic lock provided, enforce it
    const expected = expectedRowVersion ? parseBigintId('expectedRowVersion', expectedRowVersion) : null;

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        // ensure no conflict name in same parent
        const conflict = await tx.node.findFirst({
          where: {
            ownerId,
            parentId: node.parentId,
            name: newName,
            deletedAt: null,
          },
        });
        if (conflict) throw new ConflictException('A node with the same name already exists in this folder');

        if (expected !== null) {
          // optimistic update
          const res = await tx.node.updateMany({
            where: { id, ownerId, deletedAt: null, rowVersion: expected },
            data: { name: newName, rowVersion: { increment: 1 } },
          });
          if (res.count === 0) throw new ConflictException('Version conflict (node was updated by someone else)');
          const fresh = await tx.node.findFirst({ where: { id, ownerId } });
          if (!fresh) throw new NotFoundException('Node not found');
          return fresh;
        }

        return tx.node.update({
          where: { id },
          data: { name: newName, rowVersion: { increment: 1 } },
        });
      });

      return toDto(updated);
    } catch (e: any) {
      if (e instanceof ConflictException) throw e;
      if (this.isUniqueViolation(e)) throw new ConflictException('A node with the same name already exists in this folder');
      throw e;
    }
  }

  async moveNode(ownerId: bigint, idStr: string, newParentIdStr: string, expectedRowVersion?: string) {
    const id = parseBigintId('id', idStr);
    const newParentId = parseBigintId('newParentId', newParentIdStr);
    const expected = expectedRowVersion ? parseBigintId('expectedRowVersion', expectedRowVersion) : null;

    if (id === newParentId) throw new BadRequestException('Cannot move a node under itself');

    const updated = await this.prisma.$transaction(async (tx) => {
      const node = await tx.node.findFirst({ where: { id, ownerId, deletedAt: null } });
      if (!node) throw new NotFoundException('Node not found');
      if (node.isRoot) throw new BadRequestException('Root cannot be moved');

      const newParent = await tx.node.findFirst({ where: { id: newParentId, ownerId, deletedAt: null } });
      if (!newParent) throw new NotFoundException('Target parent folder not found');
      if (newParent.type !== 'FOLDER') throw new BadRequestException('newParentId must refer to a folder');

      // cycle detection: only needed when moving a folder
      if (node.type === 'FOLDER') {
        const cycle = await this.isDescendant(tx, ownerId, id, newParentId);
        if (cycle) throw new BadRequestException('Invalid move: would create a cycle (moving into its own subtree)');
      }

      // name collision in target folder
      const conflict = await tx.node.findFirst({
        where: {
          ownerId,
          parentId: newParentId,
          name: node.name,
          deletedAt: null,
        },
      });
      if (conflict) throw new ConflictException('A node with the same name already exists in the target folder');

      if (expected !== null) {
        const res = await tx.node.updateMany({
          where: { id, ownerId, deletedAt: null, rowVersion: expected },
          data: { parentId: newParentId, rowVersion: { increment: 1 } },
        });
        if (res.count === 0) throw new ConflictException('Version conflict (node was updated by someone else)');
        const fresh = await tx.node.findFirst({ where: { id, ownerId } });
        if (!fresh) throw new NotFoundException('Node not found');
        return fresh;
      }

      return tx.node.update({
        where: { id },
        data: { parentId: newParentId, rowVersion: { increment: 1 } },
      });
    });

    return toDto(updated);
  }

  async softDelete(ownerId: bigint, idStr: string, cascade: boolean) {
    const id = parseBigintId('id', idStr);

    const node = await this.prisma.node.findFirst({
      where: { id, ownerId, deletedAt: null },
    });
    if (!node) throw new NotFoundException('Node not found');
    if (node.isRoot) throw new BadRequestException('Root cannot be deleted');

    if (!cascade || node.type === 'FILE') {
      const updated = await this.prisma.node.update({
        where: { id },
        data: { deletedAt: new Date(), rowVersion: { increment: 1 } },
      });
      return { deleted: [toDto(updated)] };
    }

    // cascade delete subtree using recursive CTE
    const now = new Date().toISOString();

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `
      WITH RECURSIVE subtree AS (
        SELECT id FROM nodes
        WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
        UNION ALL
        SELECT n.id
        FROM nodes n
        JOIN subtree s ON n.parent_id = s.id
        WHERE n.owner_id = $2 AND n.deleted_at IS NULL
      )
      UPDATE nodes
      SET deleted_at = $3::timestamptz,
          row_version = row_version + 1,
          updated_at = $3::timestamptz
      WHERE id IN (SELECT id FROM subtree)
      RETURNING *;
      `,
      id,
      ownerId,
      now,
    );

    const deleted = rows.map((r) =>
      toDto({
        id: BigInt(r.id),
        ownerId: BigInt(r.owner_id),
        type: r.type as NodeType,
        parentId: r.parent_id === null ? null : BigInt(r.parent_id),
        name: r.name,
        isRoot: r.is_root,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
        deletedAt: r.deleted_at ? new Date(r.deleted_at) : null,
        rowVersion: BigInt(r.row_version),
      } as any),
    );

    return { deleted };
  }

  private async isDescendant(tx: Prisma.TransactionClient, ownerId: bigint, ancestorId: bigint, maybeDescendantId: bigint): Promise<boolean> {
    const rows = await tx.$queryRawUnsafe<any[]>(
      `
      WITH RECURSIVE subtree AS (
        SELECT id FROM nodes
        WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
        UNION ALL
        SELECT n.id
        FROM nodes n
        JOIN subtree s ON n.parent_id = s.id
        WHERE n.owner_id = $2 AND n.deleted_at IS NULL
      )
      SELECT 1
      FROM subtree
      WHERE id = $3
      LIMIT 1;
      `,
      ancestorId,
      ownerId,
      maybeDescendantId,
    );
    return rows.length > 0;
  }

  private isUniqueViolation(e: any): boolean {
    // Prisma known request error has code 'P2002' for unique constraint
    return typeof e === 'object' && e !== null && e.code === 'P2002';
  }
}
