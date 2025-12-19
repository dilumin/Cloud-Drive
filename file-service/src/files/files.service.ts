import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { MetadataService } from '../metadata/metadata.service';

function parseBigint(label: string, s: string): bigint {
  if (!/^[0-9]+$/.test(s)) throw new BadRequestException(`${label} must be a positive integer string`);
  return BigInt(s);
}
function parseIntStrict(label: string, s: string): number {
  if (!/^[0-9]+$/.test(s)) throw new BadRequestException(`${label} must be a positive integer`);
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) throw new BadRequestException(`${label} must be >= 1`);
  return n;
}

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly metadata: MetadataService,
  ) {}

  async listVersions(ownerId: bigint, fileNodeIdStr: string) {
    const fileNodeId = parseBigint('fileNodeId', fileNodeIdStr);
    await this.metadata.assertFileNodeIsValid(ownerId, fileNodeId);

    const versions = await this.prisma.fileVersion.findMany({
      where: { ownerId, fileNodeId },
      orderBy: { versionNo: 'desc' },
    });

    return {
      fileNodeId: fileNodeId.toString(),
      versions: versions.map((v) => ({
        versionNo: v.versionNo,
        sizeBytes: v.sizeBytes.toString(),
        mimeType: v.mimeType,
        bucket: v.bucket,
        storageKey: v.storageKey,
        createdAt: v.createdAt.toISOString(),
      })),
    };
  }

  async downloadLatest(ownerId: bigint, fileNodeIdStr: string) {
    const fileNodeId = parseBigint('fileNodeId', fileNodeIdStr);
    await this.metadata.assertFileNodeIsValid(ownerId, fileNodeId);

    const latest = await this.prisma.fileVersion.findFirst({
      where: { ownerId, fileNodeId },
      orderBy: { versionNo: 'desc' },
    });
    if (!latest) throw new NotFoundException('No versions found for this file');

    const url = await this.s3.presignDownloadUrl({ bucket: latest.bucket, key: latest.storageKey });
    return { fileNodeId: fileNodeId.toString(), versionNo: latest.versionNo, url, expiresInSeconds: this.s3.getPresignExpiresSeconds() };
  }

  async downloadSpecific(ownerId: bigint, fileNodeIdStr: string, versionNoStr: string) {
    const fileNodeId = parseBigint('fileNodeId', fileNodeIdStr);
    const versionNo = parseIntStrict('versionNo', versionNoStr);
    await this.metadata.assertFileNodeIsValid(ownerId, fileNodeId);

    const v = await this.prisma.fileVersion.findFirst({ where: { ownerId, fileNodeId, versionNo } });
    if (!v) throw new NotFoundException('Version not found');

    const url = await this.s3.presignDownloadUrl({ bucket: v.bucket, key: v.storageKey });
    return { fileNodeId: fileNodeId.toString(), versionNo: v.versionNo, url, expiresInSeconds: this.s3.getPresignExpiresSeconds() };
  }
}
