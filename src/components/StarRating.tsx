import { useRef } from "react";
import { Star, StarHalf } from "lucide-react";

// ─── Display-only variant ─────────────────────────────────────────────────────

interface StarRatingDisplayProps {
  /** 0–5 in 0.5 steps */
  rating: number;
  /** Icon size in px. Default 11 */
  size?:  number;
  /** Show numeric value beside stars. Default true */
  showValue?: boolean;
}

export function StarRating({
  rating,
  size = 11,
  showValue = true,
}: StarRatingDisplayProps) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span
      role="img"
      style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} size={size} fill="var(--apple-yellow)" stroke="none" aria-hidden="true" />
      ))}
      {half && (
        <StarHalf size={size} fill="var(--apple-yellow)" stroke="none" aria-hidden="true" />
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star
          key={`e${i}`}
          size={size}
          fill="none"
          stroke="var(--apple-tertiary-label)"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ))}
      {showValue && (
        <span
          style={{
            marginLeft:        "var(--space-1)",
            color:             "var(--apple-yellow)",
            fontSize:          size - 1,
            fontWeight:        500,
            lineHeight:        1,
            fontVariantNumeric: "tabular-nums",
            fontFamily:        "var(--apple-font-text)",
          }}
        >
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}

// ─── Interactive variant (used in Log Editor) ─────────────────────────────────

interface StarRatingInputProps {
  value:    number;
  onChange: (v: number) => void;
  size?:    number;
}

export function StarRatingInput({ value, onChange, size = 26 }: StarRatingInputProps) {
  // Roving tabindex target: the selected value if one exists, otherwise the
  // first star, so the control always has exactly one Tab stop.
  const tabStopVal = value && value > 0 ? value : 0.5;
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, val: number) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(5, val + 0.5);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(0.5, val - 0.5);
    else if (e.key === "Home") next = 0.5;
    else if (e.key === "End") next = 5;

    if (next !== null) {
      e.preventDefault();
      onChange(next);
      buttonRefs.current.get(next)?.focus();
    }
  };

  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
      role="radiogroup"
      aria-label="Rating input"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ display: "inline-flex" }}>
          {([0.5, 1] as const).map((offset) => {
            const val = n - 1 + offset;
            const filled = value >= val;
            const checked = value === val;
            return (
              <button
                key={offset}
                ref={(el) => {
                  if (el) buttonRefs.current.set(val, el);
                  else buttonRefs.current.delete(val);
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={val === tabStopVal ? 0 : -1}
                title={`${val} stars`}
                aria-label={`${val} stars`}
                onClick={() => onChange(val)}
                onKeyDown={(e) => handleKeyDown(e, val)}
                style={{
                  width:      size / 2,
                  height:     size,
                  overflow:   "hidden",
                  padding:    0,
                  cursor:     "pointer",
                  background: "none",
                  border:     "none",
                  transition: "transform 80ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                {/* SVG star, clipped to left or right half */}
                <svg
                  width={size}
                  height={size}
                  viewBox="0 0 30 26"
                  style={{ marginLeft: offset === 0.5 ? 0 : -(size / 2) }}
                  aria-hidden="true"
                >
                  <polygon
                    points="15,2 18.5,11 27,12 21,18 23,26 15,22 7,26 9,18 3,12 11.5,11"
                    fill={filled ? "var(--apple-yellow)" : "none"}
                    stroke={filled ? "var(--apple-yellow)" : "var(--apple-tertiary-label)"}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            );
          })}
        </span>
      ))}
    </span>
  );
}
