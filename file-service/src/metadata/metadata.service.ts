import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MetadataNodeDto {
  id: string;
  ownerId: string;
  type: 'FOLDER' | 'FILE';
  parentId: string | null;
  name: string;
  isRoot: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  rowVersion: string;
}

@Injectable()
export class MetadataService {
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (this.config.get<string>('METADATA_BASE_URL') || '').replace(/\/$/, '');
    if (!this.baseUrl) throw new Error('METADATA_BASE_URL is required');
  }

  async getNode(ownerId: bigint, nodeId: bigint): Promise<MetadataNodeDto> {
    const res = await fetch(`${this.baseUrl}/nodes/${nodeId.toString()}`, {
      headers: { 'x-owner-id': ownerId.toString() },
    });
    if (res.status === 404) throw new NotFoundException('Node not found in Metadata Service');
    if (!res.ok) throw new BadRequestException(`Metadata Service error: ${res.status}`);
    return (await res.json()) as MetadataNodeDto;
  }

  async assertFileNodeIsValid(ownerId: bigint, fileNodeId: bigint): Promise<MetadataNodeDto> {
    const n = await this.getNode(ownerId, fileNodeId);
    if (n.deletedAt) throw new BadRequestException('File node is deleted');
    if (n.type !== 'FILE') throw new BadRequestException('fileNodeId must refer to a FILE node');
    return n;
  }
}
