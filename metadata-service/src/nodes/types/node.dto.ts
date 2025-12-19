export type NodeType = 'FOLDER' | 'FILE';

export interface NodeDto {
  id: string;
  ownerId: string;
  type: NodeType;
  parentId: string | null;
  name: string;
  isRoot: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  rowVersion: string;
}
