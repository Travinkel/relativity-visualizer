# Deployment (GitHub Pages)

This project uses Vite + React. It is configured to deploy automatically to GitHub Pages.

## How it works
- `vite.config.ts` sets `base` to `/relativity-visualizer/` so assets resolve correctly when hosted at `https://<username>.github.io/relativity-visualizer/`.
- GitHub Actions workflow `.github/workflows/deploy.yml` builds the site and publishes the `dist/` folder to the `gh-pages` branch on every push to `main` (or `master`).

## One-time repo settings
1. In GitHub → Settings → Pages:
   - Source: Deploy from a branch
   - Branch: `gh-pages` (root)
2. Save and wait ~1 minute.

## Deploy
- On push to `main`/`master`, the workflow will build and publish automatically.
- Or run locally:
  - `npm ci`
  - `npm run build`
  - Serve `dist/` locally for preview with `npm run preview`.

## Live URL
`https://<your-username>.github.io/relativity-visualizer/`

If your repository name changes, update `base` in `vite.config.ts` accordingly.
