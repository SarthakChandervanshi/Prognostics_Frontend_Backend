# RUL Dashboard App

Next.js frontend for the Prognostics website and interactive dashboard.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Data Source

This app reads static files from `public/data` (metrics, predictions, global SHAP, local SHAP, and per-engine series).  
No standalone backend service is required for normal usage.

## Deployment

Deploy on Vercel with `rul-dashboard-app` as the root directory.

For full repository documentation (architecture, sections, tech stack), see the root `README.md`.

## Experimentation Dashboard Docs

Detailed documentation for the new experimentation section is in:

- `README-EXPERIMENTATION-DASHBOARD.md`
