# Work dashboard plan

A calm, playful work timer: start a clock, take breaks, close the day with a short summary, and pick up where you left off tomorrow.

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

Other ideas that didn't make the list: streaks, sound effects, projects/categories, and calendar sync.

## 2. Narrowed to 10 (v1)

| #   | Feature                                      | Shape    | Why it's in                                        |
| --- | -------------------------------------------- | -------- | -------------------------------------------------- |
| 1   | Work clock (start / pause / resume)          | Circle   | The core of the app                                |
| 2   | Breaks with type                             | Triangle | Explicitly requested                               |
| 3   | Current focus label                          | Hexagon  | Makes the summary meaningful, at little cost       |
| 4   | Day timeline                                 | All      | Shows the whole day at a glance, calmly            |
| 5   | Daily target progress ring                   | Circle   | Doubles as the clock face, so no extra clutter     |
| 6   | Close workday + auto-drafted summary         | Square   | Explicitly requested; the auto-draft saves typing  |
| 7   | Resume card ("pick up where you left off")   | Square   | This is where the summary pays off                 |
| 8   | Gentle break nudge                           | Triangle | Keeps the app healthy to use, not just a tracker   |
| 9   | Local persistence + forgotten-timer recovery | –        | A timer that loses data or runs for 14h is useless |
| 10  | History of past days                         | Square   | Somewhere for the summaries to live                |

**Parked for later:** Pomodoro presets, weekly stats, entry editing (beyond recovery), keyboard shortcuts, export, idle detection, scratchpad and live tab title. Shortcuts and the tab title are cheap and would be the first extras.

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
| `--sky`            | `#A0D2EB` | Square: close day, summaries, history |
| `--rose`           | `#F4A6B0` | Warnings and destructive actions only |

Text on a pastel fill uses `--bg` (anthracite) for contrast. Pastels are used as fills and accents, never as large blocks of body text.

### Shape language

Each concept owns one shape, used for its icon, button outline and timeline marker:

- **Circle**: work and time. The clock itself is a large ring.
- **Triangle**: breaks.
- **Hexagon**: focus and tasks.
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
 │  LMG Dash                 Today · History    │
 ├──────────────────────────────────────────────┤
 │  [Resume card: yesterday's "next up"]  (x)   │
 │                                              │
 │               ◯  3:12:45                     │
 │            (ring = target 8h)                │
 │         ⬡ Working on: invoice export         │
 │                                              │
 │     [ ◯ Pause ]  [ △ Break ▾ ]  [ □ Close ]  │
 │                                              │
 │  ▇▇▇▇▇△▇▇▇▇▇▇▇△△▇▇▇▇  timeline              │
 └──────────────────────────────────────────────┘
```

The sidebar is replaced by a slim top bar with two tabs (Today and History) to keep it uncluttered.

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

### Close workday flow

1. The Close button opens a dialog showing the day's totals (work, breaks, per-focus breakdown) and the timeline.
2. Fields are prefilled where possible:
   - **Done today**: prefilled with the focus labels and their durations, editable.
   - **Next up**: where to pick up tomorrow.
   - **Blockers**: optional.
   - **Mood**: pick one of four shapes.
3. Save closes any open block, marks the day closed, plays the stacking animation and stores the summary.
4. On the next day, the Resume card shows "Next up" and blockers, and one click copies "Next up" into the focus label.

## 5. Data model (localStorage, v1)

```ts
type SegmentKind = 'work' | 'break'
type BreakType = 'coffee' | 'lunch' | 'walk' | 'other'

interface Segment {
  id: string
  kind: SegmentKind
  breakType?: BreakType
  focus?: string
  start: string // ISO timestamp
  end?: string // open while running
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
  segments: Segment[]
  status: 'active' | 'closed'
  summary?: DaySummary
}
```

- Storage key: `lmg-dash:v1:days` holds a record keyed by date, plus `lmg-dash:v1:settings`. Storage is versioned so it can migrate later.
- A small `workdayRepository` interface separates the UI from storage, so a backend can replace localStorage later (`src/lib/api.ts` already exists).

## 6. Code layout

```
src/
  app/                  routes: / (Today), /history
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
                        BreakNudge, RecoveryDialog, CloseWorkdayDialog, ResumeCard
    history/
      HistoryPage.tsx   list of past days: totals, mini timeline, summary
  styles/               tokens.css (palette, motion), global.css
```

State management uses `useReducer` and context, with no extra dependencies. Animations use plain CSS (keyframes, transitions and a spring-like `cubic-bezier`), with no animation library.

## 7. Build order

1. **Theme and shapes**: tokens, `Shape`, `ShapeButton` with press animations, the drifting backdrop, and the top bar.
2. **Workday model**: types, reducer, selectors and storage, with unit tests for timing, state transitions, focus splits and overnight recovery.
3. **Today screen**: clock ring with target, controls, break menu, focus input and timeline.
4. **Close workday and resume**: the dialog, auto-draft, stacking animation and resume card.
5. **History and nudge**: the history page and the break nudge toast.
6. **Polish**: reduced motion, focus rings and ARIA labels, empty states, and a mobile layout pass.

Each step is its own commit and keeps lint, typecheck, tests and build green.

## 8. Defaults to confirm

- Daily target: **8h**, editable in a small settings popover.
- Break nudge after **50 min** of continuous work.
- Data stays **local to the browser** in v1, with no accounts or sync.
- Break types: **coffee, lunch, walk, other**.
