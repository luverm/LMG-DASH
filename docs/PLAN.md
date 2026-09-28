# Work dashboard plan

A calm, playful work timer and project notebook: keep track of the solutions coworkers ask for, plan the day, start a clock, take breaks, close the day with a short summary, and pick up where you left off tomorrow.

## 1. Brainstorm (20 features)

1. **Work clock**: start, pause, resume and stop a work timer.
2. **Breaks**: start a break with a type (coffee, lunch, walk, other) and its own timer.
3. **Day timeline**: a horizontal bar of today's work and break blocks.
4. **Current focus**: a one-line "what am I working on" label, saved with each work block.
5. **Daily target**: set hours for the day and fill a progress ring toward them.
6. **Close workday**: a guided wrap-up with what got done, what's next, blockers and mood.
7. **Resume card**: on the next open, yesterday's "next up" and blockers are shown first.
8. **Auto-drafted summary**: prefill the close-day form from focus labels and totals.
9. **Break nudge**: a gentle reminder after a long work stretch.
10. **Pomodoro presets**: optional 25/5 or 50/10 cycles.
11. **History**: a list or calendar of past days with totals and summaries.
12. **Weekly stats**: a small chart of hours per day this week.
13. **Edit entries**: fix a forgotten stop or adjust start and end times.
14. **Forgotten-timer recovery**: if the clock ran overnight, ask when you actually stopped.
15. **Keyboard shortcuts**: Space to start or pause, B for break, C to close the day.
16. **Local persistence**: survives refreshes and works offline with no backend.
17. **Export**: download a day or week as Markdown or CSV.
18. **Idle detection**: after a long hidden or idle tab, offer to trim that time.
19. **Scratchpad notes**: quick notes during the day that feed into the summary.
20. **Live tab title**: shows the running time (e.g. "1:42 · Working").

**Added later:** 21. **Day planning**: a short list of what you intend to do today, with rough time estimates, that you work through during the day. 22. **Projects & wishes**: a place to collect the problems coworkers bring you and the solutions you build for them, with or without AI.

Other ideas that didn't make the list: streaks, sound effects, projects/categories, and calendar sync.

## 2. Narrowed to 10 (v1)

| #   | Feature                                      | Shape    | Why it's in                                              |
| --- | -------------------------------------------- | -------- | -------------------------------------------------------- |
| 1   | Work clock (start / pause / resume)          | Circle   | The core of the app                                      |
| 2   | Breaks with type                             | Triangle | Explicitly requested                                     |
| 3   | Current focus label                          | Hexagon  | Makes the summary meaningful, at little cost             |
| 4   | Day timeline                                 | All      | Shows the whole day at a glance, calmly                  |
| 5   | Daily target progress ring                   | Circle   | Doubles as the clock face, so no extra clutter           |
| 6   | Close workday + auto-drafted summary         | Square   | Explicitly requested; the auto-draft saves typing        |
| 7   | Day planning (absorbs the resume card)       | Hexagon  | Gives the day a shape; unfinished items carry over       |
| 8   | Gentle break nudge                           | Triangle | Keeps the app healthy to use, not just a tracker         |
| 9   | Local persistence + forgotten-timer recovery | –        | A timer that loses data or runs for 14h is useless       |
| 10  | History of past days                         | Square   | Somewhere for the summaries to live                      |
| 11  | Projects & wishes                            | Hexagon  | Where your actual work comes from; lives on its own page |

**Parked for later:** Pomodoro presets, weekly stats, entry editing (beyond recovery), keyboard shortcuts, export, idle detection, scratchpad and live tab title. Shortcuts and the tab title are cheap and would be the first extras.

The resume card from the first draft now lives at the top of the day plan: yesterday's unfinished items and "next up" become today's starting list. The list stays at 10 without losing the resume idea.

Projects & wishes makes it 11. It gets its own page, so it adds no clutter to the Today screen.

## 3. Look and feel

### Palette (pastels on anthracite)

| Token              | Value     | Use                                   |
| ------------------ | --------- | ------------------------------------- |
| `--bg`             | `#26292E` | Anthracite page background            |
| `--surface`        | `#2F3338` | Cards                                 |
| `--surface-raised` | `#3A3F45` | Dialogs, hovered cards                |
| `--text`           | `#ECEDEF` | Primary text                          |
| `--text-muted`     | `#A3A8B0` | Secondary text                        |
| `--mint`           | `#A8E6CF` | Circle: work, clock, progress         |
| `--peach`          | `#FFCBA4` | Triangle: breaks                      |
| `--lavender`       | `#CDB4F6` | Hexagon: focus, current task          |
| `--butter`         | `#F3E1A0` | Hexagon: projects and wishes          |
| `--sky`            | `#A0D2EB` | Square: close day, summaries, history |
| `--rose`           | `#F4A6B0` | Warnings and destructive actions only |

