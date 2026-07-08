# Gamelog — Information Architecture Audit

Scope: this document inventories the app **as it exists today**. It makes no
recommendations and renames nothing. It is a factual map, built by reading
`App.tsx`'s route table, the Sidebar/Global Search/Command Palette shell
components, and every screen and modal component's actual trigger wiring.

Source of truth: `src/App.tsx` (route table + global modal state),
`src/shell/Sidebar.tsx`, `src/shell/GlobalSearch.tsx`,
`src/components/CommandPalette.tsx`, and each screen/modal file listed below.

---

## 1. Screen Inventory

15 full-page (routed) screens, 6 modals/sheets, 1 keyboard-only overlay, and
1 persistent widget. "UI label" is the actual on-screen text a user sees
(page `<h1>`, or the label used to reach it) — not the component filename.

### Full-page / routed screens

| # | UI label (on screen) | Route | One-line description |
|---|---|---|---|
| 1 | **Library** | `/` | Grid or table of every game in the collection; search, sort, status/genre/platform filters, and a "Game of the Week" spotlight banner. |
| 2 | **Search Results** | `/search?q=…` | Full external IGDB catalog search (not a search of the existing library) for finding and adding new games. |
| 3 | **Lists** | `/lists` (no list selected) | Grid of every user-created custom list (ranked or unranked game collections). |
| 4 | *(dynamic list name)* | `/lists` (list selected — component state, not a distinct URL) | Contents of one specific list: reorder, rename, remove games, share, delete. |
| 5 | **Stats** | `/stats` | Burndown charts and gaming-habit visualizations. No further navigation out of this screen. |
| 6 | **What to Play Next** | `/recommend` | Intent-based recommendation picks ("something short," "a relaxing RPG") plus the Backlog Roulette trigger. |
| 7 | **Activity & Milestones** | `/activity` | Two tabs: Journal (365-day contribution heatmap + timeline feed) and Achievements; also launches Year in Review. |
| 8 | **Compare Libraries** | `/friends` | Upload a friend's exported backup file; compare overlap, each side's unique games, and "hot takes." |
| 9 | **Browse by System** | `/systems` | Library grouped by gaming platform/console, as a grid of platform tiles. |
| 10 | *(platform name, e.g. "PlayStation 5")* | `/systems/:platformId` | Library filtered to one platform — same screen component as #9 in a filtered state. |
| 11 | **Settings** | `/settings` | Three sections on one page: Appearance & Customization (theme/accent), Data Backup & Restore (export/import JSON), Platform Integrations & Library Imports (Steam/PSN/Xbox/GOG). |
| 12 | **Review Steam Import** | `/import/steam` | Dedicated review/confirm step for Steam-sourced imports only — shows matched games before committing them to the library. |
| 13 | **Store Diagnostic Check** | `/debug` | Developer smoke-test screen that clears and reseeds the entire local database. No UI links to it anywhere. |
| 14 | *(game title)* — **Game Detail** | `/game/:igdbId` | Full detail page for one game: metadata, status/rating controls, related-games strip, log and add-to-list actions. |
| 15 | **Related games** | `/game/:igdbId/related` | Full-page, tabbed browse (Related / DLC / Expansions / Ports / Series / Mods / Bundles) of everything related to one game. |

### Modals, sheets, and overlays

| # | UI label | How it's shown | One-line description |
|---|---|---|---|
| 16 | **Add Game** (modal) | Global — layered over whatever route is active | Search the IGDB catalog and add a new game to the library, including a natural-language "quick log" mode. |
| 17 | **Log Editor** (modal) | Global — layered over whatever route is active | Edit status, rating, dates, platforms, tags, ownership, and notes for one game's log entry. |
| 18 | **Add to List** (sheet) | Global — layered over whatever route is active | Toggle a game's membership across existing lists, or create a new list, from Game Detail. |
| 19 | **Share [Library / List]** (modal) | Local to Library and to Single List | Export the current filtered library view, or one specific list, as Markdown, an image, or a calendar (.ics) file. |
| 20 | **Backlog Roulette** (modal) | Local to What to Play Next | Randomly spins to one Backlog-status game and offers to mark it Playing. |
| 21 | **Year in Review** (modal) | Local to Activity & Milestones | 5-slide personal-year-in-review summary (hours, completions, favorite genre, etc.). |
| 22 | **Command Palette** (⌘K / `/`) | Global, keyboard-triggered only — no visible on-screen button anywhere | Fuzzy search across navigation destinations, quick actions, and games already in the library. |

