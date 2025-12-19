# File Service (Upload + Versions + S3)

This microservice stores file bytes in S3-compatible storage (MinIO/AWS S3) and manages:
- Resumable multipart uploads
- Idempotent finalize
- File versions per `fileNodeId` (from Metadata Service)
- Presigned upload/download URLs

No auth yet — use `x-owner-id` header.

## Quick Start
1) Start infra:
```bash
docker compose up -d
```

2) Install + env:
```bash
npm install
cp .env.example .env
```

3) Migrate + run:
```bash
npm run prisma:migrate
npm run start:dev
```

Service: http://localhost:3002

## Requires Metadata Service
Set `METADATA_BASE_URL` (default http://localhost:3001). This service validates:
`GET {METADATA_BASE_URL}/nodes/:id` with `x-owner-id`.

## Endpoints
All require header `x-owner-id: 1`

- POST /uploads/initiate
- GET  /uploads/:sessionId
- GET  /uploads/:sessionId/part-url?partNumber=1
- POST /uploads/:sessionId/complete
- POST /uploads/:sessionId/abort

- GET  /files/:fileNodeId/versions
- GET  /files/:fileNodeId/download
- GET  /files/:fileNodeId/versions/:versionNo/download

## S3 Key Strategy
`owners/{ownerId}/nodes/{fileNodeId}/versions/{versionNo}`
Renames/moves in Metadata do not touch S3 objects.
