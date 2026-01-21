const { z } = require('zod');

const createFolderSchema = z.object({
  parentId: z.string().regex(/^[0-9]+$/),
  name: z.string().min(1).max(255),
});

const initiateUploadSchema = z.object({
  parentId: z.string().regex(/^[0-9]+$/),
  name: z.string().min(1).max(255),
  totalSize: z.string().regex(/^[0-9]+$/),
  mimeType: z.string().optional(),
});

const completeUploadSchema = z.object({
  parts: z.array(
    z.object({
      partNumber: z.number().int().min(1),
      etag: z.string().min(1),
    }),
  ).min(1),
});

const renameSchema = z.object({
  name: z.string().min(1).max(255),
});

const moveSchema = z.object({
  parentId: z.string().regex(/^[0-9]+$/),
});

module.exports = {
  createFolderSchema,
  initiateUploadSchema,
  completeUploadSchema,
  renameSchema,
  moveSchema,
};
