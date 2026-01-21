const { HttpError } = require('../utils/httpError');
const { makeClient } = require('./http');

function metadataClient(env) {
  const http = makeClient({ baseURL: env.metadataBaseUrl, timeoutMs: env.downstreamTimeoutMs });

  function headers(ownerId) {
    const h = { 'x-owner-id': ownerId.toString() };
    if (env.internalApiKey) h[env.internalApiKeyHeader] = env.internalApiKey;
    return h;
  }

  async function getRoot(ownerId) {
    const res = await http.get('/nodes/root', { headers: headers(ownerId) });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'Metadata getRoot failed', res.data);
  }

  async function listChildren(ownerId, folderId, { limit, cursor } = {}) {
    const params = {};
    if (limit) params.limit = limit;
    if (cursor) params.cursor = cursor;
    const res = await http.get(`/nodes/${folderId}/children`, { headers: headers(ownerId), params });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'Metadata listChildren failed', res.data);
  }

  async function createFolder(ownerId, body) {
    const res = await http.post('/nodes/folders', body, { headers: headers(ownerId) });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'Metadata createFolder failed', res.data);
  }

  async function createFile(ownerId, body) {
    const res = await http.post('/nodes/files', body, { headers: headers(ownerId) });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'Metadata createFile failed', res.data);
  }

  async function renameNode(ownerId, nodeId, body) {
    const res = await http.patch(`/nodes/${nodeId}/rename`, body, { headers: headers(ownerId) });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'Metadata rename failed', res.data);
  }

  async function moveNode(ownerId, nodeId, body) {
    const res = await http.post(`/nodes/${nodeId}/move`, body, { headers: headers(ownerId) });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'Metadata move failed', res.data);
  }

  async function deleteNode(ownerId, nodeId, { cascade } = {}) {
    const params = {};
    if (cascade !== undefined) params.cascade = cascade ? 'true' : 'false';
    const res = await http.delete(`/nodes/${nodeId}`, { headers: headers(ownerId), params });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'Metadata delete failed', res.data);
  }

  return {
    getRoot,
    listChildren,
    createFolder,
    createFile,
    renameNode,
    moveNode,
    deleteNode,
  };
}

module.exports = { metadataClient };
