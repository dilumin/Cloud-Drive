# Cloud Drive BFF (Express, JavaScript)

A production-style Backend-for-Frontend for the Cloud Drive platform.

## What it does
- **Authentication**: register/login, JWT access token + rotating refresh tokens (stored server-side)
- **API Composition**: single frontend-facing API that calls:
  - Metadata Service (folders/files namespace)
  - File Service (uploads, versions, S3 presigned URLs)
- **Consistent errors & request tracing**: requestId, normalized error responses

## Prerequisites
- Node.js 18+ (Node 20 recommended)
- PostgreSQL running locally or remotely

## Setup
```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Server runs on `http://localhost:3000`.

## Auth flow
- `POST /auth/register` → creates user
- `POST /auth/login` → returns access token + sets refresh token cookie
- `POST /auth/refresh` → rotates refresh token, returns new access token
- `POST /auth/logout` → revokes refresh token

> Access token is sent in `Authorization: Bearer <token>` for protected routes.
> Refresh token is stored as an **HttpOnly cookie** (`REFRESH_COOKIE_NAME`).

## Drive endpoints (BFF)
All require `Authorization: Bearer <accessToken>` unless stated.

- `GET    /drive/root`
- `GET    /drive/folders/:id?limit=50&cursor=...` (composes metadata + latest versions)
- `POST   /drive/folders`  { parentId, name }
- `POST   /drive/files/initiate-upload` { parentId, name, totalSize, mimeType? }
- `GET    /drive/uploads/:sessionId/part-url?partNumber=1`
- `POST   /drive/uploads/:sessionId/complete` { parts:[{partNumber, etag}] }
- `POST   /drive/uploads/:sessionId/abort`
- `GET    /drive/files/:fileNodeId/download`
- `GET    /drive/files/:fileNodeId/versions/:versionNo/download`
- `PATCH  /drive/nodes/:id/rename` { name }
- `POST   /drive/nodes/:id/move` { parentId }
- `DELETE /drive/nodes/:id?cascade=true`

## Notes
- This BFF forwards the authenticated user id as `x-owner-id` to downstream services.
- You can later add internal auth (HMAC or API key) between services using `INTERNAL_API_KEY`.
