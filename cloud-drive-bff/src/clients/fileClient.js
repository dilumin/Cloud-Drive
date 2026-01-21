const { HttpError } = require('../utils/httpError');
const { makeClient } = require('./http');

function fileClient(env) {
  const http = makeClient({ baseURL: env.fileBaseUrl, timeoutMs: env.downstreamTimeoutMs });

  function headers(ownerId) {
    const h = { 'x-owner-id': ownerId.toString() };
    if (env.internalApiKey) h[env.internalApiKeyHeader] = env.internalApiKey;
    return h;
  }

  async function initiateUpload(ownerId, body) {
    const res = await http.post('/uploads/initiate', body, { headers: headers(ownerId) });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'File initiateUpload failed', res.data);
  }

  async function getPartUrl(ownerId, sessionId, partNumber) {
    const res = await http.get(`/uploads/${sessionId}/part-url`, {
      headers: headers(ownerId),
      params: { partNumber },
    });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'File getPartUrl failed', res.data);
  }

  async function completeUpload(ownerId, sessionId, body) {
    const res = await http.post(`/uploads/${sessionId}/complete`, body, { headers: headers(ownerId) });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'File completeUpload failed', res.data);
  }

  async function abortUpload(ownerId, sessionId) {
    const res = await http.post(`/uploads/${sessionId}/abort`, {}, { headers: headers(ownerId) });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'File abortUpload failed', res.data);
  }

  async function listVersions(ownerId, fileNodeId) {
    const res = await http.get(`/files/${fileNodeId}/versions`, { headers: headers(ownerId) });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'File listVersions failed', res.data);
  }

  async function downloadLatest(ownerId, fileNodeId) {
    const res = await http.get(`/files/${fileNodeId}/download`, { headers: headers(ownerId) });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'File downloadLatest failed', res.data);
  }

  async function downloadSpecific(ownerId, fileNodeId, versionNo) {
    const res = await http.get(`/files/${fileNodeId}/versions/${versionNo}/download`, { headers: headers(ownerId) });
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new HttpError(res.status, res.data?.message || 'File downloadSpecific failed', res.data);
  }

  return {
    initiateUpload,
    getPartUrl,
    completeUpload,
    abortUpload,
    listVersions,
    downloadLatest,
    downloadSpecific,
  };
}

module.exports = { fileClient };
