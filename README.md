# BA II Plus Web Calculator

A responsive BA II Plus-style calculator built with plain HTML, CSS, and JavaScript.

## Features

- Basic calculator operations with keyboard support
- TVM mode to compute one unknown among N, I/Y, PV, PMT, FV
- Mobile-friendly responsive layout
- GitHub Pages-ready (no build step required)

## Run locally

Open `index.html` directly in your browser, or use a static server.

## Deploy to GitHub Pages (Recommended)

This repo includes `.github/workflows/deploy.yml` so your site auto-deploys on every push to `main`.

1. Create a new GitHub repository.
2. Push all files in this folder to the `main` branch.
3. In GitHub: `Settings` -> `Pages`.
4. Under `Build and deployment`, set `Source` to `GitHub Actions`.
5. Push once (or re-run the workflow in the `Actions` tab).
6. Wait for the `Deploy to GitHub Pages` workflow to complete.

Your site will be available at:

`https://<your-username>.github.io/<repo-name>/`

## Quick Publish Commands

```bash
cd /Users/parthkhanna/ba2plus-calculator
git init
git add .
git commit -m "Add BA II Plus responsive web calculator"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```
