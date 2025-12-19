# Metadata Service (Drive brain)

A standalone Node.js microservice that manages **folders/files hierarchy metadata** (tree) for a Drive-like system.

- **Canonical hierarchy model:** adjacency list (`parent_id`)
- **Strong invariants:** unique names within a folder (per owner), cycle-safe moves, soft deletes
- **No auth yet:** pass `x-owner-id` header to simulate multi-tenant users
- **Storage bytes (S3/MinIO) are NOT handled here** — only metadata.

## Quick Start (local)

### 1) Start Postgres
```bash
docker compose up -d postgres
```

### 2) Install deps
```bash
npm install
cp .env.example .env
```

### 3) Run migrations + start service
```bash
npm run prisma:migrate
npm run start:dev
```

Service: `http://localhost:3001`

## API (core)

All requests must include a header:
```
x-owner-id: 1
```

### Ensure root folder
`GET /nodes/root`

### Create folder
`POST /nodes/folders`
```json
{ "parentId": "1", "name": "projects" }
```

### Create file placeholder node
`POST /nodes/files`
```json
{ "parentId": "1", "name": "report.pdf" }
```

### List folder children (cursor pagination)
`GET /nodes/:id/children?limit=50&cursor=...`

### Rename node (optimistic lock optional)
`PATCH /nodes/:id/rename`
```json
{ "name": "new-name", "expectedRowVersion": "0" }
```

### Move node (cycle-safe)
`POST /nodes/:id/move`
```json
{ "newParentId": "2", "expectedRowVersion": "0" }
```

### Soft delete (folder delete cascades by default)
`DELETE /nodes/:id?cascade=true`

## Notes

- **S3 mapping:** store `storage_key` on a separate `file_versions` table in another service (upload/version service). Metadata only provides stable `file_node_id` for that mapping.
- IDs are `BIGINT` in DB; the API returns them as strings to avoid JSON bigint issues.

## License
MIT
