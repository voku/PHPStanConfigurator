# PHPStan Configurator

Interactive PHPStan configuration builder for production PHP projects. The app helps you choose a preset, tune strictness, scan dependency hints, import an existing `phpstan.neon(.dist)`, and export a deterministic configuration with matching CI snippets.

- Live app: https://voku.github.io/PHPStanConfigurator/
- Stack: React 19, TypeScript, Vite, Tailwind CSS, Express

## Features

- Preset-driven PHPStan setup for common application and library profiles
- Interactive strictness controls for PHP version, paths, excludes, baselines, and rule toggles
- Composer dependency scanning to suggest relevant PHPStan extensions
- Neon import/export helpers for `phpstan.neon.dist`
- Built-in CI snippet generator for GitHub Actions, GitLab CI, and Bitbucket Pipelines

## Local development

### Prerequisites

- Node.js 20+ (Node.js 22 recommended)
- npm

### Install

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

The app is served locally at `http://localhost:3000`.

No environment variables are required for the static GitHub Pages build.

## Available scripts

```bash
npm run dev
npm run lint
npm run build
npm run build:pages
npm run start
```

- `npm run lint` runs the TypeScript type check
- `npm run build` creates the production client bundle and the Express server bundle in `dist/`
- `npm run build:pages` creates the static Vite build used for GitHub Pages deployment
- `npm run start` serves the production bundle from `dist/`

## GitHub Pages deployment

This repository includes an automated GitHub Actions workflow that deploys the static Vite build to GitHub Pages on every push to `main`.

Required repository settings:

1. Open **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Push to `main` to trigger a deployment

The workflow uses `npm ci`, runs `npm run build:pages`, uploads `dist/`, and publishes the site automatically.

## Key files

- `src/App.tsx` – main UI and state orchestration
- `src/data/rules.ts` – presets, defaults, and PHPStan level metadata
- `src/lib/neon.ts` – Neon rendering and import parsing logic
- `src/components/ExportModal.tsx` – export UX and Composer install command generation
- `src/components/CiPipelines.tsx` – CI pipeline snippet generation
- `server.ts` – local Express server used outside GitHub Pages deployments
- `.github/workflows/deploy-pages.yml` – automated GitHub Pages deployment

## “Key Files Detector” helper prompt

Use this prompt when you want an assistant to identify the files that matter before wiring PHPStan into a real repository:

```text
You are my Key Files Detector for PHPStan adoption.

Goal:
- Identify the minimum set of files I should inspect before creating or refining phpstan.neon.dist.

Return:
1. Entry points and bootstrap files
2. Composer/autoload files
3. Existing PHPStan, Neon, or CI config files
4. Main source and test directories that should likely go into paths/excludePaths
5. Framework-specific integration files (Symfony, Laravel, Doctrine, PHPUnit, etc.)
6. Dynamic or risky areas that may need extra PHPStan extensions, stubs, or ignores

Rules:
- Prefer concrete file paths over generic advice
- Explain why each file matters in one short sentence
- Highlight anything that would affect PHPStan level, baseline, includes, bootstrapFiles, or scanFiles
- Call out missing files that should probably exist
```

## Build verification

The current production validation commands are:

```bash
npm run lint
npm run build
```
