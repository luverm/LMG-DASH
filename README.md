# LMG-DASH

Dashboard web app built with React, TypeScript and Vite.

## Getting started

Requires Node 22 (see `.nvmrc`).

```sh
npm install
cp .env.example .env.local   # optional: point at your API
npm run dev
```

## Scripts

| Command                | What it does                   |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Start the dev server           |
| `npm run build`        | Typecheck and build to `dist/` |
| `npm run preview`      | Serve the production build     |
| `npm run lint`         | Lint with oxlint               |
| `npm run format`       | Format with Prettier           |
| `npm run format:check` | Check formatting (used in CI)  |
| `npm run typecheck`    | Run the TypeScript compiler    |
| `npm test`             | Run tests once with Vitest     |
| `npm run test:watch`   | Run tests in watch mode        |

## Project structure

```
src/
  app/            App shell: root component, router, route table, nav items
  components/
    layout/       AppLayout, Header, Sidebar
    ui/           Reusable presentational components (Card, ...)
  features/       One folder per dashboard area (page, widgets, hooks, tests)
    overview/
  pages/          Standalone pages not tied to a feature (e.g. 404)
  hooks/          Shared React hooks
  lib/            Framework-agnostic helpers (API client, formatting, ...)
  types/          Shared TypeScript types
  styles/         Global CSS and design tokens
  test/           Test setup
```

Imports use the `@/` alias for `src/` (e.g. `import { Card } from '@/components/ui/Card'`).

### Adding a dashboard page

1. Create `src/features/<name>/<Name>Page.tsx`.
2. Register the route in `src/app/routes.tsx`.
3. Add a sidebar entry in `src/app/navigation.ts`.

## Configuration

Environment variables live in `.env.local` (git-ignored). Only `VITE_`-prefixed variables reach the browser; see `.env.example`.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint, format check, typecheck, tests and build on every PR and on pushes to `main`.
