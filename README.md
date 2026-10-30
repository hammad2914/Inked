# Inked

A project planner where task dates start in pencil and only become ink when the person doing the work agrees to them.

A manager pencils in a task with a start date and a deadline. The assignee either agrees, which locks the dates, or asks for different ones. Nobody can quietly move a deadline after it has been agreed. The planner shows the state of every task at a glance:

- **pencil:** dates proposed, not agreed yet
- **ink:** agreed and locked
- **done:** finished, with the day it was finished
- **past deadline:** marked in red

The whole wall view puts every project's planner on one page. The reports page writes a short memo about a project with Gemini, and falls back to a plain template when no API key is set.

**Live demo:** open the site and press *Open the demo company*. Every demo login rebuilds a fresh demo company, so feel free to click everything.

## What's inside

```
frontend/   React 18 + Vite + Tailwind web app
backend/    Express + Prisma API, Postgres, Socket.io
```

**Web app:** React 18, TypeScript, Vite, Tailwind, TanStack Query, Zustand, React Hook Form with Zod.

**API:** Express, TypeScript, Prisma with Postgres, JWT access tokens plus an httpOnly refresh cookie, Socket.io for live notifications, Brevo for email, Gemini for reports, Puppeteer for report PDFs.

Other things the API does:

- **Roles:** company admin, project admin and member, checked on every route.
- **Invitations:** invited people get an email link and set their own password.
- **Overdue check:** every five minutes the server marks tasks past their deadline.
- **HR sync:** a company can point Inked at its HR system's employee list (JSON) and invite everyone in one go.
- **Activity log:** every change is recorded and shown on the dashboard.

## Running it locally

You need Node 22 (22.12 or newer) and a Postgres database (a free [Neon](https://neon.tech) database works).

**1. API**

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=any-long-random-string
JWT_REFRESH_SECRET=another-long-random-string
FRONTEND_URL=http://localhost:5173
PORT=4000

# optional
BREVO_API_KEY=          # without it, emails fail quietly and are logged
BREVO_FROM_EMAIL=
GEMINI_API_KEY=         # without it, reports use the template
```

```bash
npx prisma migrate deploy
npm run dev
```

**2. Web app**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. In development, Vite forwards `/api` to the API on port 4000. Set `API_TARGET` to change that address.

## Deploying

The web app runs on Vercel and the API on Render.

The web app calls the API through its own domain: `frontend/vercel.json` rewrites `/api/*` to the Render service. This keeps the refresh cookie first-party, so reloading the page doesn't sign you out. If you deploy the API somewhere else, change the address in that file.

Environment variables on Vercel:

| Variable | Value |
|---|---|
| `VITE_SOCKET_URL` | the API's public URL, for live notifications |
| `VITE_API_BASE_URL` | leave unset, so calls go through the rewrite |

On Render, set the API variables from the list above, with `FRONTEND_URL` set to the Vercel address.
