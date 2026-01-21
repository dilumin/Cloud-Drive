# Drive Microservices

Cloud-drive style system built as small, focused services. Today it includes the Metadata Service (tree/namespace) and File Service (uploads + S3/MinIO). A BFF gateway and React frontend will sit on top, with more backend services coming online.

![Architecture Diagram](assets/architecture.png)

## Repo layout

- `metadata-service/` – Drive brain: folders/files hierarchy, moves/renames, soft deletes.
- `file-service/` – Upload and version service: multipart upload, presigned URLs, file versions in S3/MinIO.
- `bff/` (planned) – Single entry point that fronts all services.
- `web-frontend/` (planned) – React client that talks to the BFF.

## Architecture at a glance

- Requests will enter through the BFF, which calls Metadata Service for namespace validation and File Service for upload/download URLs.
- Data stores: Postgres for metadata (`5432`) and file uploads (`5433`), MinIO for object storage (`9000/9001`). Ports are set in each service's `docker-compose.yml`.
- Tenant simulation header: `x-owner-id` (required by existing services; no auth layer yet).

## Services (current)

### Metadata Service (`metadata-service/`, :3001)

- Owns folder/file hierarchy, rename/move/delete, cursor-based listing, and version pointers.
- Model: adjacency list (`parent_id`); upgrade to closure table only if ancestor queries become a bottleneck.
- Key tables: `nodes` (folder/file entries) and, optionally, `file_versions` if you colocate that here.
- Learn/consider: Postgres indexing and unique constraints (`parent_id,name,owner_id`), transactions + optimistic locking, recursive CTEs for ancestors/paths, cursor pagination.
- Run locally:
  - `cd metadata-service && npm install && cp .env`
  - `docker compose up -d postgres`
  - `npm run prisma:migrate && npm run start:dev` (service on `http://localhost:3001`)

### File Service (`file-service/`, :3002)

- Combines storage abstraction and upload coordination: presigned URLs, multipart upload, idempotent finalize/abort, and file version records keyed by `fileNodeId` from Metadata Service.
- S3/MinIO key strategy: `owners/{ownerId}/nodes/{fileNodeId}/versions/{versionNo}`; moves in metadata never rewrite objects.
- Learn/consider: multipart upload (part numbers, ETags), presigned URL security (expiry, content-type constraints), idempotency keys, simple state machine for sessions (INITIATED → UPLOADING → FINALIZING → COMPLETED/ABORTED), Redis/distributed locks if finalize races appear.
- Run locally:
  - `cd file-service && npm install && cp  .env`
  - `docker compose up -d postgres minio minio-init` (Postgres `5433`, MinIO `9000/9001`)
  - Set `METADATA_BASE_URL` (default `http://localhost:3001`), then `npm run prisma:migrate && npm run start:dev` (service on `http://localhost:3002`)
