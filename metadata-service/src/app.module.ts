import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { NodesModule } from './nodes/nodes.module';

@Module({
  imports: [PrismaModule, NodesModule],
})
export class AppModule {}
