import { Module } from '@nestjs/common';
import { MetadataModule } from '../metadata/metadata.module';
import { S3Module } from '../s3/s3.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [MetadataModule, S3Module],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