### Persistent widget (not a modal, not a route)

| # | UI label | Where it lives | One-line description |
|---|---|---|---|
| 23 | **Global Search** (top-right search box, placeholder "Add a game…") | Pinned top-right on every screen *except* Search Results | Debounced IGDB catalog search with an inline dropdown; click a result to open Game Detail, click "+" to add it, or press Enter to jump to the full Search Results screen. Also has its own natural-language "quick log" toggle. |

**Answering the "modal-only reachability" question directly:** no full-page
routed screen requires passing through a modal first — every routed screen
(#1–15) is reachable by a direct click or a direct URL. The relationship
runs the other way: **none of the 6 modals/sheets (#16–21) or the Command
Palette (#22) have a URL of their own.** They are all pure component state
layered on top of whichever route happens to be active underneath, which
means refreshing the page while any of them is open loses that state and
drops the user on the plain underlying route.

---

## 2. Navigation Hierarchy (as it exists)

Indentation = click depth from the persistent chrome (Sidebar, Global
Search widget, and ⌘K Command Palette, all of which are present on every
screen and treated here as depth 0).

```
Depth 0 — persistent chrome (present on every screen)
├── Sidebar (8 links + "Add game" button)
├── Global Search widget (top-right, all screens except Search Results)
└── Command Palette (⌘K or "/")

Depth 1 — Sidebar destinations
├── Library                              [/]
│   ├── Game Detail                      (click a cover/row)            → depth 2
│   │   ├── Related games                (click "See all" / a related-value chip) → depth 3
│   │   ├── Log Editor (modal)           (click "Log")                  → depth 3
│   │   └── Add to List (sheet)          (click "Add to list")          → depth 3
│   ├── Log Editor (modal)               (quick "Log" action on a cover/row) → depth 2
│   └── Share (modal)                    (toolbar "Share" button)       → depth 2
│
├── Lists                                [/lists]
│   └── (dynamic list)                   (click a list card — NOT a real URL, component state only) → depth 2
│       ├── Game Detail                  (click a game in the list)     → depth 3
│       └── Share (modal)                (list toolbar "Share")         → depth 3
│
├── Browse Systems                       [/systems]   (on-screen header: "Browse by System")
│   └── (platform, e.g. "Xbox Series X") [/systems/:platformId]         → depth 2
│       ├── Game Detail                  (click a cover/row)            → depth 3
│       └── Log Editor (modal)           (quick "Log" action)           → depth 3
│
├── What to Play                         [/recommend]  (on-screen header: "What to Play Next")
│   ├── Backlog Roulette (modal)         ("Spin Backlog Roulette" button) → depth 2
│   └── Game Detail                      ("Start Playing" on a recommendation) → depth 2
│
├── Activity                             [/activity]   (on-screen header: "Activity & Milestones")
│   ├── Year in Review (modal)           (gradient CTA button)          → depth 2
│   └── Game Detail                      (click a game in the Timeline tab) → depth 2
│
├── Friends                              [/friends]    (on-screen header: "Compare Libraries")
│   └── (no further navigation — game covers shown here are not clickable; see Flagged for Review)
│
├── Stats                                [/stats]      (leaf — no outbound navigation of any kind)
│
└── Settings                             [/settings]
    └── Review Steam Import              [/import/steam]  (Steam tab → "Fetch from Steam" button, only) → depth 2
        (PSN / Xbox / GOG imports happen inline in Settings itself — no navigation, see Flagged for Review)

Depth "global" — not part of the Sidebar tree at all
├── Search Results                       [/search]   reachable ONLY via Global Search widget (press Enter) — no Sidebar link, no Command Palette entry
├── Add Game (modal)                     reachable via Sidebar "Add game" button OR Command Palette "Add New Game to Library" action
└── Store Diagnostic Check               [/debug]    reachable ONLY by typing the URL directly — no link anywhere in the app
```

---

## 3. Entry Points

Every way a user can actually land on each destination. "Sole entry point"
is flagged explicitly where only one path exists.

| Destination | Entry points |
|---|---|
| **Library** (`/`) | Sidebar "Library" link · browser back from anywhere · logo click (none — no logo link found) |
| **Search Results** (`/search`) | **Sole entry point:** press Enter in the Global Search widget with a non-empty query. No Sidebar link, no button, no Command Palette entry. |
| **Lists** (`/lists`) | Sidebar "Lists" link |
| *(a specific list)* | Click a list card from the Lists screen. **No deep link** — cannot be reached any other way, including a direct URL, since it's local component state. |
| **Stats** (`/stats`) | Sidebar "Stats" link |
| **What to Play Next** (`/recommend`) | Sidebar "What to Play" link |
| **Activity & Milestones** (`/activity`) | Sidebar "Activity" link |
| **Compare Libraries** (`/friends`) | Sidebar "Friends" link |
| **Browse by System** (`/systems`) | Sidebar "Browse Systems" link |
| *(a specific platform)* | Click a platform tile from Browse by System. Sole entry point. |
| **Settings** (`/settings`) | Sidebar "Settings" link |
| **Review Steam Import** (`/import/steam`) | Sole entry point: Settings → Platform Integrations → Steam tab → "Fetch from Steam" button (requires a Steam ID typed in first) |
| **Store Diagnostic Check** (`/debug`) | None. Direct URL entry only. |
| **Game Detail** (`/game/:igdbId`) | Click a cover/row on: Library (grid or table), Search Results, Browse by System (top-level or platform-filtered), a List's contents, Activity's Timeline tab, Related games page (another game's related item) · click the Spotlight Banner on Library · click a result row in the Global Search dropdown · click a game in the Command Palette's "Library Games" results · "Start Playing" from a What to Play Next recommendation |
| **Related games** (`/game/:igdbId/related`) | From Game Detail only: a "see all" style button for the active related-content tab, or clicking a "Series" value chip (both on Game Detail) |
| **Add Game** (modal) | Sidebar "Add game" button · Command Palette "Add New Game to Library" action (dispatches the same underlying event) |
| **Log Editor** (modal) | Quick "Log" action on a cover/row on: Library, Search Results, Browse by System · "Log" button on Game Detail itself · automatically opened after adding a game via the Global Search widget's "+" button |
| **Add to List** (sheet) | Sole entry point: "Add to list" button on Game Detail |
| **Share** (modal) | Library toolbar "Share" button (shares the current filtered view) · a specific List's toolbar "Share" button (two separate trigger contexts, same component) |
| **Backlog Roulette** (modal) | Sole entry point: "Spin Backlog Roulette" button on What to Play Next. (The Command Palette also has a "Spin Backlog Roulette" *action*, but it navigates to a URL rather than opening this modal — see Flagged for Review.) |
| **Year in Review** (modal) | Sole entry point: gradient CTA button on Activity & Milestones |
| **Command Palette** | Keyboard only: `⌘K` / `Ctrl+K`, or `/` when focus isn't in a text field. No visible button anywhere triggers it. |
| **Global Search widget** | Always visible (not "entered") on every screen except Search Results; can also be focused programmatically via a `open-global-search` window event, though nothing in the app currently dispatches that event. |

---

## 4. Flagged for Review

Naming things without resolving them, as requested. Grouped by the
categories asked for.

### Broken / non-functional navigation targets

- **[RESOLVED]** Command Palette's **"Library"** nav item calls `navigate("/")` correctly.
- **[RESOLVED]** Command Palette's **"What to Play"** nav item calls `navigate("/recommend")` correctly.
- **[RESOLVED]** Command Palette's **"Spin Backlog Roulette"** action calls `navigate("/recommend", { state: { openRoulette: true } })` and triggers `"gamelog:open-roulette"` to automatically open the Backlog Roulette modal directly.

### Same destination, different label depending on where you look

- **[RESOLVED]** **Route `/`**: "Library" across all surfaces.
- **[RESOLVED]** **Route `/recommend`**: Standardized to **"What to Play"** across Sidebar, on-screen header, and Command Palette.
- **[RESOLVED]** **Route `/activity`**: Standardized to **"Activity"** across Sidebar, on-screen header, and Command Palette.
- **[RESOLVED]** **Route `/friends`**: Standardized to **"Friends"** across Sidebar, on-screen header, and Command Palette.
- **[RESOLVED]** **Route `/stats`**: Standardized to **"Stats"** across Sidebar, on-screen header, and Command Palette.
- **[RESOLVED]** **Route `/systems`**: Standardized to **"Browse Systems"** across Sidebar, on-screen header, and Command Palette.
- **Route `/search`**: on-screen header says "Search Results"; this destination has no label anywhere else (no Sidebar entry, no Command Palette entry) to compare it against.

### Missing from one nav surface but not another

- **[RESOLVED]** Command Palette's Navigation category now includes **Lists** (`/lists`) and **Browse Systems** (`/systems`) alongside Library, What to Play, Activity, Friends, Stats, and Settings.
- Search Results has no presence in the Sidebar or the Command Palette at all — its only path in is the Global Search widget's Enter key, which has no visible affordance indicating that's what Enter will do.

### Two things named "search" that do different jobs

- The **Global Search widget** (top-right, always visible) searches the external IGDB catalog, for the purpose of adding new games. It is not a search of the user's existing library.
- The **Command Palette** (⌘K) searches navigation destinations, actions, *and* games already in the library — a different corpus entirely.
- Both are conceptually "search" but overlap in name only, not in function, scope, or UI pattern.

### Deep-linkability is inconsistent across structurally similar features

- **Game Detail** (`/game/:igdbId`) has a real URL: shareable, refreshable, back-button-safe.
- **Single List detail** (viewing one specific list) has **no URL** — it's local `useState` in `App.tsx` (`openListId`). Refreshing the page while viewing a list returns the user to the list-of-lists screen. The on-screen "back" arrow inside the list view resets this local state rather than using browser history, so its behavior may not match what the browser Back button does in the same moment.
- **Library view mode** (grid vs. table) is stored in `localStorage`, not the URL — there's no way to link someone directly to the table view.
- **Systems platform filter** (`/systems/:platformId?name=…`), by contrast, *is* a real URL. So among three conceptually similar "filter/drill into a sub-view" patterns, one is fully URL-driven, one is fully state-driven, and one is a mix (localStorage, no URL).
- **None of the 6 modals** (Add Game, Log Editor, Add to List, Share, Backlog Roulette, Year in Review) have a URL either — all are `useState` booleans/objects.

### Depth inconsistency between comparably important features

- **Game Detail** is 1 click away from nearly every top-level screen (Library, Search, Systems, Lists, Activity) plus several standalone entry points (Spotlight Banner, Global Search dropdown, Command Palette).
- **Review Steam Import** is 2 clicks deep (Settings → Steam tab → "Fetch from Steam") and is the *only one* of the four supported platform imports (Steam, PSN, Xbox, GOG) that gets a dedicated full-page review step. The other three complete the equivalent parse → match → preview → confirm sequence entirely inline within the Settings page, without navigating anywhere. Same underlying job, two different structural patterns, at two different depths.

### Placement ambiguity — could reasonably live in more than one place

- **Browse Systems** and **Library's own filter bar** both ultimately produce "the library, filtered" — Browse Systems is a separate top-level destination with its own grid, while Library already has a platform filter built into its FilterBar. It's not obvious why platform gets a dedicated top-level screen when other filter dimensions (genre, status) don't.
- **Global Search** (add-a-new-game) and **Add Game modal** (also add-a-new-game) are two independently-built flows that both search the same IGDB catalog and both end in adding a game to the library. They're triggered completely differently (persistent widget vs. Sidebar button/Command Palette action) and are separate components with separate implementations.
- **Backlog Roulette** is structurally a modal nested two levels under Sidebar → What to Play Next → button, but the Command Palette treats it as a first-class action alongside top-level navigation items, suggesting it's conceptually meant to feel more prominent than its actual placement.
- **Year in Review** is a single CTA button buried inside the Activity screen with no nav presence of its own, despite being explicitly named as a headline feature in the Command Palette's description of Activity ("365-day heatmap, timeline, and Year in Review").

### Same component, inconsistent behavior depending on where it's used

- **CoverCard** opens Game Detail on click everywhere it appears — Library, Search Results, Browse by System, a List's contents — *except* on the Friends (Compare Libraries) screen, where the exact same component is rendered without an `onClick` handler. Covers there are visually identical but inert.

### Live route with no discoverability, and a database-clearing side effect

- **[RESOLVED]** **Store Diagnostic Check** (`/debug`) no longer automatically clears the local database on mount. Running the diagnostic now requires clicking an explicit button and confirming a warning prompt before clearing `db.games`, `db.logs`, and `db.lists`.
