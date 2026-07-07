# Mini ERP Frontend — Claude Code Instructions

## Tech Stack

| Layer                | Tool                           |
| -------------------- | ------------------------------ |
| Framework            | React 18 + Vite                |
| Language             | TypeScript (strict)            |
| Routing              | React Router v7                |
| Styling              | Tailwind CSS + Shadcn/ui       |
| Server state         | TanStack Query v5              |
| Client/UI state      | Redux Toolkit                  |
| Real-time            | Socket.io-client               |
| Unit/Component tests | Vitest + React Testing Library |
| E2E tests            | Playwright                     |
| Package manager      | npm                            |

## Architectural Principles

### 1. Feature-based modules

Organize by business feature (`auth`, `products`, `sales`, `dashboard`), not by technical type. Each feature folder owns its own components, hooks, API calls, and types.

```
src/features/<feature>/
  components/   # React components
  hooks/        # Custom hooks
  api.ts        # All API calls for this feature
  types.ts      # TypeScript types
  *.test.tsx    # Component tests
```

### 2. Server state vs. client state — NEVER MIX

- **TanStack Query** owns anything that comes from the backend (products, sales, dashboard stats, user session). Use `useQuery` / `useMutation`.
- **Redux Toolkit** owns purely UI-local state (modal open/closed, active tab, form step, notification queue). Use slices in `src/store/slices/`.
- **Local `useState`** is fine for ephemeral, single-component state (e.g. a controlled input).

### 3. API layer isolation

All HTTP calls go through `src/lib/api/axiosClient.ts`. **Components never call Axios or fetch directly.** The API layer is the only place that knows about endpoints, base URLs, and auth headers.

Feature API files (`src/features/<feature>/api.ts`) call `axiosClient` and are the only callers of the HTTP layer from feature code.

### 4. Environment variables

All `import.meta.env` reads are centralized in `src/config/env.ts`. Every other file imports from there. Never read `import.meta.env` directly in components, hooks, or lib files.

### 5. Centralized route protection

A single `ProtectedRoute` component (`src/routes/ProtectedRoute.tsx`) checks auth + role. Individual pages do not contain auth redirect logic.

### 6. Real-time by design

The Socket.io connection is initialized once via `src/lib/socket/socketClient.ts` and exposed through a hook/context. Features subscribe to events via hooks — never create new socket connections inside components.

### 7. Reusable UI primitives

Build on Shadcn components in `src/components/ui/`. Do not duplicate one-off buttons, inputs, or modals across features.

## Testing

### Test structure

Follow the standard template in `docs/testing/frontend-feature-test-template.md` for every new feature test file. Say "follow the standard feature test template" in prompts rather than re-explaining the structure.

Every component with logic needs:

- A negative permission test (UI element is **absent** for an unauthorized role)
- An error-path test for every mutation (API rejection shows correct UI)
- A socket-state-change test for any real-time hook (proves the event changes cache/UI, not just that a handler was registered)

### Coverage thresholds (enforced by CI via `pnpm test:coverage`)

| Metric     | Minimum |
| ---------- | ------- |
| Statements | 70%     |
| Branches   | 65%     |
| Functions  | 70%     |
| Lines      | 70%     |

Excluded from thresholds: `src/main.tsx`, `src/App.tsx`, `src/components/ui/**` (Shadcn primitives), `src/routes/router.tsx` (declarative config), `src/types/**` (pure TS declarations).

## Definition of Done

A feature is **not complete** until all of the following are true:

- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm typecheck` passes with zero errors
- [ ] Component tests pass (`pnpm test`) — required wherever the component has logic
- [ ] `pnpm test:coverage` passes with all thresholds met
- [ ] Relevant E2E spec passes or is added (`pnpm test:e2e`) — required for every major user flow
- [ ] `README.md` updated if setup steps or env variables changed

## AI Tooling

### Workflow Plugins

| Plugin              | When to use                                                           |
| ------------------- | --------------------------------------------------------------------- |
| `superpowers`       | Enforced planning + TDD + review workflow for any non-trivial feature |
| `frontend-design`   | Any new UI work — avoids generic/templated visual output              |
| `feature-dev`       | Standard feature implementation loop                                  |
| `code-review`       | Review working-tree diff before commit                                |
| `pr-review-toolkit` | Full PR review checklist                                              |
| `security-guidance` | Any auth, session, input-handling, or API security question           |
| `typescript-lsp`    | TypeScript type errors, inference questions, complex generics         |
| `commit-commands`   | Conventional commit message generation                                |
| `github`            | PR creation, branch management, CI status                             |

### MCP Servers

**Playwright MCP** — Used to drive real browser sessions for manual-style verification and for authoring E2E specs interactively. Invoke when confirming a new UI flow works end-to-end or when a Playwright test needs to be written from a live session.

**Context7 MCP** — Pull current documentation before writing code that touches these libraries: React Router, TanStack Query, Redux Toolkit, Tailwind CSS, Shadcn/ui, Axios, Socket.io. Training data may be stale; always fetch docs for API calls, config options, and migration patterns.

## Key File Locations

| File                             | Purpose                                                               |
| -------------------------------- | --------------------------------------------------------------------- |
| `src/config/env.ts`              | Typed, validated env object — import from here, not `import.meta.env` |
| `src/lib/api/axiosClient.ts`     | Base Axios instance with auth interceptor                             |
| `src/lib/api/queryClient.ts`     | TanStack Query client config                                          |
| `src/lib/socket/socketClient.ts` | Socket.io singleton                                                   |
| `src/store/store.ts`             | Redux store                                                           |
| `src/routes/router.tsx`          | All route definitions                                                 |
| `src/routes/ProtectedRoute.tsx`  | Auth guard — implement logic here                                     |
