# LMG Dash

A calm, playful work dashboard: plan your day, time your work and breaks, close the day with a short summary, and keep track of the problems coworkers bring you, with or without AI.

Pastel circles, triangles, hexagons and squares on anthracite. In the background they drift slowly and move out of the way of your cursor.

- ◯ **Circle (mint):** work and time
- △ **Triangle (peach):** breaks
- ⬡ **Hexagon (lavender):** focus and tasks
- ⬡ **Hexagon (butter):** projects and wishes
- □ **Square (sky):** the day as a whole
- □ **Square (lime):** solutions

The full plan is in [`docs/PLAN.md`](docs/PLAN.md).

## Features

- **Today:** a clock ring filling toward your daily target, "working on" focus, pause and resume, typed breaks, a timeline, and the running time in the tab title.
- **Plan your day:** yesterday's "next up" and unfinished items carry over. Add estimates, drag to reorder, start work from an item, tick items off.
- **Break reminder:** a gentle nudge after 50 minutes of continuous work.
- **Close workday:** decide done / carry over / drop for each open item. The summary is drafted for you, grouped by project. Add blockers and a mood.
- **Forgotten clock:** if the clock ran past midnight, the app asks when you actually stopped.
- **Projects & wishes:** note coworkers' wishes in seconds (the **Wish** button, from any page). Each project moves through phases (Wish → Exploring → Building → Awaiting feedback → Delivered, or Parked/Declined), shown as a step track with how long it's been in the current phase. Projects waiting on feedback for a week are flagged, with a Claude button to draft the follow-up. Track the problem, wish, approach, impact/effort, links and notes. Time on plan items linked to a project adds up per project.
- **Solutions:** document what you've built: summary, problem, how it works, how to use it, maintenance, tools, who uses it, time saved per week, links, and the requests it solves. "Document the solution" on a project starts the page for you; export one or all as Markdown.
- **Claude, on your subscription:** "Copy for Claude" buttons copy a prompt with context and open claude.ai. The app itself never calls an AI API.
- **History:** a weekly overview (hours per day against your target, time per project, done items) and past days with totals, timeline, summary and notes.
- **Edit times:** fix a forgotten stop, change start and end times, turn work into a break, add or delete blocks, today or on any past day.
- **Focus timer:** optional 25/5 or 50/10 cycles that start the break for you.
- **Scratchpad:** quick notes during the day, shown when you close the day.
- **Routines:** plan items that add themselves on chosen weekdays (e.g. a standup).
- **Away detection (desktop):** after a long time away with the clock running, it asks whether that was work, a break, or not working.
- **Export & backup:** Markdown or CSV reports, plus a full JSON backup you can restore.
- **Keyboard shortcuts:** Space, B, F, N, E, C on Today; W, 1–4 and ? anywhere.
- **Install as an app:** add it to your home screen for a full-screen app. Optional system notifications for breaks and the focus timer.

## Where your data lives

Nothing is stored on a server. Two options:

1. **GitHub (recommended):** your data is saved as JSON files in a **private** repository you own (e.g. `lmg-dash-data`), through the GitHub API. Git history is your backup.
2. **This browser only:** for trying things out. The data lives in this browser's storage.

The app can be public (it contains no data). The data repo must be private; the app refuses to connect to a public one.

### How the data is protected

- The access token is a **fine-grained token** limited to the data repo, with _Contents: read and write_ and nothing else.
- The token is **encrypted with your passphrase** (AES-GCM, PBKDF2) before it's stored in the browser. You unlock it once per browser session, and it auto-locks after 8 hours idle. **Lock** and **Forget this device** are in the top bar and Settings.
- A **Content-Security-Policy** in the production build only allows network requests to `api.github.com`.
- No analytics, CDNs or third-party scripts.
- Tokens are never put in `VITE_*` variables or `.env` files, which would be baked into the public build.

## Setup

### 1. Host the app on GitHub Pages

1. In this repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`. [`deploy.yml`](.github/workflows/deploy.yml) builds and publishes to `https://<you>.github.io/<repo>/`.

Pages from a private repo needs GitHub Pro. On a personal account the Pages site is always publicly reachable. That's fine here: without your token it only shows the connect screen.

### 2. Create the data repo and token

1. [Create a private repository](https://github.com/new), e.g. `lmg-dash-data`. It can be empty.
2. [Create a fine-grained token](https://github.com/settings/personal-access-tokens/new):
   - **Repository access:** only select repositories → `lmg-dash-data`
   - **Permissions:** Contents → **Read and write**
   - **Expiration:** e.g. 1 year. Enter the same date in the app to get a reminder before it runs out.
3. Open the app, enter `your-name/lmg-dash-data`, the token and a passphrase.
4. Turn on **secret scanning** and **push protection** for both repos (Settings → Code security).

Data is written under `users/<github-login>/` (`days/YYYY-MM-DD.json`, `projects.json`, `solutions.json`, `settings.json`). A team can later share one data repo without changing the format.

### Using Claude with your data

Because the data lives in a private GitHub repo, you can also connect that repo to Claude (the GitHub connector in claude.ai, or Claude Code) and ask things like "What did Anna ask for last month?". This runs on your Claude subscription.

## Development

Requires Node 22 (see `.nvmrc`).

```sh
npm install
npm run dev     # then choose "Try it in this browser only"
```

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Start the dev server                          |
| `npm run build`        | Typecheck and build to `dist/` (adds the CSP) |
| `npm run preview`      | Serve the production build                    |
| `npm run lint`         | Lint with oxlint                              |
| `npm run format`       | Format with Prettier                          |
| `npm run format:check` | Check formatting (used in CI)                 |
| `npm run typecheck`    | Run the TypeScript compiler                   |
| `npm test`             | Run tests once with Vitest                    |
| `npm run test:watch`   | Run tests in watch mode                       |

### Project structure

```
src/
  app/              App, routes, top bar tabs
    data/           DataProvider: connect/unlock, storage engine, per-user paths
  components/
    layout/         AppLayout, TopBar, SaveIndicator
    shapes/         Shape (circle|triangle|hexagon|square), drifting backdrop
    ui/             ShapeButton (press animations), Card, Dialog, Menu
    feedback/       Toasts
  features/
    connect/        Connect and unlock screens
    workday/        Day model (pure functions + tests), merge, WorkdayProvider
    today/          Today screen: clock ring, controls, focus, timeline, nudge
    planning/       Plan your day, plan list
    closeday/       Close workday dialog, summary draft, celebration
    projects/       Projects & wishes: model, provider, list, detail, quick capture
    claude/         Prompt builders and "Copy for Claude"
    history/        Past days
    settings/       Settings
  hooks/            useNow, useDocumentTitle
  lib/
    storage/        GitHubStore, LocalStore, SyncEngine (debounced saves, offline, merge)
    crypto.ts       Passphrase encryption for the token
    time.ts         Date and duration helpers
  styles/           Design tokens and global styles
```

Imports use the `@/` alias for `src/`.

### How saving works

`SyncEngine` keeps documents in memory and applies changes instantly. It writes them to GitHub a few seconds after the last change, and immediately when you close the day or add a wish. Unsaved changes are cached locally, so a reload or going offline loses nothing. If another device saved the same file in the meantime, the two versions are merged: tracked time and notes from both are kept.

## CI

- [`ci.yml`](.github/workflows/ci.yml) runs lint, format check, typecheck, tests and build on every PR and on pushes to `main`.
- [`deploy.yml`](.github/workflows/deploy.yml) publishes `main` to GitHub Pages.
