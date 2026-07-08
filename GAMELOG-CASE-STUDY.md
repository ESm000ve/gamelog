# Case Study: Gamelog — Designing a Local-First Game Library Tracker

## 1. The Problem & Origin

Tracking a personal video game library today forces a frustrating trade-off between bloated web platforms and spartan spreadsheets. Mainstream cataloging services are cluttered with social feeds, slow web page loads, and advertisements. Generic spreadsheets or database templates offer privacy and personal control, but they lack rich video game metadata, cover art aesthetics, and fast logging workflows.

I wanted a dedicated tool designed around the psychology of managing a personal game collection. Players need to see what they own across platforms at a glance, log play sessions and ratings with minimal friction, and discover what to play next without wading through community forums or waiting on server roundtrips.

I conceived and designed Gamelog to solve this directly. Built under my direction with AI assistance, Gamelog prioritizes speed, local data ownership via browser IndexedDB, and a macOS-inspired Apple Human Interface Guidelines (HIG) visual environment.

## 2. The Concept & Audience

Gamelog is built for multi-platform gamers who value fast organization, privacy, and tactile utility over social networking features. 

The core experience centers on three architectural pillars:
- **Instant local persistence:** Every game entry, play session log, custom list, and tag is stored locally in IndexedDB (`db/schema.ts`). Sorting, filtering, and navigating across hundreds of library titles happen in milliseconds with zero network latency.
- **Keyboard-first interaction and macOS ergonomics:** A persistent `⌘K` Command Palette allows jumping between screens, triggering quick actions, and inspecting library titles without lifting hands from the keyboard. The application shell (`App.tsx`) also supports native horizontal trackpad swipe gestures to navigate forward and backward through browser history smoothly.
- **Semantic discovery and natural-language logging:** Instead of relying on static keyword matching alone, Gamelog integrates local 3,072-dimensional vector embeddings (`models/gemini-embedding-001`) to match related games by gameplay mechanics, narrative tone, and atmosphere. Additionally, users can paste unstructured text into a natural-language parser (`/api/ai/parse-search`) to translate informal thoughts into structured filters and play records.

[SCREENSHOT: Main Library view displaying the responsive grid of game covers, platform filter chips, and top-right global search widget]

## 3. Designing the Information Architecture

As the application grew, managing its structural clarity required a comprehensive Information Architecture audit (`IA-AUDIT.md`) and a formal interactive sitemap (`sitemap.html`).

The audit inventoried every navigation path across the app's genuine scale:
- **15 full-page routed screens:** Library (`/`), Search Results (`/search`), Lists (`/lists`), Single List (`/lists/:listId`), Stats (`/stats`), What to Play Next (`/recommend`), Activity & Milestones (`/activity`), Compare Libraries (`/friends`), Browse by System (`/systems`), Platform Filtered System (`/systems/:platformId`), Settings (`/settings`), Review Steam Import (`/import/steam`), Store Diagnostic Check (`/debug`), Game Detail (`/game/:igdbId`), and Related Games (`/game/:igdbId/related`).
- **6 global modals and sheets:** Add Game, Log Editor, Add to List, Share Library/List, Backlog Roulette, and Year in Review.
- **1 persistent Command Palette overlay:** Triggered globally via `⌘K` or `/`.
- **1 persistent Global Search widget:** Pinned to the top-right header across screens.

[SCREENSHOT: Visual sitemap diagram showing the 15 routed destinations and layered modal workflows]

Auditing the structure surfaced concrete organizational tensions that required explicit architectural decisions:

### Resolving Dual Search Intent
The application contained two prominent search interfaces: a top-right search box and the global `⌘K` Command Palette. Auditing revealed user intent ambiguity between searching external databases versus searching existing local inventory. I clarified their responsibilities by dedicating the top-right Global Search strictly to querying the external IGDB catalog for discovering and adding new titles, while the `⌘K` Command Palette focuses exclusively on local library filtering, command execution, and navigation shortcuts. Explicit placeholder copy and tooltip labels now reinforce this separation.

