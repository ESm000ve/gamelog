# Gamelog — Design System Audit

**Scope:** `src/` — 41 component/screen files, `styles/theme.css`, `styles/globals.css`
**Method:** Static analysis of token definitions vs. actual usage across the codebase (no visual/Figma review — code only)

## Summary

**Components reviewed:** 41 files (9 shared UI/layout components, 32 screen files) | **Issues found:** 10 | **Score:** 40/100

The token foundation (`theme.css`) is genuinely well built — full Apple HIG-style semantic color system, 8pt spacing scale, type scale, radius scale, shadows, z-index. The problem isn't the tokens, it's that most of the codebase doesn't use them. Screens largely hand-roll inline styles with raw pixel values instead of pulling from the scale, and two shared components (`Button`, `Modal`) exist but are barely adopted elsewhere.

*Updated after the original pass: `StarRating`/`StarRatingInput` and `CoverCard` — originally flagged as "not deeply audited" — got a full states/variants/token/a11y review (findings below, bug count updated from 8 to 10). No code was changed as part of this update; findings only.*

## Token Coverage

| Category | Token Defined | Bypass Rate | Detail |
|----------|---------------|-------------|--------|
| Spacing (`--space-*`) | ✅ 9-step 8pt scale | **~99.6%** | 260 raw px values in `padding` vs. 1 use of `var(--space-*)` |
| Typography (`--font-size-*`) | ✅ 7-step scale (10–32px) | **~99.5%** | 400+ raw numeric `fontSize` values (9, 11, 14, 15, 18, 22, 24, 26, 28, 44...) vs. 2 uses of the scale. Most raw values don't even land on the defined scale steps. |
| Corner radius (`--radius-*`) | ✅ 7-step scale | ~43% | 149 uses of `var(--radius-*)` vs. 112 raw numeric values |
| Color | ✅ Full semantic system + 8 accent themes | ~good, with exceptions | 10 of 41 files hardcode hex instead of tokens — see below |
| Shadows/Z-index | ✅ Defined | Not exercised outside Modal | Only referenced in a couple of places; most floating elements use ad hoc `boxShadow` strings |

### Hardcoded hex colors (should be tokens)

Found in 10 files, concentrated in `screens/Activity/*`:

| File | Hardcoded values |
|------|-------------------|
| `Activity/YearInReviewModal.tsx` | `#fff` (16×), `#ffd60a`, `#0a84ff`, `#bf5af2`, `#ff9f0a`, `#30d158`, `#ff375f`, `#5e5ce6`, `#121214`, `#000` |
| `Activity/AchievementsSection.tsx` | `#ffd60a` (7×), `#fff`, `#ff9f0a` |
| `SettingsScreen.tsx` | `#fff` (7×) |
| `ShareListModal.tsx` | `#fff` (6×) |
| `Library/LibraryTableView.tsx` | `#ffd60a`, `#ff9f0a`, `#ff453a`, `#bf5af2`, `#0a84ff` |
| `ActivityScreen.tsx`, `TimelineFeed.tsx`, `ContributionHeatmap.tsx`, `LibraryScreen.tsx`, `CommandPalette.tsx` | scattered `#fff`/status colors |

Nearly every one of these hex values is a literal restate of an existing token (`#ffd60a` = `--apple-yellow`, `#0a84ff` = `--apple-blue`, `#bf5af2` = accent purple, `#5e5ce6` = `--apple-accent`). This isn't a missing-token problem, it's a not-importing-the-token problem — likely copy-pasted from an earlier static prototype and never swapped over.

## Component Completeness

