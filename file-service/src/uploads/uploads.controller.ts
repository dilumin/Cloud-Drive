import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { OwnerId } from '../common/owner/owner.decorator';
import { InitiateUploadDto } from './dto/initiate-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('initiate')
  initiate(@OwnerId() ownerId: bigint, @Body() dto: InitiateUploadDto) {
    return this.uploads.initiate(ownerId, dto);
  }

  @Get(':sessionId')
  getSession(@OwnerId() ownerId: bigint, @Param('sessionId') sessionId: string) {
    return this.uploads.getSession(ownerId, sessionId);
  }

  @Get(':sessionId/part-url')
  partUrl(
    @OwnerId() ownerId: bigint,
    @Param('sessionId') sessionId: string,
    @Query('partNumber') partNumber: string,
  ) {
    return this.uploads.getPartUrl(ownerId, sessionId, partNumber);
  }

  @Post(':sessionId/complete')
  complete(
    @OwnerId() ownerId: bigint,
    @Param('sessionId') sessionId: string,
    @Body() dto: CompleteUploadDto,
  ) {
    return this.uploads.complete(ownerId, sessionId, dto);
  }

  @Post(':sessionId/abort')
  abort(@OwnerId() ownerId: bigint, @Param('sessionId') sessionId: string) {
    return this.uploads.abort(ownerId, sessionId);
  }
}
