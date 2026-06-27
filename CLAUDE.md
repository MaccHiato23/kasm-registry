# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a **Kasm Workspaces Registry** — a GitHub Pages-hosted storefront for custom Docker-based workspaces that integrate with [Kasm Workspaces](https://kasmweb.com). The repo has two main parts:

1. **`workspaces/`** — workspace definitions (JSON + icon images)
2. **`site/`** — Next.js frontend that renders the store UI

The build pipeline (`build_all_branches.sh` + GitHub Actions) processes each git branch (e.g. `1.1`) into a versioned subdirectory under `public/`, which is deployed to GitHub Pages via the `gh-pages` branch.

## Site Configuration

The primary config is `site/next.config.js`. Key fields under `env`:

| Field | Purpose |
|-------|---------|
| `name` | Registry display name |
| `description` | Short description shown in Kasm admin |
| `icon` | URL to registry icon |
| `listUrl` | Root URL of the GitHub Pages site (must have trailing slash) |
| `contactUrl` | Contact/issues URL |

`basePath` must always contain `1.0` as a placeholder — `build_all_branches.sh` substitutes the actual branch name at build time.

## Commands

### Site (Next.js)
```bash
cd site
npm install          # or: yarn
npm run dev          # local dev server
npm run build        # production build → outputs to ../public
npm run lint
```

### Processing scripts
```bash
cd processing
npm install

node processjson.js          # builds list.json + copies icons to public/
node add_next_version.js     # appends a new Kasm version to all workspace.json files
node get_image_sizes.js      # pulls images and fills in uncompressed_size_mb where 0
node update_1_0_to_1_1.js   # migrates workspaces from schema 1.0 → 1.1 format
```

`processjson.js` reads `site/next.config.js` for store metadata and writes `public/list.json` + `public/versions.json`. It must run before `npm run build` so `list.json` is included in the static export.

## Adding a Workspace

Create a folder under `workspaces/` with:
- `workspace.json` — see structure below
- An icon file (`.png` or `.svg`, square, ≥50×50px) — filename must match `image_src`

All images in this registry use the `macchiato23` Docker Hub org with the naming convention `macchiato23/kasm-macchiato-<name>`. Use `workspaces/Noble/workspace.json` as the reference template:

```json
{
  "friendly_name": "Ubuntu Noble Desktop",
  "image_src": "macchiato-noble.png",
  "description": "...",
  "cores": 2,
  "memory": 4800,
  "gpu_count": 0,
  "cpu_allocation_method": "Inherit",
  "docker_registry": "https://index.docker.io/v1/",
  "categories": ["Desktop"],
  "require_gpu": false,
  "enabled": true,
  "image_type": "Container",
  "name": "macchiato23/kasm-macchiato-<name>:latest",
  "architecture": ["amd64"],
  "compatibility": [
    {
      "version": "1.18.x",
      "image": "macchiato23/kasm-macchiato-<name>:latest",
      "uncompressed_size_mb": 0,
      "available_tags": ["latest", "1.0", "develop"]
    },
    {
      "version": "1.17.x",
      "image": "macchiato23/kasm-macchiato-<name>:latest",
      "uncompressed_size_mb": 0,
      "available_tags": ["latest", "1.0", "develop"]
    }
  ]
}
```

Set `uncompressed_size_mb` from `docker inspect <image> --format '{{.Size}}'` divided by 1,048,576. Verify available tags with `docker manifest inspect` before listing them. `available_tags` must be consistent across all workspaces — either all define it or none do.

## Architecture

**Build flow:**
1. `processing/processjson.js` scans `workspaces/**/workspace.json`, computes folder hashes (used as React keys via `workspace.sha`), copies icons to `public/icons/`, and writes `public/list.json` and `public/versions.json`.
2. `build_all_branches.sh` loops over all remote branches (excluding `HEAD`, `develop`, `gh-pages`), checks out each, runs the processing script, substitutes the branch name into `basePath`, builds the Next.js static export, then moves the output into `base/<branch>/`. The `base/index.html` redirects to the default branch.
3. GitHub Actions runs both steps on every push, then deploys the `public/` folder to `gh-pages`.

**Frontend (`site/`):**
- Next.js with static export (`output: 'export'`)
- Tailwind CSS for styling
- `pages/index.js` fetches `list.json` at runtime, filters workspaces by selected Kasm version (stored in `localStorage`) and search text
- `components/Workspace.js` renders individual workspace cards
- `pages/new/[[..workspace]].js` — workspace builder UI for generating new workspace definitions

## Branch / Schema Versioning

Each git branch (`1.0`, `1.1`, etc.) corresponds to a schema version. Kasm Workspaces automatically requests the schema version it supports. When creating a new schema version, create a new branch and make it the default. The `build_all_branches.sh` script builds all branches in a single CI run.
