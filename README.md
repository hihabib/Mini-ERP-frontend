# Mini-ERP Frontend

A modern, responsive, and highly interactive user interface for the Mini-ERP application. Built with React, Vite, Tailwind CSS, and Shadcn UI.

## Features

- **Dashboard**: Real-time statistics, recent sales activity, and low-stock alerts.
- **Inventory Management**: Paginated product listings, advanced filtering, and product creation/editing forms with image uploads.
- **Point of Sale (POS)**: A responsive interface to create sales with live subtotal calculations.
- **Real-Time Sync**: Automatically reflects stock changes and new sales immediately across all tabs using WebSockets.
- **Role-Based Access**: Dynamically renders UI elements and navigation based on user permissions.
- **Responsive Design**: Fully functional and polished on both desktop and mobile devices.

## Technology Stack

- **Framework**: React 18, Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **State Management**: Redux Toolkit (Auth/Session) & React Query (Server State)
- **Routing**: React Router v7
- **Form Handling**: React Hook Form & Zod
- **Testing**: Vitest (Unit) & Playwright (E2E)

## Project Setup & Installation

### Prerequisites

- Node.js (v22+)
- pnpm (v11+)

### Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Configure environment variables:
   Create a `.env` file in the root of the project:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_SOCKET_URL=http://localhost:8000
   ```
   _Note: Adjust these URLs if your backend is hosted remotely (e.g., `http://148.113.44.221:1500`)._

### Running the Application

**Development Mode**:

```bash
pnpm dev
```

**Production Build**:

```bash
pnpm build
pnpm preview
```

### Testing

**Unit Tests**:

```bash
pnpm test
pnpm test:coverage
```

**End-to-End Tests** (Playwright):

```bash
pnpm test:e2e
```