Text on a pastel fill uses `--bg` (anthracite) for contrast. Pastels are used as fills and accents, never as large blocks of body text.

### Shape language

Each concept owns one shape, used for its icon, button outline and timeline marker:

- **Circle**: work and time. The clock itself is a large ring.
- **Triangle**: breaks.
- **Hexagon**: things you work on. Tasks and focus are lavender; projects are butter yellow. Hexagons tile into a honeycomb, which suits projects built from many tasks.
- **Square**: the day as a whole (close, summary, history).

A few very large, faint shapes (4–6% opacity) drift slowly behind the content. They are static when `prefers-reduced-motion` is set.

### Motion (enjoyable, not overwhelming)

- **All buttons**: press scales to 0.94 with a soft spring back (~180ms).
- **Shape-specific accents on press**:
  - Circle buttons send out one expanding ring ripple.
  - Triangle buttons wobble about ±6°.
  - Hexagon buttons rotate 60°, landing on the same silhouette.
  - Square buttons squish (scaleX 1.06 / scaleY 0.94).
- **Clock ring**: fills smoothly and breathes gently (1.00 → 1.02) only while running.
- **Close workday**: once, the day's shapes drop and stack into a small pile, then the summary appears.
- **Rules**: no looping animation near text, nothing over ~400ms except the close-day moment, and everything is disabled under `prefers-reduced-motion`.

### Layout

The Today screen has one primary action visible at a time, and the main button changes with the state:

```
 ┌──────────────────────────────────────────────┐
 │  LMG Dash                 Today · Projects · History    │
 ├──────────────────────────────────────────────┤
 │               ◯  3:12:45                     │
 │            (ring = target 8h)                │
 │         ⬡ Working on: invoice export         │
 │                                              │
 │     [ ◯ Pause ]  [ △ Break ▾ ]  [ □ Close ]  │
 │                                              │
 │  ▇▇▇▇▇△▇▇▇▇▇▇▇△△▇▇▇▇  timeline              │
 │                                              │
 │  Today's plan                  5h 30 / 8h    │
 │   ⬡ ✓ Review PRs                 45m / 1h    │
 │   ⬢ ▶ Invoice export           1h 20 / 2h    │
 │   ⬡   Team sync                      30m     │
 │   ⬡   Write docs                     2h      │
 │   + Add item                                 │
 └──────────────────────────────────────────────┘
```

The sidebar is replaced by a slim top bar with three tabs (Today, Projects, History) and a small "+ Wish" quick-capture button to keep it uncluttered.

## 4. Behaviour

The workday is a state machine:

```
idle ──start──▶ working ◀──resume/end break──▶ on break
                  │  ▲                            │
               pause resume                        │
                  ▼  │                             │
                paused ─────────close──────────────┴──▶ closed
```

- **Timing**: time is always derived from stored timestamps, never from counting ticks, so refreshes, sleep and background tabs stay accurate.
- **Focus changes**: changing the focus label while working ends the current work block and starts a new one, so the summary can list time per focus.
- **Break nudge**: after 50 min of continuous work, a small triangle toast offers "Take a break?" with Break or Snooze 15 min. It never blocks.
- **Forgotten-timer recovery**: if the app opens and a block started on a previous day is still open, ask "You were still clocked in. When did you stop?" with a time picker defaulting to the last activity.

### Day planning

- **Starting the day**: the first time you open the app on a new day, a small "Plan your day" panel appears instead of the bare Start button. It is prefilled with:
  - yesterday's unfinished plan items (carried over), and
  - yesterday's "next up" and blockers from the close-day summary (the old resume card).
- **Plan items**: each is a title and an optional time estimate (15m steps). Items can be reordered by dragging, removed, or added with a single input where Enter adds the next one.
- **Planned vs target**: the panel shows the total estimate next to the daily target. If you plan more than the target, the total turns rose with a soft note ("That's 9h 30 for an 8h day"). It never blocks.
- **Skipping**: "Just start" skips planning entirely; you can plan later from the Today screen.
- **Working from the plan**: pressing ▶ on a plan item starts the clock (or switches to it) and sets it as the current focus. Each item shows time spent against its estimate and turns rose once it runs over. Free-text focus is still possible for unplanned work.
- **Ticking off**: check an item to mark it done (the hexagon fills in with a small pop). If it was the running item, the clock keeps running with no focus and asks "What's next?" by highlighting the next open item.
- **Mid-day changes**: items can be added, edited or reordered at any time without affecting tracked time.

