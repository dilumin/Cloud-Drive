import { Controller, Get, Param } from '@nestjs/common';
import { OwnerId } from '../common/owner/owner.decorator';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get(':fileNodeId/versions')
  listVersions(@OwnerId() ownerId: bigint, @Param('fileNodeId') fileNodeId: string) {
    return this.files.listVersions(ownerId, fileNodeId);
  }

  @Get(':fileNodeId/download')
  downloadLatest(@OwnerId() ownerId: bigint, @Param('fileNodeId') fileNodeId: string) {
    return this.files.downloadLatest(ownerId, fileNodeId);
  }

  @Get(':fileNodeId/versions/:versionNo/download')
  downloadSpecific(
    @OwnerId() ownerId: bigint,
    @Param('fileNodeId') fileNodeId: string,
    @Param('versionNo') versionNo: string,
  ) {
    return this.files.downloadSpecific(ownerId, fileNodeId, versionNo);
  }
}
