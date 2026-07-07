# Mini-ERP Frontend

A modern, responsive, and highly interactive user interface for the Mini-ERP application. Built with React, Vite, Tailwind CSS, and Shadcn UI.

## 🚀 Features

- **Dashboard**: Real-time statistics, recent sales activity, and low-stock alerts. (Restricted to Admin role).
- **User Management**: Admins can create users, assign roles, and toggle account status. Admins cannot deactivate their own account.
- **Inventory Management**: Paginated product listings, advanced filtering, and product creation/editing forms with image uploads.
- **Point of Sale (POS)**: A responsive interface to create sales with live subtotal calculations and stock availability validation.
- **Real-Time Sync**: Automatically reflects stock changes and new sales immediately across all tabs using WebSockets.
- **Role-Based Access**: Dynamically renders UI elements and navigation based on user permissions:
  - **Admin**: Full access, including User Management and Dashboard stats.
  - **Manager**: Can manage products and process sales.
  - **Employee**: Can view products and process sales.
- **Responsive Design**: Fully functional and polished on both desktop and mobile devices.

## 🛠️ Technology Stack

- **Framework**: React 18, Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **State Management**: Redux Toolkit (Auth/Session) & React Query (Server State)
- **Routing**: React Router v7
- **Form Handling**: React Hook Form & Zod
- **Testing**: Vitest (Unit) & Playwright (End-to-End)

## 🔑 Demo Accounts

The login page includes quick-fill buttons for each role. Click a role button to pre-fill the credentials, then press **Sign in**.

| Role     | Email                 | Password       |
| -------- | --------------------- | -------------- |
| Admin    | admin@mini-erp.dev    | Admin@1234!    |
| Manager  | manager@mini-erp.dev  | Manager@1234!  |
| Employee | employee@mini-erp.dev | Employee@1234! |

## 📋 Project Setup & Installation Guide

### Prerequisites

- Node.js (v22 or higher)
- pnpm (v11 or higher)

### 1. Installation

Install the project dependencies:

```bash
pnpm install
```

### 2. Configuration

Create a `.env` file in the root of the frontend project:

```bash
cp .env.example .env
```

Ensure it contains the correct URLs pointing to your running backend:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SOCKET_URL=http://localhost:8000
```

_(Note: Adjust these URLs if your backend is hosted remotely.)_

### 3. Running the Application

**Development Mode**:

```bash
pnpm dev
```

The application will typically start at `http://localhost:5173`.

**Production Build**:
To create and preview a production-optimized build:

```bash
pnpm build
pnpm preview
```

## 🧪 Testing

The frontend features a comprehensive test suite including both unit and end-to-end tests.

**Unit & Component Tests** (Vitest):

```bash
pnpm test
pnpm test:coverage
```

**End-to-End Tests** (Playwright):
Ensure the backend is running and the database is seeded before executing E2E tests.

```bash
pnpm test:e2e
```
