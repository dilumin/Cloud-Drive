const { HttpError } = require('../utils/httpError');

function makeLimiter(concurrency) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= concurrency) return;
    const job = queue.shift();
    if (!job) return;
    active += 1;
    job()
      .catch(() => {})
      .finally(() => {
        active -= 1;
        next();
      });
  };
  return (fn) =>
    new Promise((resolve, reject) => {
      queue.push(async () => {
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        }
      });
      next();
    });
}

async function listFolder(env, clients, ownerId, folderId, { limit, cursor }) {
  const meta = await clients.metadata.listChildren(ownerId, folderId, { limit, cursor });
  const items = meta.items || meta.children || meta.nodes || meta.data || meta; // tolerate DTO differences

  // If metadata returns raw object with children + nextCursor, keep it.
  const nextCursor = meta.nextCursor || meta.next_cursor || null;

  const arr = Array.isArray(items) ? items : meta.items || [];
  const fileIds = arr
    .filter((x) => (x.type || x.nodeType) === 'FILE')
    .map((x) => x.id);

  // Enrich each file with latest version info (size/mime) using limited parallelism
  const limitFn = makeLimiter(8);
  const latestMap = new Map();

  await Promise.all(
    fileIds.map((id) =>
      limitFn(async () => {
        try {
          const v = await clients.files.listVersions(ownerId, id);
          const versions = v.versions || [];
          const latest = versions[0] || null;
          if (latest) latestMap.set(id, latest);
        } catch (_e) {
          // ignore enrichment failures; folder listing should still work
        }
      }),
    ),
  );

  const enriched = arr.map((x) => {
    if ((x.type || x.nodeType) !== 'FILE') return x;
    const latest = latestMap.get(x.id) || null;
    return { ...x, latest };
  });

  return { folderId: String(folderId), items: enriched, nextCursor };
}

async function initiateUpload(env, clients, ownerId, body) {
  // 1) create file node in metadata
  const fileNode = await clients.metadata.createFile(ownerId, { parentId: body.parentId, name: body.name });

  const fileNodeId = fileNode.id || fileNode.nodeId || fileNode.data?.id;
  if (!fileNodeId) throw new HttpError(500, 'Metadata did not return fileNodeId');

  // 2) initiate multipart upload session in file service
  const session = await clients.files.initiateUpload(ownerId, {
    fileNodeId: String(fileNodeId),
    totalSize: body.totalSize,
    mimeType: body.mimeType,
  });

  return { fileNodeId: String(fileNodeId), upload: session, node: fileNode };
}

module.exports = { listFolder, initiateUpload };
