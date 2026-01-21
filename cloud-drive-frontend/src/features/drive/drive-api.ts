import { api } from '../../lib/api';

export type NodeType = 'FOLDER' | 'FILE';

export type NodeItem = {
  id: string;
  ownerId?: string;
  type: NodeType;
  parentId: string | null;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  latest?: any;
};

export type FolderListing = {
  folderId: string;
  items: NodeItem[];
  nextCursor: string | null;
};

export async function getRoot() {
  const res = await api.get('/drive/root');
  return res.data as NodeItem;
}

export async function listFolder(folderId: string, limit = 50, cursor?: string) {
  const res = await api.get(`/drive/folders/${folderId}`, { params: { limit, cursor } });
  return res.data as FolderListing;
}

export async function createFolder(parentId: string, name: string) {
  const res = await api.post('/drive/folders', { parentId, name });
  return res.data as NodeItem;
}

export async function renameNode(nodeId: string, name: string) {
  const res = await api.patch(`/drive/nodes/${nodeId}/rename`, { name });
  return res.data as NodeItem;
}

export async function moveNode(nodeId: string, parentId: string) {
  const res = await api.post(`/drive/nodes/${nodeId}/move`, { parentId });
  return res.data as NodeItem;
}

export async function deleteNode(nodeId: string, cascade = false) {
  const res = await api.delete(`/drive/nodes/${nodeId}`, { params: { cascade } });
  return res.data;
}

export async function initiateUpload(parentId: string, name: string, totalSize: string, mimeType?: string) {
  const res = await api.post('/drive/files/initiate-upload', { parentId, name, totalSize, mimeType });
  return res.data as { fileNodeId: string; upload: any; node: any };
}

export async function getPartUrl(sessionId: string, partNumber: number) {
  const res = await api.get(`/drive/uploads/${sessionId}/part-url`, { params: { partNumber } });
  return res.data as { url: string; headers?: Record<string, string> };
}

export async function completeUpload(sessionId: string, parts: { partNumber: number; etag: string }[]) {
  const res = await api.post(`/drive/uploads/${sessionId}/complete`, { parts });
  return res.data;
}

export async function abortUpload(sessionId: string) {
  const res = await api.post(`/drive/uploads/${sessionId}/abort`, {});
  return res.data;
}

export async function downloadLatest(fileNodeId: string) {
  const res = await api.get(`/drive/files/${fileNodeId}/download`);
  return res.data as { url: string; expiresInSeconds?: number };
}
