import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UploadStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MetadataService } from '../metadata/metadata.service';
import { S3Service } from '../s3/s3.service';
import { InitiateUploadDto } from './dto/initiate-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';

function parseBigint(label: string, s: string): bigint {
  if (!/^[0-9]+$/.test(s)) throw new BadRequestException(`${label} must be a positive integer string`);
  return BigInt(s);
}

function buildStorageKey(ownerId: bigint, fileNodeId: bigint, versionNo: number): string {
  return `owners/${ownerId.toString()}/nodes/${fileNodeId.toString()}/versions/${versionNo}`;
}

@Injectable()
export class UploadsService {
  private readonly defaultPartSize: number;
  private readonly ttlMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly metadata: MetadataService,
    private readonly s3: S3Service,
    private readonly config: ConfigService,
  ) {
    this.defaultPartSize = Number(this.config.get<string>('DEFAULT_PART_SIZE_BYTES') || '8388608');
    this.ttlMinutes = Number(this.config.get<string>('UPLOAD_SESSION_TTL_MINUTES') || '120');
    if (this.defaultPartSize < 5 * 1024 * 1024) throw new Error('DEFAULT_PART_SIZE_BYTES must be >= 5MiB');
  }

  async initiate(ownerId: bigint, dto: InitiateUploadDto) {
    const fileNodeId = parseBigint('fileNodeId', dto.fileNodeId);
    const totalSize = parseBigint('totalSize', dto.totalSize);
    const mimeType = dto.mimeType;

    await this.metadata.assertFileNodeIsValid(ownerId, fileNodeId);

    const bucket = this.s3.getDefaultBucket();
    const partSize = this.choosePartSize(Number(totalSize));
    const totalParts = Math.max(1, Math.ceil(Number(totalSize) / partSize));
    if (totalParts > 10000) throw new BadRequestException(`Too many parts (${totalParts}). Increase part size.`);

    const expiresAt = new Date(Date.now() + this.ttlMinutes * 60 * 1000);

    const session = await this.prisma.$transaction(async (tx) => {
      const max = await tx.fileVersion.aggregate({ where: { ownerId, fileNodeId }, _max: { versionNo: true } });
      const nextVersion = (max._max.versionNo ?? 0) + 1;

      const key = buildStorageKey(ownerId, fileNodeId, nextVersion);
      const { uploadId } = await this.s3.createMultipartUpload({ bucket, key, contentType: mimeType });

      return tx.uploadSession.create({
        data: {
          ownerId, fileNodeId, versionNo: nextVersion,
          status: UploadStatus.UPLOADING,
          bucket, storageKey: key, uploadId,
          partSize, totalSize, mimeType, expiresAt,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return {
      sessionId: session.id.toString(),
      fileNodeId: session.fileNodeId.toString(),
      versionNo: session.versionNo,
      partSize: session.partSize,
      totalParts,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  async getSession(ownerId: bigint, sessionIdStr: string) {
    const sessionId = parseBigint('sessionId', sessionIdStr);
    const s = await this.prisma.uploadSession.findFirst({ where: { id: sessionId, ownerId } });
    if (!s) throw new NotFoundException('Upload session not found');

    const totalParts = Math.max(1, Math.ceil(Number(s.totalSize) / s.partSize));
    return {
      sessionId: s.id.toString(),
      fileNodeId: s.fileNodeId.toString(),
      versionNo: s.versionNo,
      status: s.status,
      partSize: s.partSize,
      totalSize: s.totalSize.toString(),
      totalParts,
      expiresAt: s.expiresAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  async getPartUrl(ownerId: bigint, sessionIdStr: string, partNumberStr: string) {
    const sessionId = parseBigint('sessionId', sessionIdStr);
    if (!/^[0-9]+$/.test(partNumberStr)) throw new BadRequestException('partNumber must be a positive integer');
    const partNumber = Number(partNumberStr);

    const s = await this.prisma.uploadSession.findFirst({ where: { id: sessionId, ownerId } });
    if (!s) throw new NotFoundException('Upload session not found');
    if (s.status === UploadStatus.ABORTED) throw new BadRequestException('Upload session is aborted');
    if (s.status === UploadStatus.COMPLETED) throw new BadRequestException('Upload session already completed');
    if (new Date() > s.expiresAt) throw new BadRequestException('Upload session expired');

    const totalParts = Math.max(1, Math.ceil(Number(s.totalSize) / s.partSize));
    if (partNumber < 1 || partNumber > totalParts) throw new BadRequestException(`partNumber out of range (1..${totalParts})`);

    const url = await this.s3.presignUploadPartUrl({ bucket: s.bucket, key: s.storageKey, uploadId: s.uploadId, partNumber });
    return { url, partNumber, expiresInSeconds: this.s3.getPresignExpiresSeconds() };
  }

  async complete(ownerId: bigint, sessionIdStr: string, dto: CompleteUploadDto) {
    const sessionId = parseBigint('sessionId', sessionIdStr);

    const seen = new Set<number>();
    for (const p of dto.parts) {
      if (seen.has(p.partNumber)) throw new BadRequestException('Duplicate partNumber in parts[]');
      seen.add(p.partNumber);
    }

    const out = await this.prisma.$transaction(async (tx) => {
      const s = await tx.uploadSession.findFirst({ where: { id: sessionId, ownerId } });
      if (!s) throw new NotFoundException('Upload session not found');

      if (s.status === UploadStatus.COMPLETED) {
        const v = await tx.fileVersion.findFirst({ where: { ownerId, fileNodeId: s.fileNodeId, versionNo: s.versionNo } });
        if (!v) throw new ConflictException('Completed but version row missing');
        return { alreadyCompleted: true, session: s, version: v };
      }

      if (s.status === UploadStatus.ABORTED) throw new BadRequestException('Upload session is aborted');
      if (new Date() > s.expiresAt) throw new BadRequestException('Upload session expired');

      const lock = await tx.uploadSession.updateMany({
        where: { id: s.id, ownerId, status: UploadStatus.UPLOADING },
        data: { status: UploadStatus.FINALIZING },
      });
      if (lock.count === 0) throw new ConflictException('Upload is being finalized by another request. Retry.');

      await this.s3.completeMultipartUpload({
        bucket: s.bucket, key: s.storageKey, uploadId: s.uploadId,
        parts: dto.parts.map(p => ({ partNumber: p.partNumber, etag: p.etag })),
      });

      const v = await tx.fileVersion.create({
        data: {
          ownerId, fileNodeId: s.fileNodeId, versionNo: s.versionNo,
          bucket: s.bucket, storageKey: s.storageKey,
          sizeBytes: s.totalSize, mimeType: s.mimeType,
        },
      });

      const done = await tx.uploadSession.update({ where: { id: s.id }, data: { status: UploadStatus.COMPLETED, completedAt: new Date() } });
      return { alreadyCompleted: false, session: done, version: v };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return {
      sessionId: out.session.id.toString(),
      fileNodeId: out.version.fileNodeId.toString(),
      versionNo: out.version.versionNo,
      status: out.session.status,
      storage: { bucket: out.version.bucket, key: out.version.storageKey },
      sizeBytes: out.version.sizeBytes.toString(),
      mimeType: out.version.mimeType,
      alreadyCompleted: out.alreadyCompleted,
      completedAt: out.session.completedAt ? out.session.completedAt.toISOString() : null,
    };
  }

  async abort(ownerId: bigint, sessionIdStr: string) {
    const sessionId = parseBigint('sessionId', sessionIdStr);
    const s = await this.prisma.uploadSession.findFirst({ where: { id: sessionId, ownerId } });
    if (!s) throw new NotFoundException('Upload session not found');
    if (s.status === UploadStatus.COMPLETED) throw new BadRequestException('Cannot abort a completed upload');
    if (s.status === UploadStatus.ABORTED) return { sessionId: s.id.toString(), status: s.status, alreadyAborted: true };

    await this.s3.abortMultipartUpload({ bucket: s.bucket, key: s.storageKey, uploadId: s.uploadId });
    const upd = await this.prisma.uploadSession.update({ where: { id: s.id }, data: { status: UploadStatus.ABORTED, abortedAt: new Date() } });
    return { sessionId: upd.id.toString(), status: upd.status, alreadyAborted: false };
  }

  private choosePartSize(totalSizeBytes: number): number {
    let p = this.defaultPartSize;
    while (Math.ceil(totalSizeBytes / p) > 10000) p *= 2;
    return p;
  }
}
