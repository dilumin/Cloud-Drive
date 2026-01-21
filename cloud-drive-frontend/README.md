# Cloud Drive Frontend (React + Vite + Tailwind)

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Open: http://localhost:5173

## Backend configuration

Set `VITE_API_BASE_URL` to your BFF base URL (default `http://localhost:3000`).

## Auth behavior

- Login returns an **access token** (stored in memory + localStorage)
- BFF sets **refresh token** as HttpOnly cookie
- Axios interceptor:
  - attaches access token
  - on 401, calls `/auth/refresh` (cookie), updates access token, retries

## Routes

- `/login`
- `/register`
- `/drive` (redirects to root)
- `/drive/folders/:id` (folder explorer)
