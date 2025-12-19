-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('FOLDER', 'FILE');

-- CreateTable
CREATE TABLE "nodes" (
  "id" BIGSERIAL NOT NULL,
  "owner_id" BIGINT NOT NULL,
  "type" "NodeType" NOT NULL,
  "parent_id" BIGINT,
  "name" TEXT NOT NULL,
  "is_root" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMPTZ,
  "row_version" BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- Foreign key
ALTER TABLE "nodes"
ADD CONSTRAINT "nodes_parent_id_fkey"
FOREIGN KEY ("parent_id") REFERENCES "nodes"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "idx_children_owner_parent_created"
ON "nodes" ("owner_id", "parent_id", "created_at")
WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_owner_parent_name"
ON "nodes" ("owner_id", "parent_id", "name");

-- Enforce unique active name within a folder, per owner
CREATE UNIQUE INDEX "uniq_active_name_in_folder"
ON "nodes" ("owner_id", "parent_id", "name")
WHERE "deleted_at" IS NULL;

-- Enforce 1 active root per owner
CREATE UNIQUE INDEX "uniq_active_root_per_owner"
ON "nodes" ("owner_id")
WHERE "is_root" = true AND "deleted_at" IS NULL;
