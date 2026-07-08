import type { Status, Completion } from "../types";

// ─── Status → color mapping ───────────────────────────────────────────────────
// Status and Completion are distinct taxonomies (see types/index.ts) — they get
// their own color maps so each value stays visually distinguishable.

export const STATUS_COLORS: Record<Status, string> = {
  Wishlist: "var(--apple-pink)",
  Backlog:  "var(--apple-blue)",
  Playing:  "var(--apple-green)",
  Played:   "var(--apple-orange)",
};

export const STATUS_SUBTLE: Record<Status, string> = {
  Wishlist: "var(--apple-pink-subtle)",
  Backlog:  "var(--apple-blue-subtle)",
  Playing:  "var(--apple-green-subtle)",
  Played:   "var(--apple-orange-subtle)",
};

// ─── Completion → color mapping ───────────────────────────────────────────────

export const COMPLETION_COLORS: Record<Completion, string> = {
  Completed: "var(--apple-green)",
  Mastered:  "var(--apple-yellow)",
  Abandoned: "var(--apple-red)",
  Shelved:   "var(--apple-purple)",
};

export const COMPLETION_SUBTLE: Record<Completion, string> = {
  Completed: "var(--apple-green-subtle)",
  Mastered:  "var(--apple-yellow-subtle)",
  Abandoned: "var(--apple-red-subtle)",
  Shelved:   "var(--apple-purple-subtle)",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface StatusChipProps {
  label:     Status | "All";
  count?:    number;
  active:    boolean;
  /** Dot color — omit to suppress the dot (e.g. "All" filter) */
  dotColor?: string;
  onClick:   () => void;
  /** Suppress the numeric count (standalone label use) */
  hideCount?: boolean;
  /** Compact mode — less horizontal padding */
  compact?:   boolean;
}

export function StatusChip({
  label,
  count,
  active,
  dotColor,
  onClick,
  hideCount = false,
  compact   = false,
}: StatusChipProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        gap:            8,
        padding:        compact ? "3px 10px" : "6px var(--space-3)",
        minHeight:      44,
        borderRadius:   "var(--radius-full)",
        background:     "transparent",
        border:         `1px solid var(--apple-separator)`,
        color:          active ? "var(--apple-label)" : "var(--apple-secondary-label)",
        fontSize:       "var(--font-size-base)",
        fontFamily:     "var(--apple-font-text)",
        fontWeight:     active ? 500 : 400,
        opacity:        active ? 1 : 0.8,
        transition:     "background 120ms ease, color 120ms ease, opacity 120ms ease, border-color 120ms ease",
        cursor:         "pointer",
        whiteSpace:     "nowrap",
        userSelect:     "none",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = active ? "1" : "0.8"; }}
    >
      {dotColor && (
        <span
          aria-hidden="true"
          style={{
            display:      "inline-block",
            width:        8,
            height:       8,
            borderRadius: "50%",
            background:   dotColor,
            flexShrink:   0,
          }}
        />
      )}
      {label}
      {!hideCount && count !== undefined && (
        <span
          style={{
            color:             "var(--apple-tertiary-label)",
            fontSize:          "var(--font-size-base)",
            marginLeft:        2,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
