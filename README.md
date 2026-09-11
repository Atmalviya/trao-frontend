# AI Interview Prep Kit — Frontend

Next.js + Tailwind UI for the Trao full-stack assessment. Pairs with the [backend repo](../backend/) (separate GitHub submission).

## Stack

- Next.js 15 (App Router)
- Tailwind CSS 4
- TanStack Query (server state + optimistic edits)
- @dnd-kit (keyboard-accessible reorder)
- Session auth via HTTP-only cookie (`credentials: include`)

## Setup

```bash
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your backend (default http://localhost:4000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Ensure the backend is running with `WEB_ORIGIN=http://localhost:3000`.

## Features

- Register / login / logout
- Dashboard of your kits
- Create kit (JD + company URL + days)
- Batch upload (JSON array of cases)
- Live generation progress (SSE)
- Builder: inline edit, drag reorder, pin, add/delete, per-section regenerate
- Practice mode with confidence tracking
- Study schedule view

Architecture, pipeline, and batch CLI are documented in the backend README.
