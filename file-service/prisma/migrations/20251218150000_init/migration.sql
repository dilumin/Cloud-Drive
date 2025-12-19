CREATE TYPE "UploadStatus" AS ENUM ('INITIATED','UPLOADING','FINALIZING','COMPLETED','ABORTED');

CREATE TABLE "upload_sessions" (
  "id" BIGSERIAL PRIMARY KEY,
  "owner_id" BIGINT NOT NULL,
  "file_node_id" BIGINT NOT NULL,
  "version_no" INTEGER NOT NULL,
  "status" "UploadStatus" NOT NULL DEFAULT 'UPLOADING',
  "bucket" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "upload_id" TEXT NOT NULL,
  "part_size" INTEGER NOT NULL,
  "total_size" BIGINT NOT NULL,
  "mime_type" TEXT,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "completed_at" TIMESTAMPTZ,
  "aborted_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "file_versions" (
  "id" BIGSERIAL PRIMARY KEY,
  "owner_id" BIGINT NOT NULL,
  "file_node_id" BIGINT NOT NULL,
  "version_no" INTEGER NOT NULL,
  "bucket" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "size_bytes" BIGINT NOT NULL,
  "checksum" TEXT,
  "mime_type" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "idx_sessions_owner_file" ON "upload_sessions" ("owner_id", "file_node_id");
CREATE UNIQUE INDEX "uniq_session_owner_file_version" ON "upload_sessions" ("owner_id","file_node_id","version_no");

CREATE UNIQUE INDEX "uniq_version_owner_file_versionno" ON "file_versions" ("owner_id","file_node_id","version_no");
CREATE INDEX "idx_versions_owner_file_created" ON "file_versions" ("owner_id","file_node_id","created_at");
