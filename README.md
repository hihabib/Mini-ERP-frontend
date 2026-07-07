# Mini-ERP Frontend

This repository contains the frontend client for the Mini-ERP (Inventory & Sales Management System). It provides a responsive, role-based dashboard for managing products, generating sales, and viewing real-time analytics.

## Tech Stack

- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **Routing:** React Router v7
- **Styling:** Tailwind CSS & Shadcn UI
- **Server State Management:** TanStack Query (React Query)
- **Client State Management:** Redux Toolkit (minimal usage, primarily for session/auth sync)
- **Forms & Validation:** React Hook Form & Zod
- **Real-Time Updates:** Socket.io-client
- **Testing:** Vitest (Unit/Integration) & Playwright (E2E)
- **Linting & Formatting:** ESLint & Prettier

## Prerequisites

- Node.js (v18+)
- `pnpm` package manager
- **Running Backend API**: The frontend expects the backend server (and its MongoDB replica set) to be running. By default, it expects the API at `http://localhost:5000`.

## Getting Started

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` (or create one) and set your API URL:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start the Development Server:**
   ```bash
   pnpm run dev
   ```

## Available Scripts

- `pnpm run dev`: Starts the Vite development server.
- `pnpm run build`: Type-checks and builds the production bundle.
- `pnpm run preview`: Previews the production build locally.
- `pnpm run test`: Runs the Vitest unit & component test suite.
- `pnpm run test:coverage`: Runs Vitest with coverage report generation.
- `pnpm run test:e2e`: Runs the Playwright end-to-end tests.
- `pnpm run lint`: Runs ESLint checks.
- `pnpm run typecheck`: Runs TypeScript type checking.

## Project Structure

The frontend follows a feature-driven architecture.

```
src/
├── components/       # Shared UI components (Shadcn components, layouts)
├── features/         # Feature modules (auth, dashboard, products, sales)
│   ├── auth/         # Login forms, session initializer, auth hooks
│   ├── dashboard/    # Analytics views, stats, low stock lists
│   ├── products/     # Product catalog, forms, and stock updates
│   └── sales/        # POS interface, cart, sale history tables
├── lib/              # Utilities, Axios instances, SocketProvider
├── routes/           # React Router configuration and ProtectedRoutes
├── store/            # Redux store (authSlice)
└── tests/            # E2E Playwright tests and global setups
```

## Roles & Permissions

The UI is strictly role-gated based on permissions retrieved from the backend:

- **Admin**: Has full access. Can create/edit/delete products and view full sale history.
- **Manager**: Can create/edit products but generally cannot delete them.
- **Employee**: Can view products and create sales (POS), but cannot access the Sale History page or create new products.

These permissions are checked dynamically via the `usePermission` hook, which conditionally renders UI elements like the "Add Product" button or specific navigation links.

## Real-Time Architecture

The application maintains a long-lived WebSocket connection to the backend via `Socket.io`.
When a sale occurs anywhere in the system, a `stock:updated` event is broadcast. The frontend intercepts this in the `useStockUpdates` hook and instantly patches the local TanStack Query cache. This ensures that all connected clients see live inventory reductions without needing to manually refresh or poll the server.

## Testing

We enforce a strict Test-Driven Development (TDD) cycle. The frontend uses `msw` (or `axios-mock-adapter`) for mocking network requests in Vitest.
Coverage thresholds are strictly enforced:

- Statements: 70%
- Branches: 65%
- Functions: 70%
- Lines: 70%

Run `pnpm run test` or `pnpm run test:coverage` to execute unit tests.
Run `pnpm run test:e2e` to execute Playwright integration flows.

## Known Limitations

- The current deployment assumes a single monolithic backend URL.
- Sale History is restricted to users with the `sale:view` permission (typically Admins/Managers).
