import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OwnerId } from '../common/owner/owner.decorator';
import { CreateFileDto } from './dto/create-file.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { ListChildrenQuery } from './dto/list-children.query';
import { MoveNodeDto } from './dto/move-node.dto';
import { RenameNodeDto } from './dto/rename-node.dto';
import { NodesService } from './nodes.service';

@Controller('nodes')
export class NodesController {
  constructor(private readonly nodes: NodesService) {}

  @Get('root')
  async getOrCreateRoot(@OwnerId() ownerId: bigint) {
    return this.nodes.getOrCreateRoot(ownerId);
  }

  @Get(':id')
  async getNode(@OwnerId() ownerId: bigint, @Param('id') id: string) {
    return this.nodes.getNode(ownerId, id);
  }

  @Get(':id/children')
  async listChildren(
    @OwnerId() ownerId: bigint,
    @Param('id') id: string,
    @Query() q: ListChildrenQuery,
  ) {
    return this.nodes.listChildren(ownerId, id, q.limit ?? 50, q.cursor);
  }

  @Post('folders')
  async createFolder(@OwnerId() ownerId: bigint, @Body() dto: CreateFolderDto) {
    return this.nodes.createFolder(ownerId, dto.parentId ?? null, dto.name);
  }

  @Post('files')
  async createFile(@OwnerId() ownerId: bigint, @Body() dto: CreateFileDto) {
    return this.nodes.createFile(ownerId, dto.parentId ?? null, dto.name);
  }

  @Patch(':id/rename')
  async rename(
    @OwnerId() ownerId: bigint,
    @Param('id') id: string,
    @Body() dto: RenameNodeDto,
  ) {
    return this.nodes.renameNode(ownerId, id, dto.name, dto.expectedRowVersion);
  }

  @Post(':id/move')
  async move(
    @OwnerId() ownerId: bigint,
    @Param('id') id: string,
    @Body() dto: MoveNodeDto,
  ) {
    return this.nodes.moveNode(ownerId, id, dto.newParentId, dto.expectedRowVersion);
  }

  @Delete(':id')
  async softDelete(
    @OwnerId() ownerId: bigint,
    @Param('id') id: string,
    @Query('cascade') cascade?: string,
  ) {
    const doCascade = cascade === undefined ? true : cascade === 'true';
    return this.nodes.softDelete(ownerId, id, doCascade);
  }
}