| Component | States | Variants | Adoption | Score |
|-----------|--------|----------|----------|-------|
| `Button` | ✅ hover/disabled/loading | ✅ 5 variants × 3 sizes | ⚠️ used in only **3 of 41** files — everywhere else uses raw `<button>` with inline styles | 5/10 |
| `Modal` | ✅ focus trap, ARIA, escape | — | ⚠️ used in only **1 of 6** modal-style components | 5/10 |
| `StatusChip` | ✅ active/hover | ✅ compact mode | Used in 5 files — fine | 8/10 |
| `StarRating` | Display variant: no states (correct — it's non-interactive) with a genuinely correct `role="img"` + `aria-label` pattern. Input variant: hover only — no distinct focus feedback, no disabled state | Size-only (`size` prop); no compact/preset system; display and input variants use different prop names (`rating` vs `value`) for the same concept | Display component used in only **2 of 41** files; input variant in only **2 of 41**. Rating is hand-rolled independently in 3+ other places, inconsistently, including one with a real display bug (see below) | 4/10 |
| `CoverCard` | hover ✅, selected ✅, keyboard Enter/Space ✅ — but **no visible focus indicator** (see below), and quick-action buttons stay keyboard-focusable while visually and semantically hidden | Single fixed layout; no compact/row variant despite `LibraryTableView.tsx` needing an equivalent for its table rows | Used in **5 files** (`LibraryScreen`, `SearchScreen`, `SystemsScreen`, `FriendsScreen` ×2) — reasonable direct adoption, but rating/status display is reimplemented piecemeal elsewhere rather than reused | 5/10 |

### Button: built but ignored

`components/ui/Button.tsx` is a solid, complete component — 5 variants, 3 sizes, loading state, disabled state, hover feedback. It's used in exactly 3 screens (`ListsScreen`, `LogEditor`, `GameDetailScreen`). The other 28 files that render buttons all hand-roll their own `<button>` with inline styles, meaning padding, radius, hover behavior, and disabled states are all reimplemented — and drift — independently per screen. This is the single highest-leverage fix available: every one of those 28 files is a candidate for a one-line swap to `<Button>`.

### Modal: five reimplementations of the same shell

`components/ui/Modal.tsx` handles the overlay, focus trap, `role="dialog"`, `aria-modal`, and escape-to-close correctly. But five other components build their own modal/sheet shell from scratch instead of composing it:

| Component | Has `role="dialog"` | Has `aria-modal` | Has focus trap | Has Escape handler |
|---|---|---|---|---|
| `Modal.tsx` (shared) | ✅ | ✅ | ✅ | ✅ |
| `AddToListSheet.tsx` | ✅ | ✅ | ✅ | uses shared hook — OK |
| `AddGameModal.tsx` | ✅ | ✅ | ✅ | OK |
| `YearInReviewModal.tsx` | ❌ | ❌ | ❌ | ✅ (Escape only) |
| `RouletteModal.tsx` | ❌ | ❌ | ❌ | ❌ |
| `ShareListModal.tsx` | ❌ | ❌ | ❌ | ❌ |

`AddToListSheet` and `AddGameModal` independently reimplemented the *correct* behavior (they import `useFocusTrap` and set ARIA attributes by hand), which proves the pattern is known — it's just not centralized. `RouletteModal` and `ShareListModal` have none of it: no screen-reader announcement that a dialog opened, no focus trap (keyboard/screen-reader users can tab out into the page behind the overlay), no Escape-to-close. `YearInReviewModal` handles Escape but has no dialog semantics or focus trap either.

### StarRating: the display variant does ARIA correctly; the input variant doesn't, and adoption is worse than Button's

`components/StarRating.tsx` actually contains two components sharing a file: `StarRating` (read-only display) and `StarRatingInput` (editable). They deserve separate verdicts.

**`StarRating` (display) is genuinely well built.** It wraps the whole 5-star row in a single `<span role="img" aria-label="{rating} out of 5 stars">` and marks every individual star `aria-hidden="true"`. That's the correct WAI pattern for a composite read-only rating — a screen reader hears one clean announcement ("4.5 out of 5 stars") instead of five separate "star, star, star, half star, empty star" fragments. This is better ARIA practice than most of the rest of the codebase and should be the reference pattern going forward.

**`StarRatingInput` (editable) has the opposite problem.** Each half-star is its own `<button>` (10 buttons for a 5-star control), each with `aria-label="{n} stars"` — so a screen reader user tabbing through hears "0.5 stars, button… 1 stars, button… 1.5 stars, button…" ten times with **no indication of which value is currently selected**. There's no `aria-pressed`, no `aria-checked`, no `role="radiogroup"`/`role="radio"`, and no `role="slider"` with `aria-valuenow` — any of which is the standard accessible pattern for this control type. A sighted mouse user sees exactly which stars are filled; a screen reader user gets zero equivalent signal. This is the single most consequential gap for a control the audit flagged up front as one of the app's most-used interactions.

Compounding it: all 10 buttons are individually tabbable with no roving-tabindex or arrow-key support, so keyboard users take 10 Tab presses to get past one rating control, versus the single Tab stop (plus arrow keys) a `radiogroup` or `slider` pattern would give them. Hover gives mouse users a `scale(1.15)` preview on the star under the cursor; there's no focus-driven equivalent, so keyboard users get the browser's default (invisible-by-default here, since these are real `<button>` elements and do inherit the global `:focus-visible` ring) but not the same "you're about to select this" preview.

**Adoption is thin and inconsistent.** `StarRating` (display) is used in only `LogEditor.tsx` and `GameDetailScreen.tsx`. `StarRatingInput` is used in only `LogEditor.tsx` and `CoverCard.tsx`. Everywhere else that shows a rating, it's hand-rolled with a single raw `<Star>` icon from `lucide-react`, independently, three different ways:

- `LibraryTableView.tsx:187` — icon **not** `aria-hidden`, paired with `{log.rating} / 10` text. See the scale bug below.
- `CoverCard.tsx:466` (its own "already rated" summary row, separate from the `StarRatingInput` popover) — icon **not** `aria-hidden`, inconsistent with the same file's "not rated" fallback three lines down, which does add `aria-hidden` to its icon.
- `StatsScreen.tsx:323` and `TimelineFeed.tsx:141` — correctly `aria-hidden` or low-risk (icon is purely decorative next to a labeled stat / event title).

None of these three ad hoc spots reuse `StarRating`, so none of them get its `role="img"` + single-announcement treatment, and their `aria-hidden` usage on the icon is applied inconsistently even within the same file (`CoverCard.tsx`).

### CoverCard: solid interaction model, undercut by two concrete keyboard/AT bugs

The card itself is well-structured — `role="button"` + `tabIndex={0}` + manual `onKeyDown` handling for Enter/Space, correct `aria-label` combining title and status, a real `selected` state with its own `boxShadow`/checkmark treatment, and hover-revealed quick actions (change status, rate, log) that are real `<button>` elements rather than clickable `<div>`s. Adoption across the 5 places a game cover needs to render is solid.

Two things break the keyboard/screen-reader experience specifically, though:

1. **The cover tile has no visible focus indicator at all.** `globals.css`'s global focus ring (noted as a strength in "What's Working" above) is scoped to the literal selectors `button`, `input`, `textarea`, `select` (`globals.css:44-48`) — it does not match `[role="button"]`. Since the clickable cover tile is a `<div role="button">`, not an actual `<button>`, it never receives that ring, and nothing in `CoverCard.tsx` adds an equivalent `:focus-visible` style of its own. A keyboard user tabbing through a game library gets zero visual indication of which card is focused — on what's likely the single most-used surface in the app. Every other interactive element in the codebase (real `<button>`s) gets this ring for free; this one silently doesn't, because it isn't a real button.
2. **The hover-revealed quick-action buttons stay in the tab order while `aria-hidden`.** The overlay wrapping the "change status / rate / log" buttons is marked `aria-hidden={!hovered && !anyMenuOpen}` (`CoverCard.tsx:199`) to hide it visually and semantically when not hovered — but the three `<button>` elements inside it have no `tabIndex={-1}` or `disabled` applied to match. `aria-hidden="true"` on a container does not remove focusable descendants from the tab order; it just makes assistive tech treat them as hidden while they remain reachable by keyboard. The result is keyboard-focusable buttons sitting inside an `aria-hidden` subtree — a well-known, automatically-flagged violation pattern (axe-core's `aria-hidden-focus` rule) — and in practice, a keyboard user tabbing through the page lands on an invisible, unannounced "Change status" button with no visible focus ring (compounding bug #1) and no screen-reader announcement (because of `aria-hidden`).

Neither the status nor rate popover menus (`CoverCard.tsx:339-420`) have an Escape-to-close handler or a focus trap — they close only via a `window`-level click listener. This is the same gap category the original audit flagged for `RouletteModal`/`ShareListModal`, just not called out there since these menus weren't in scope for the Modal review.

### Rating scale display bug (functional, not just a11y)

`Log.rating` is typed and stored as **0–5** in 0.5 increments (`types/index.ts:96-97`, and confirmed by `StarRatingInput`'s own math: `n - 1 + offset` for `n` in `1..5` tops out at exactly `5`). Every consumer treats it that way — `StarRating`, `LogEditor.tsx`, `GameDetailScreen.tsx`, and `CoverCard.tsx`'s own rating summary all display it as "X.X out of 5" or a fraction of 5 filled stars.

`LibraryTableView.tsx:184-193` is the exception: it renders the raw value with a hardcoded `{log.rating} / 10` suffix. A 4.5-star log — effectively a 90% rating — displays as **"4.5 / 10,"** which reads as 45%. This isn't a styling or token issue, it's the library table telling the user their game is rated half of what it actually is. No `*2` conversion exists anywhere else in the codebase that would make `/ 10` correct, so this is isolated, unambiguous, and worth fixing independent of anything else in this report.

## Bugs Found

1. **Undefined token reference** — `Modal.tsx` line 50 sets `borderRadius: "var(--radius-3xl)"`, but `theme.css` only defines up to `--radius-2xl`. This resolves to nothing (falls back to the inherited/initial value), so the modal's corner radius is silently broken relative to design intent.
2. **Status color collision** — `StatusChip.tsx`'s `STATUS_COLORS`/`STATUS_SUBTLE` maps `Played`, `Completed`, `Mastered`, `Abandoned`, and `Shelved` all to `--apple-orange`. Five semantically distinct statuses are visually identical wherever a status dot or subtle background is shown. This looks like a placeholder that never got finished — each status should probably get its own tone (e.g., using the unused pink/purple/red slots already in `theme.css`).
3. **Rating scale display bug** — `LibraryTableView.tsx:184-193` shows `Log.rating` (a 0–5 value) with a hardcoded `/ 10` suffix. A 4.5-star rating renders as "4.5 / 10," understating it by half. Every other consumer of `rating` in the codebase treats it correctly as 0–5. Detail and evidence in the `CoverCard`/`StarRating` deep-dive above.
4. **Keyboard-focusable content inside `aria-hidden`** — `CoverCard.tsx:199-256`'s hover-revealed quick-action buttons (change status / rate / log) remain in the tab order while their container is `aria-hidden`, and separately, the clickable cover tile (`role="button"` on a `<div>`) never receives the app's global focus-visible ring since that rule only targets real `button`/`input`/`textarea`/`select` elements. Detail in the `CoverCard` section above.

## What's Working

- Global focus-visible ring is correctly implemented once, in `globals.css`, for both `button` and form elements (`outline: 2px solid var(--apple-accent)`) — this is inherited everywhere automatically, so keyboard focus is fine app-wide even where components skip explicit styling.
- No global `outline: none` resets that would kill focus indicators.
- The token file itself (`theme.css`) is thorough: light/dark mode via both `prefers-color-scheme` and explicit `data-theme`, 8 selectable accent themes, and a real 8pt spacing grid.

## Priority Actions

1. **Swap raw `<button>` for `<Button>` in the 28 files still hand-rolling buttons.** This is the single change that would collapse the padding/radius/hover inconsistency problem, since `Button` already encodes the correct token usage.
2. **Route `ShareListModal`, `RouletteModal`, and `YearInReviewModal` through the shared `Modal` component** (or at minimum add `role="dialog"`, `aria-modal`, and `useFocusTrap` to match `AddToListSheet`/`AddGameModal`) — this is an accessibility gap, not just a style one.
3. **Fix the `STATUS_COLORS` mapping** so `Played`/`Completed`/`Mastered`/`Abandoned`/`Shelved` each get a distinct color, and fix the dangling `--radius-3xl` reference in `Modal.tsx` (either add the token to `theme.css` or drop to `--radius-2xl`).
4. **Sweep `screens/Activity/*`, `SettingsScreen.tsx`, and `ShareListModal.tsx`** for hardcoded hex and replace with the matching `--apple-*` token — these files account for the bulk of the color-token bypass.
5. **Longer term:** introduce `padding`/`fontSize` lint coverage (or a small style-dictionary/lint rule) so raw px values in these properties get flagged in review, since the 8pt spacing and type scale exist but have essentially no enforcement.
6. **Fix the `LibraryTableView.tsx` rating display bug** (`/ 10` on a 0–5 value) — one-line, unambiguous, currently misrepresenting every rated game in the table view.
7. **Give `StarRatingInput` real selection semantics** (`role="radiogroup"`/`radio` or `role="slider"` with `aria-valuenow`/`aria-valuetext`) instead of 10 unlabeled-state buttons — this is the app's primary rating interaction and currently gives screen reader users no way to perceive the current rating.
8. **Fix `CoverCard`'s two keyboard gaps**: add an explicit `:focus-visible` style to the cover tile (it's a `div[role="button"]`, so it doesn't inherit the global button focus ring), and either remove the hover-only quick-action buttons from the tab order when hidden (`tabIndex={-1}` toggled alongside `aria-hidden`) or restructure so they're not focusable while invisible.
9. **Consolidate the 3+ hand-rolled rating displays** (`LibraryTableView.tsx`, `CoverCard.tsx`'s own summary row, and the general pattern) onto the existing `StarRating` display component so its correct `role="img"` + single-announcement pattern is inherited everywhere instead of reimplemented — and fixed — once.
