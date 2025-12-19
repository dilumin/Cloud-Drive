import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly presignExpires: number;

  constructor(private readonly config: ConfigService) {
    const region = this.config.get<string>('S3_REGION') || 'us-east-1';
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.config.get<string>('S3_SECRET_KEY');
    const forcePathStyle = (this.config.get<string>('S3_FORCE_PATH_STYLE') || 'false') === 'true';

    this.bucket = this.config.get<string>('S3_BUCKET') || 'drive';
    this.presignExpires = Number(this.config.get<string>('PRESIGN_EXPIRES_SECONDS') || '900');

    this.s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }

  getDefaultBucket() { return this.bucket; }
  getPresignExpiresSeconds() { return this.presignExpires; }

  async createMultipartUpload(params: { bucket: string; key: string; contentType?: string }) {
    const out = await this.s3.send(new CreateMultipartUploadCommand({
      Bucket: params.bucket, Key: params.key, ContentType: params.contentType,
    }));
    if (!out.UploadId) throw new Error('S3 CreateMultipartUpload missing UploadId');
    return { uploadId: out.UploadId };
  }

  async presignUploadPartUrl(params: { bucket: string; key: string; uploadId: string; partNumber: number }) {
    const cmd = new UploadPartCommand({
      Bucket: params.bucket, Key: params.key, UploadId: params.uploadId, PartNumber: params.partNumber,
    });
    return await getSignedUrl(this.s3, cmd, { expiresIn: this.presignExpires });
  }

  async completeMultipartUpload(params: { bucket: string; key: string; uploadId: string; parts: Array<{ partNumber: number; etag: string }> }) {
    const cmd = new CompleteMultipartUploadCommand({
      Bucket: params.bucket,
      Key: params.key,
      UploadId: params.uploadId,
      MultipartUpload: {
        Parts: params.parts.slice().sort((a,b)=>a.partNumber-b.partNumber).map(p => ({ PartNumber: p.partNumber, ETag: p.etag })),
      },
    });
    return await this.s3.send(cmd);
  }

  async abortMultipartUpload(params: { bucket: string; key: string; uploadId: string }) {
    await this.s3.send(new AbortMultipartUploadCommand({ Bucket: params.bucket, Key: params.key, UploadId: params.uploadId }));
  }

  async presignDownloadUrl(params: { bucket: string; key: string }) {
    const cmd = new GetObjectCommand({ Bucket: params.bucket, Key: params.key });
    return await getSignedUrl(this.s3, cmd, { expiresIn: this.presignExpires });
  }
}
