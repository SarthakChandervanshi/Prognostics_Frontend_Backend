# Prognostics Frontend + Artifacts

Interactive website and dashboard for Remaining Useful Life (RUL) prognostics on NASA C-MAPSS FD001, with uncertainty-aware predictions and SHAP-based interpretability.

## Project Overview

This repository contains:

- A production-ready Next.js website and dashboard in `rul-dashboard-app`
- Precomputed model outputs and supporting artifacts in `data`
- Static JSON data used by the dashboard for metrics, predictions, and explanations

The frontend is presentation-focused: it reads exported JSON files and does not run model training in the browser.

## Repository Structure

- `rul-dashboard-app/` - Next.js application (website + interactive dashboard)
- `data/` - model and export artifacts (metrics, SHAP outputs, per-engine series, docs)
- `LICENSE` - license file

Inside `rul-dashboard-app`:

- `app/` - route pages (`/`, `/dashboard`, and anchor-redirect pages)
- `components/` - UI sections and dashboard modules
- `lib/` - typed data loading helpers and shared utilities
- `public/data/` - static dashboard payloads:
  - `metrics.json`
  - `predictions.json`
  - `shap_global.json`
  - `shap_local/*.json`
  - `engine_series/*.json`
  - `literature.json`

## Website Sections

Main route (`/`) includes:

- Hero with key benchmark metrics
- Problem context and reliability motivation
- Method workflow and step-by-step pipeline cards
- Results charts (RMSE, coverage, phase performance)
- Global SHAP interpretability view
- Literature comparison table

## Dashboard Features

Dashboard route (`/dashboard`) includes:

- Engine selector and per-engine metrics
- Quantile interval visualization (low/median/high vs true RUL)
- Sensor trend exploration (raw vs smoothed)
- Local vs global SHAP feature attribution
- Phase split/capping rationale visual

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4, custom theme tokens
- **Charts:** Recharts
- **Motion/UX:** Framer Motion
- **State:** Zustand
- **UI primitives:** Radix/base-ui based components
- **Icons:** Lucide React
- **Linting:** ESLint 9 + `eslint-config-next`

## Run Locally

From the project root:

```bash
cd "rul-dashboard-app"
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build and Quality Checks

```bash
cd "rul-dashboard-app"
npm run lint
npm run build
```

## Data Flow

1. Precomputed outputs are exported as JSON.
2. JSON files are stored in `rul-dashboard-app/public/data`.
3. Server components load core files via `lib/data.ts`.
4. Client components render interactive charts and controls.

No separate backend service is required for normal hosting of this frontend.

## Deployment (Free)

Recommended: **Vercel (Hobby plan)**.

1. Push repository to GitHub.
2. Import `rul-dashboard-app` as the project root in Vercel.
3. Deploy with default Next.js build settings.

GitHub Pages is possible only with static-export constraints; Vercel is preferred for this Next.js app.

## Repository Hygiene

- Removed unused UI components and placeholder assets from `rul-dashboard-app`.
- Removed unused helper module `rul-dashboard-app/lib/stats.ts`.
- Added ignore rules for local Vercel CLI cache directories:
  - `.vercel-local/`
  - `**/.vercel-local/`

