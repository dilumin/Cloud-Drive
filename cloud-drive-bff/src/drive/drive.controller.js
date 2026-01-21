const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const schemas = require('./drive.schemas');
const svc = require('./drive.service');

function driveRouter(env, clients) {
  const r = express.Router();
  r.use(requireAuth(env));

  r.get(
    '/root',
    asyncHandler(async (req, res) => {
      const out = await clients.metadata.getRoot(req.user.id);
      res.json(out);
    }),
  );

  r.get(
    '/folders/:id',
    asyncHandler(async (req, res) => {
      const { limit, cursor } = req.query;
      const out = await svc.listFolder(
        env,
        clients,
        req.user.id,
        req.params.id,
        {
          limit: limit ? Number(limit) : undefined,
          cursor: cursor ? String(cursor) : undefined,
        },
      );
      res.json(out);
    }),
  );

  r.post(
    '/folders',
    validateBody(schemas.createFolderSchema),
    asyncHandler(async (req, res) => {
      const out = await clients.metadata.createFolder(req.user.id, req.body);
      res.status(201).json(out);
    }),
  );

  r.post(
    '/files/initiate-upload',
    validateBody(schemas.initiateUploadSchema),
    asyncHandler(async (req, res) => {
      const out = await svc.initiateUpload(env, clients, req.user.id, req.body);
      res.status(201).json(out);
    }),
  );

  r.get(
    '/uploads/:sessionId/part-url',
    asyncHandler(async (req, res) => {
      const partNumber = req.query.partNumber;
      const out = await clients.files.getPartUrl(req.user.id, req.params.sessionId, partNumber);
      res.json(out);
    }),
  );

  r.post(
    '/uploads/:sessionId/complete',
    validateBody(schemas.completeUploadSchema),
    asyncHandler(async (req, res) => {
      const out = await clients.files.completeUpload(req.user.id, req.params.sessionId, req.body);
      res.json(out);
    }),
  );

  r.post(
    '/uploads/:sessionId/abort',
    asyncHandler(async (req, res) => {
      const out = await clients.files.abortUpload(req.user.id, req.params.sessionId);
      res.json(out);
    }),
  );

  r.get(
    '/files/:fileNodeId/download',
    asyncHandler(async (req, res) => {
      const out = await clients.files.downloadLatest(req.user.id, req.params.fileNodeId);
      res.json(out);
    }),
  );

  r.get(
    '/files/:fileNodeId/versions/:versionNo/download',
    asyncHandler(async (req, res) => {
      const out = await clients.files.downloadSpecific(req.user.id, req.params.fileNodeId, req.params.versionNo);
      res.json(out);
    }),
  );

  r.patch(
    '/nodes/:id/rename',
    validateBody(schemas.renameSchema),
    asyncHandler(async (req, res) => {
      const out = await clients.metadata.renameNode(req.user.id, req.params.id, req.body);
      res.json(out);
    }),
  );

  r.post(
    '/nodes/:id/move',
    validateBody(schemas.moveSchema),
    asyncHandler(async (req, res) => {
      const out = await clients.metadata.moveNode(req.user.id, req.params.id, req.body);
      res.json(out);
    }),
  );

  r.delete(
    '/nodes/:id',
    asyncHandler(async (req, res) => {
      const cascade = req.query.cascade === 'true';
      const out = await clients.metadata.deleteNode(req.user.id, req.params.id, { cascade });
      res.json(out);
    }),
  );

  return r;
}

module.exports = { driveRouter };
