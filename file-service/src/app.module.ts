import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { S3Module } from './s3/s3.module';
import { MetadataModule } from './metadata/metadata.module';
import { UploadsModule } from './uploads/uploads.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, S3Module, MetadataModule, UploadsModule, FilesModule],
})
export class AppModule {}
