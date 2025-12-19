import { Module } from '@nestjs/common';
import { MetadataModule } from '../metadata/metadata.module';
import { S3Module } from '../s3/s3.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [MetadataModule, S3Module],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