### Projects & wishes

A single list of **projects**, where every project starts life as a **wish**: a problem a coworker brought to you. One entity with a status pipeline keeps it simple; there is no separate "request" and "project" to keep in sync.

- **Quick capture**: the "+ Wish" button in the top bar opens a small dialog, available from any page. Only a title and "from whom" are needed; everything else can be filled in later. It's meant for the moment someone pings you with an idea.
- **Status pipeline**:
  - Main flow: Wish → Exploring → Building → Delivered.
  - Side exits: Parked and Declined.
  - Moving a project to Delivered fills its hexagon and plays a small honeycomb "click into place" animation.
- **Fields on a project**:
  - **Title**, **requested by** (one or more coworkers, with autocomplete from names used before), and **team/department**.
  - **Problem** (what hurts today) and **wish** (what they'd like to happen).
  - **Approach**: AI, automation/script, tool/app, process change, or undecided.
  - **Impact** and **effort** on a simple 1–3 scale.
  - **Links**, such as a repo, document or chat thread.
  - **Notes log**: timestamped entries, newest first ("Talked to Anna, she also needs CSV export").
- **Projects page**:
  - A list grouped by status, with filters for status, person and approach, plus a search box.
  - "Quick wins" sorting (high impact, low effort) to help pick the next thing.
  - A board view with columns per status is a possible later addition.
- **Project detail page** (`/projects/:id`): all fields, the notes log, and the time you've spent on it.
- **Links to the rest of the app**:
  - A plan item can belong to a project; pick it from a dropdown when adding the item.
  - Time tracked on that plan item counts toward the project, so each project shows total hours and when you last worked on it.
  - The close-day summary groups "Done today" by project.
  - From a project you can "Add to today's plan" in one click.
- **Privacy**: coworker names and their requests stay in this browser only (see the defaults below).

### Working with Claude (on your subscription)

The app never calls the Claude API itself, because that is billed per token, separately from a Claude Pro/Max subscription. Instead, the app prepares context and you use Claude where your subscription already works: claude.ai, Claude Desktop or Claude Code.

- **v1, "Copy for Claude" buttons**: one click copies a ready-made prompt with context to the clipboard, then opens claude.ai in a new tab so you can paste it. No keys, no backend, no cost. Planned buttons:
  - On a project: "Brainstorm solutions", with the problem, wish, notes and whether AI is an option.
  - On a project: "Draft an update for the requester".
  - In close workday: "Polish my summary", using the day's totals, done items and next up.
  - In planning: "Help me plan", with open items, estimates and the day's target.
- **Later, a local MCP server** (optional): a small program on your computer that lets Claude Desktop or Claude Code read and update your projects, plans and summaries directly ("What did Anna ask for last month?"). This needs the data stored in a file on disk instead of only in the browser, so it would come together with a small local server. It is a separate step, to be decided later.

### Close workday flow

1. The Close button opens a dialog showing the day's totals (work, breaks, per-focus breakdown) and the timeline.
2. Fields are prefilled where possible:
   - **Plan review**: each open plan item gets a choice of Done, Carry over (the default) or Drop.
   - **Done today**: prefilled with completed plan items and other focus labels with their durations, grouped by project, editable.
   - **Next up**: prefilled with the carried-over items, editable.
   - **Blockers**: optional.
   - **Mood**: pick one of four shapes.
3. Save closes any open block, marks the day closed, plays the stacking animation and stores the summary.
4. On the next day, carried-over items and "next up" seed the "Plan your day" panel.

## 5. Data model (localStorage, v1)

```ts
type SegmentKind = 'work' | 'break'
type BreakType = 'coffee' | 'lunch' | 'walk' | 'other'

interface Segment {
  id: string
  kind: SegmentKind
  breakType?: BreakType
  focus?: string
  planItemId?: string // set when started from a plan item
  projectId?: string // copied from the plan item, so time per project is a simple sum
  start: string // ISO timestamp
  end?: string // open while running
}

interface PlanItem {
  id: string
  title: string
  estimateMinutes?: number
  status: 'open' | 'done' | 'dropped'
  carriedFrom?: string // YYYY-MM-DD of the day it was carried over from
  projectId?: string
}

type ProjectStatus = 'wish' | 'exploring' | 'building' | 'delivered' | 'parked' | 'declined'
type Approach = 'ai' | 'automation' | 'tool' | 'process' | 'undecided'

interface Project {
  id: string
  title: string
  requestedBy: string[] // coworker names
  team?: string
  problem?: string
  wish?: string
  approach: Approach
  impact?: 1 | 2 | 3
  effort?: 1 | 2 | 3
  status: ProjectStatus
  links: { label: string; url: string }[]
  notes: { id: string; at: string; text: string }[]
  createdAt: string
  updatedAt: string
  deliveredAt?: string
}

interface DaySummary {
  done: string
  next: string
  blockers?: string
  mood?: 'circle' | 'triangle' | 'hexagon' | 'square'
  closedAt: string
}

interface DayRecord {
  date: string // YYYY-MM-DD, local
  targetMinutes: number
  plan: PlanItem[] // array order is the display order
  segments: Segment[]
  status: 'active' | 'closed'
  summary?: DaySummary
}
```

- Storage key: `lmg-dash:v1:days` holds a record keyed by date, plus `lmg-dash:v1:projects` (keyed by id) and `lmg-dash:v1:settings`. Storage is versioned so it can migrate later.
- A small `workdayRepository` interface separates the UI from storage, so a backend can replace localStorage later (`src/lib/api.ts` already exists).

## 6. Code layout

```
src/
  app/                  routes: / (Today), /projects, /projects/:id, /history
  components/
    shapes/             Shape.tsx (circle|triangle|hexagon|square SVG), ShapeBackdrop.tsx
    ui/                 ShapeButton.tsx (press animations), Dialog.tsx, Toast.tsx, Card.tsx
    layout/             AppLayout with a slim TopBar (replaces the sidebar)
  features/
    workday/
      model.ts          types, reducer, pure selectors (totals, per-focus, current state)
      storage.ts        localStorage repository + versioning
      WorkdayProvider.tsx context + 1s tick
      TodayPage.tsx
      components/       ClockRing, ControlBar, BreakMenu, FocusInput, Timeline,
                        BreakNudge, RecoveryDialog, CloseWorkdayDialog
    planning/
      plan.ts           pure helpers: add/reorder/complete, carry-over, planned vs spent
      components/       PlanYourDay (start-of-day panel), PlanList, PlanItemRow
    projects/
      projects.ts       pure helpers: filters, quick-wins sort, time per project
      storage.ts        project repository (same pattern as workday)
      ProjectsPage.tsx  grouped list + filters
      ProjectDetailPage.tsx
      components/       QuickCaptureDialog, ProjectRow, StatusPicker, NotesLog,
                        PeopleInput (autocomplete), ApproachBadge
    history/
      HistoryPage.tsx   list of past days: totals, mini timeline, summary
  styles/               tokens.css (palette, motion), global.css
```

State management uses `useReducer` and context, with no extra dependencies. Animations use plain CSS (keyframes, transitions and a spring-like `cubic-bezier`), with no animation library.

## 7. Build order

1. **Theme and shapes**: tokens, `Shape`, `ShapeButton` with press animations, the drifting backdrop, and the top bar.
2. **Workday model**: types, reducer, selectors and storage, with unit tests for timing, state transitions, focus splits and overnight recovery.
3. **Today screen**: clock ring with target, controls, break menu, focus input and timeline.
4. **Day planning**: plan helpers with tests, the "Plan your day" panel, the plan list on Today, and starting work from an item.
5. **Close workday and carry-over**: the dialog with plan review, auto-draft, the stacking animation, and seeding the next day's plan.
6. **Projects & wishes**: model and storage with tests, quick capture, the projects list, the detail page, then linking plan items and showing time per project.
7. **History and nudge**: the history page and the break nudge toast.
8. **Polish**: reduced motion, focus rings and ARIA labels, empty states, and a mobile layout pass.

Each step is its own commit and keeps lint, typecheck, tests and build green.

## 8. Defaults to confirm

- Daily target: **8h**, editable in a small settings popover.
- Break nudge after **50 min** of continuous work.
- Data stays **local to the browser** in v1, with no accounts or sync. Because project notes are more valuable than timer data, v1 also gets a simple **Export / Import backup (JSON)** in settings, pulled forward from the parked "Export" idea.
- Break types: **coffee, lunch, walk, other**.
- Projects are **personal**: only you see them; coworkers don't submit wishes themselves (that would need a backend).
- Planning is a **task list with time estimates**, not a clock-time schedule (e.g. "10:00–11:30"). Open items **carry over** by default.