### Standardizing Deep-Linkability & URL State
Structurally similar features initially handled state differently. Game Detail pages (`/game/:igdbId`) and system platform filters (`/systems/:platformId`) used URL routes, making them bookmarkable, shareable, and back-button safe. Custom lists (`/lists`), however, initially rendered individual list contents using local component state (`useState`). The IA audit flagged this asymmetry. I refactored custom lists into dedicated routed pages (`/lists/:listId`), ensuring every core content view supports direct URL sharing and predictable browser history navigation.

### Eliminating Placement Ambiguity & Disconnected Actions
Certain workflows naturally fit multiple entry points. Platform browsing made sense both as a dedicated top-level view (`/systems`) and as an inline filter within the main Library (`/`). Similarly, interactive features like Backlog Roulette and Year in Review belonged logically within specific destination screens (`/recommend` and `/activity`) but also needed rapid access during casual browsing. Rather than forcing a single artificial path, I maintained context-specific entry points while exposing both tools directly as keyboard actions inside the `⌘K` Command Palette. At the same time, I standardized route nomenclature across the sidebar, screen headings, and palette items so users always encounter consistent labeling.

## 4. Design System & Build Rigor

Building rapidly with AI assistance can lead to visual drift if styling rules are unverified. To prevent token fragmentation, I conducted a static code audit of all 41 UI components and screens against the core design tokens (`gamelog-design-system-audit.md`).

The audit evaluated semantic Apple HIG token adoption (`theme.css`), spacing scales, and accessibility compliance:
- **Semantic Color & Surface Tokens:** Systematically checked token adoption across the codebase. `theme.css` establishes dark-mode window backgrounds (`--apple-window-bg`), elevated card surfaces (`--apple-secondary-bg`), subtle separators (`rgba(84, 84, 88, 0.65)`), an 8pt spacing grid (`--space-*`), and a major-third typography scale (`--font-size-*`). The audit identified older views where rapid prototyping bypassed tokens in favor of hardcoded hex values or raw pixel padding, establishing a concrete refactoring backlog.
- **Component Accessibility & ARIA Semantics:** Evaluated interactive shells for WAI-ARIA compliance. The shared `Modal` component correctly implements focus traps, `role="dialog"`, `aria-modal`, and Escape-key dismissals. Read-only rating displays (`StarRating`) combine five stars into a single clean screen reader announcement (`role="img"`, `aria-label="X out of 5 stars"`). Conversely, the audit identified that interactive rating controls (`StarRatingInput`) needed roving tabindex support and explicit `role="radiogroup"` semantics so keyboard and screen-reader users can perceive and adjust ratings as fluently as sighted mouse users.
- **Catching Functional Display Drift:** Rigorous code auditing caught subtle functional regressions that visual skimming misses. For example, the audit discovered that `LibraryTableView.tsx` was rendering 0–5 star ratings with a hardcoded `/ 10` text suffix, accidentally displaying a 4.5-star game as "4.5 / 10." Identifying and resolving this issue restored data accuracy across tabular library views.

[SCREENSHOT: Game Detail screen highlighting Apple HIG card surfaces, rating chips, and related game embeddings]

## 5. Current Status & Next Steps

Gamelog is currently functional and in active iteration. The application runs locally with full IndexedDB persistence, external IGDB integration, and AI-powered semantic similarity search.

Current refinement focus areas include:
- Migrating remaining older screen layouts to adopt the standardized `<Button>` component across all 28 views identified in the design system audit.
- Expanding keyboard roving-tabindex support on multi-element form controls like `StarRatingInput`.
- Fine-tuning responsive layouts and visual card aesthetics across the secondary Activity and Stats views.

## 6. Lesson Learned

Auditing the actual implementation against structural maps (`IA-AUDIT.md`) proved that architectural clarity requires verification, not assumptions. Rapidly generating interface features is only effective when paired with rigorous inventorying to reconcile duplicate patterns, standardize URL routing, and enforce design system semantics.
