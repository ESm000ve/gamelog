# Case Study: Gamelog — Designing a Local-First Game Library Tracker

## 1. The Problem & Origin

Tracking a personal video game library today forces a frustrating trade-off. Mainstream cataloging services are cluttered with social feeds, slow web page loads, and ads. Generic spreadsheets or database templates offer privacy and control, but they lack rich video game metadata, cover art aesthetics, and fast logging workflows.

I wanted a dedicated tool designed around the psychology of managing a game collection. Players need to see what they own across platforms, log play sessions quickly, rate titles on a precise scale, and find what to play next without wading through community forums or waiting on server roundtrips.

I conceived and designed Gamelog to solve this directly. Built under my direction with AI assistance, Gamelog prioritizes speed, local data ownership via browser IndexedDB, and a macOS-inspired Apple Human Interface Guidelines (HIG) visual environment.

## 2. The Concept & Audience

Gamelog is built for multi-platform gamers who value fast organization and tactile utility over social networking features. 

The core experience centers on three principles:
- **Instant local persistence:** Every game entry, play log, custom list, and tag is stored locally in IndexedDB (`db/schema.ts`). Navigation and searches happen with zero network latency.
- **Keyboard-first interaction:** A persistent `⌘K` Command Palette allows jumping between screens, launching actions, and inspecting library titles without lifting hands from the keyboard.
- **Intelligent discovery:** Instead of static keyword filters alone, Gamelog integrates local vector embeddings (`models/gemini-embedding-001`) to match related games by mechanics, atmosphere, and gameplay themes.

[SCREENSHOT: Library view displaying the grid of game covers, platform filter chips, and top-right global search widget]

## 3. Designing the Information Architecture

As the application grew, managing its structural clarity required a comprehensive Information Architecture audit (`IA-AUDIT.md`) and a formal interactive sitemap (`sitemap.html`).

The audit mapped every navigation path across the app's genuine scale:
- **15 full-page routed screens** (Library, Search Results, Lists, Single List, Stats, What to Play Next, Activity & Milestones, Compare Libraries, Browse by System, Platform Filtered System, Settings, Review Steam Import, Store Diagnostic Check, Game Detail, and Related Games).
- **6 global modals and sheets** (Add Game, Log Editor, Add to List, Share Library/List, Backlog Roulette, and Year in Review).
- **1 persistent Command Palette overlay** (`⌘K` / `/`).
- **1 persistent Global Search widget** pinned to the header across screens.

[SCREENSHOT: Visual sitemap diagram showing the 15 routed destinations and layered modal workflows]

Auditing the structure surfaced several concrete organizational tensions that required explicit design decisions:

### Resolving Dual Search Intent
The application contained two prominent search interfaces: a top-right search box and the global `⌘K` Command Palette. Auditing revealed user intent ambiguity between searching external databases versus searching existing local inventory. I clarified their responsibilities by dedicating the top-right Global Search strictly to querying the external IGDB catalog for discovering and adding new titles, while the `⌘K` Command Palette focuses exclusively on local library filtering and navigation commands. Explicit placeholder copy and tooltip labels now reinforce this separation.

### Standardizing Deep-Linkability
Structurally similar features initially handled state differently. Game Detail pages (`/game/:igdbId`) and system platform filters (`/systems/:platformId`) used URL routes, making them bookmarkable and back-button safe. Custom lists (`/lists`), however, initially rendered individual list contents using local component state (`useState`). The IA audit flagged this asymmetry. I refactored custom lists into routed pages (`/lists/:listId`), ensuring every core content view supports direct URL sharing and browser history navigation.

### Resolving Placement Ambiguity
Certain workflows naturally fit multiple entry points. Platform browsing made sense both as a dedicated top-level view (`/systems`) and as an inline filter within the main Library (`/`). Similarly, the Backlog Roulette feature belonged logically within the "What to Play Next" recommendation screen (`/recommend`) but also needed rapid access during casual browsing. Rather than forcing a single artificial path, I maintained dual entry points where intent justified it, while standardizing route labels across the sidebar, screen headings, and command palette.

## 4. Design System & Build Rigor

Building rapidly with AI assistance can lead to visual drift if styling rules are unverified. To prevent token fragmentation, I conducted a static code audit of all 41 UI components and screens against the core design tokens (`gamelog-design-system-audit.md`).

The audit evaluated semantic Apple HIG token adoption (`theme.css`), spacing scales, and accessibility compliance:
- **Semantic Color & Surface Tokens:** Verified dark mode window backgrounds (`--apple-window-bg`), surface elevations (`--apple-secondary-bg`), and border separators (`rgba(84, 84, 88, 0.65)`). Where earlier prototypes bypassed tokens for hardcoded hex values, the audit systematically flagged them for replacement.
- **Component Accessibility:** Evaluated interactive shells for WAI-ARIA compliance. The shared `Modal` component implements focus traps, `role="dialog"`, `aria-modal`, and Escape-key dismissals. Read-only rating components (`StarRating`) combine stars into a single clean screen reader announcement (`role="img"`, `aria-label="X out of 5 stars"`), while interactive rating controls (`StarRatingInput`) were audited to ensure keyboard focus indicators and assistive technology labels match visual states.

[SCREENSHOT: Game Detail screen highlighting Apple HIG card surfaces, rating chips, and related game embeddings]

## 5. Current Status & Next Steps

Gamelog is currently functional and in active iteration. The application runs locally with full IndexedDB persistence, external IGDB integration, and AI-powered semantic similarity search.

Current refinement focus areas include:
- Migrating remaining older screen layouts to adopt the standardized `<Button>` component across all 28 views identified in the design system audit.
- Expanding keyboard roving-tabindex support on multi-element form controls like `StarRatingInput`.
- Fine-tuning responsive layouts and visual card aesthetics across the secondary Activity and Stats views.

## 6. Lesson Learned

Auditing the actual implementation against structural maps (`IA-AUDIT.md`) proved that architectural clarity requires verification, not assumptions. Rapidly generating interface features is only effective when paired with rigorous inventorying to reconcile duplicate patterns, standardize URL routing, and enforce design system semantics.
