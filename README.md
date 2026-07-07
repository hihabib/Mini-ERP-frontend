# Mini ERP — Inventory & Sales Management Frontend

A production-grade ERP frontend for inventory and sales management, built feature-by-feature with a modular architecture.

## Tech Stack

| Concern         | Library                        |
| --------------- | ------------------------------ |
| Framework       | React 18 + Vite                |
| Language        | TypeScript (strict)            |
| Routing         | React Router v7                |
| Styling         | Tailwind CSS + Shadcn/ui       |
| Server state    | TanStack Query v5              |
| Client/UI state | Redux Toolkit                  |
| Real-time       | Socket.io-client               |
| Unit tests      | Vitest + React Testing Library |
| E2E tests       | Playwright                     |
| Package manager | pnpm                           |

## Prerequisites

- Node.js 20+
- pnpm 11+ (`npm i -g pnpm`)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set:

| Variable            | Description          | Example                     |
| ------------------- | -------------------- | --------------------------- |
| `VITE_API_BASE_URL` | REST API base URL    | `http://localhost:8000/api` |
| `VITE_SOCKET_URL`   | Socket.io server URL | `http://localhost:8000`     |

### 3. Install Playwright browser binaries (first time only)

```bash
pnpm exec playwright install chromium
```

## Scripts

| Command               | Description                                   |
| --------------------- | --------------------------------------------- |
| `pnpm run dev`        | Start Vite dev server (http://localhost:5173) |
| `pnpm run build`      | Type-check and build for production           |
| `pnpm run preview`    | Preview the production build locally          |
| `pnpm test`           | Run Vitest component/unit tests               |
| `pnpm run test:watch` | Run Vitest in watch mode                      |
| `pnpm run test:e2e`   | Run Playwright E2E tests                      |
| `pnpm run lint`       | Run ESLint across all TypeScript files        |
| `pnpm run lint:fix`   | Run ESLint and auto-fix fixable issues        |
| `pnpm run format`     | Format all files with Prettier                |
| `pnpm run typecheck`  | Run TypeScript compiler check without emit    |

## Git Hooks

Husky hooks run automatically on git operations:

- **pre-commit**: ESLint + Prettier on staged files (via lint-staged), then `tsc --noEmit`
- **pre-push**: full `pnpm test` (component tests)

E2E tests run in CI on every push (see `.github/workflows/ci.yml`).

## Project Structure

```
src/
├── config/
│   └── env.ts                # Typed, validated env variables — import from here
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
- **Env isolation** — all `import.meta.env` reads go through `src/config/env.ts`. Other files never access `import.meta.env`.
- **Server vs. client state** — TanStack Query owns fetched data; Redux owns purely UI state (modals, tabs, form steps).
- **Single Socket connection** — initialized once via `socketClient.ts`; features subscribe through hooks.
- **Centralized auth guard** — `ProtectedRoute` is the single place that checks authentication and redirects.
