# Mini ERP — Inventory & Sales Management Frontend

A production-grade ERP frontend for inventory and sales management, built feature-by-feature with a modular architecture.

## Tech Stack

| Concern | Library |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript (strict) |
| Routing | React Router v7 |
| Styling | Tailwind CSS + Shadcn/ui |
| Server state | TanStack Query v5 |
| Client/UI state | Redux Toolkit |
| Real-time | Socket.io-client |
| Unit tests | Vitest + React Testing Library |
| E2E tests | Playwright |
| Package manager | pnpm |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL and VITE_SOCKET_URL

# Start the dev server
pnpm run dev
```

The app runs at `http://localhost:5173`.

## Scripts

| Command | Description |
|---|---|
| `pnpm run dev` | Start Vite dev server |
| `pnpm run build` | Type-check and build for production |
| `pnpm run preview` | Preview the production build |
| `pnpm test` | Run Vitest unit/component tests |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:e2e` | Run Playwright E2E tests |

## Project Structure

```
src/
├── main.tsx                  # Entry point
├── App.tsx                   # Router + providers
├── routes/
│   ├── router.tsx            # Route definitions
│   └── ProtectedRoute.tsx    # Auth guard
├── features/
│   ├── auth/                 # Login, session, auth types
│   ├── products/             # Product CRUD
│   ├── sales/                # Sales management
│   └── dashboard/            # Summary stats
├── components/
│   └── ui/                   # Shadcn primitives
├── lib/
│   ├── api/
│   │   ├── axiosClient.ts    # Base Axios instance + interceptors
│   │   └── queryClient.ts    # TanStack Query config
│   └── socket/
│       └── socketClient.ts   # Socket.io singleton
├── store/
│   ├── store.ts              # Redux store
│   └── slices/               # Redux slices per feature
└── types/                    # Shared TypeScript types
tests/
└── e2e/                      # Playwright specs
```

## Architecture Notes

- **Feature-based modules** — each feature owns its components, hooks, API calls, and types.
- **API layer isolation** — all HTTP calls go through `src/lib/api/axiosClient.ts`. Components never call Axios directly.
- **Server vs. client state** — TanStack Query owns anything fetched from the backend; Redux owns purely UI state (modal open/close, form step, etc.).
- **Single Socket connection** — initialized once via `socketClient.ts`; any feature subscribes to events through hooks without re-connecting.
- **Centralized auth guard** — `ProtectedRoute` is the single place that checks authentication and redirects.

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL for the REST API (e.g. `http://localhost:3000/api`) |
| `VITE_SOCKET_URL` | Socket.io server URL (e.g. `http://localhost:3000`) |
