import { useState, useEffect } from "react";
import { RefreshCw, Star, Edit3, CheckCircle2, Circle, Layers, Play, Heart } from "lucide-react";
import { StarRatingInput } from "./StarRating";
import { STATUS_COLORS, STATUS_SUBTLE } from "./StatusChip";
import type { Status } from "../types";

// ─── Minimal game shape the card needs ───────────────────────────────────────

export interface CoverCardGame {
  igdbId:     number;
  title:      string;
  status?:    Status;
  rating?:    number;
  coverUrl?:  string;
  coverColor?: string;
  platform?:  string;
  releaseYear?: number;
  firstReleaseDate?: number;
  completionPercentage?: number;
  dealPrice?: number;
  dealUrl?: string;
}

const PLATFORM_ABBREVIATIONS: Record<string, string> = {
  "PlayStation 5": "PS5",
  "PlayStation 4": "PS4",
  "PlayStation 3": "PS3",
  "PlayStation 2": "PS2",
  "PlayStation": "PS1",
  "Nintendo Switch": "Switch",
  "Xbox Series X|S": "Xbox Series",
  "Xbox One": "Xbox One",
  "Xbox 360": "Xbox 360",
  "Super Nintendo Entertainment System (SNES)": "SNES",
  "Super Nintendo Entertainment System": "SNES",
  "Nintendo Entertainment System (NES)": "NES",
  "Nintendo Entertainment System": "NES",
  "Nintendo 64": "N64",
  "Nintendo GameCube": "NGC",
  "Nintendo 3DS": "3DS",
  "Sega Mega Drive/Genesis": "Genesis",
  "PC (Microsoft Windows)": "PC",
};

function shortPlatform(p?: string) {
  if (!p) return "";
  return PLATFORM_ABBREVIATIONS[p] || p;
}

function StatusIcon({ status }: { status: Status }) {
  switch (status) {
    case "Backlog": return <Layers size={10} />;
    case "Playing": return <Play size={10} />;
    case "Played": return <CheckCircle2 size={10} />;
    case "Wishlist": return <Heart size={10} />;
    default: return null;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CoverCardProps {
  game:             CoverCardGame;
  onClick?:         (igdbId: number) => void;
  onChangeStatus?:  (igdbId: number, status: Status) => void;
  onRate?:          (igdbId: number, rating: number) => void;
  onLog?:           (igdbId: number) => void;
  selectable?:      boolean;
  selected?:        boolean;
  onToggleSelect?:  (igdbId: number, e: React.MouseEvent) => void;
}

// ─── Quick-action buttons shown on hover ─────────────────────────────────────

const ACTIONS = [
  { Icon: RefreshCw, title: "Change status", key: "status" as const },
  { Icon: Star,      title: "Rate",          key: "rate"   as const },
  { Icon: Edit3,     title: "Log",           key: "log"    as const },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function CoverCard({ game, onClick, onChangeStatus, onRate, onLog, selectable, selected, onToggleSelect }: CoverCardProps) {
  const [hovered, setHovered] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [rateMenuOpen, setRateMenuOpen] = useState(false);

  // Close dropdowns on click away
  useEffect(() => {
    if (!statusMenuOpen && !rateMenuOpen) return;
    const handle = () => {
      setStatusMenuOpen(false);
      setRateMenuOpen(false);
    };
    window.addEventListener("click", handle);
    return () => window.removeEventListener("click", handle);
  }, [statusMenuOpen, rateMenuOpen]);

  const fallbackColor = game.coverColor ?? "var(--apple-tertiary-bg)";
  const anyMenuOpen = statusMenuOpen || rateMenuOpen;
  // Single source of truth for whether the hover-revealed quick actions are
  // actually visible/interactive — drives aria-hidden, opacity, pointerEvents,
  // and each button's tabIndex consistently, so nothing stays keyboard-focusable
  // while invisible or aria-hidden.
  const quickActionsVisible = !selectable && (hovered || anyMenuOpen);

  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        gap:           8,
        position:      "relative",
      }}
    >
      {/* ── Cover tile (3:4 aspect) ── */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${game.title}${game.status ? `, Status: ${game.status}` : ''}`}
        style={{
          display:      "block",
          textAlign:    "left",
          position:     "relative",
          width:        "100%",
          aspectRatio:  "3/4",
          borderRadius: "var(--radius-xl)",
          overflow:     "hidden",
          background:   fallbackColor,
          cursor:       "pointer",
          userSelect:   "none",
          transition:   "transform 180ms ease, box-shadow 180ms ease, box-shadow 180ms ease",
          boxShadow:    selected
            ? "0 0 0 3px var(--apple-accent), 0 8px 24px rgba(0,0,0,0.5)"
            : hovered
            ? "0 8px 24px rgba(0,0,0,0.5)"
            : "0 2px 8px rgba(0,0,0,0.3)",
          transform:    hovered && !selectable ? "translateY(-2px)" : "none",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (selectable) {
              onToggleSelect?.(game.igdbId, e as unknown as React.MouseEvent);
            } else {
              onClick?.(game.igdbId);
            }
          }
        }}
        onClick={(e) => {
          if (selectable) {
            onToggleSelect?.(game.igdbId, e);
          } else {
            onClick?.(game.igdbId);
          }
        }}
      >
        {/* Cover image */}
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.title}
            style={{
              position:   "absolute",
              inset:      0,
              width:      "100%",
              height:     "100%",
              objectFit:  "cover",
            }}
            draggable={false}
          />
        ) : (
          <div
            style={{
              position:       "absolute",
              inset:          0,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              padding:        "var(--space-3)",
            }}
          >
            <span
              style={{
                color:      "var(--apple-label)",
                fontSize:   "clamp(11px, 1.8cqw, 15px)",
                fontFamily: "var(--apple-font-text)",
                fontWeight: 600,
                textAlign:  "center",
                lineHeight: 1.25,
                wordBreak:  "break-word",
              }}
            >
              {game.title}
            </span>
          </div>
        )}


        {/* Hover overlay — frosted glass with quick actions */}
        <div
          aria-hidden={!quickActionsVisible}
          style={{
            position:        "absolute",
            inset:           0,
            display:         "flex",
            flexDirection:   "column",
            alignItems:      "center",
            justifyContent:  "center",
            gap:             "var(--space-2)",
            background:      "rgba(0,0,0,0.45)",
            opacity:         quickActionsVisible ? 1 : 0,
            pointerEvents:   quickActionsVisible ? "auto" : "none",
            transition:      "opacity 160ms ease",
          }}
        >
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {ACTIONS.map(({ Icon, title, key }) => (
              <button
                key={key}
                title={title}
                aria-label={title}
                tabIndex={quickActionsVisible ? 0 : -1}
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusMenuOpen(false);
                  setRateMenuOpen(false);
                  if (key === "status") {
                    setStatusMenuOpen(true);
                  } else if (key === "log") {
                    onLog?.(game.igdbId);
                  } else if (key === "rate") {
                    setRateMenuOpen(true);
                  }
                }}
                style={{
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  width:           44,
                  height:          44,
                  borderRadius:    "50%",
                  background:      "transparent",
                  border:          "1px solid rgba(255,255,255,0.2)",
                  color:           "var(--apple-white)",
                  transition:      "background 120ms ease, border-color 120ms ease",
                  cursor:          "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background    = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.borderColor   = "rgba(255,255,255,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background    = "transparent";
                  e.currentTarget.style.borderColor   = "rgba(255,255,255,0.2)";
                }}
              >
                <Icon size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        {/* Selection checkmark — top-right */}
        {selectable && (
          <div
            aria-hidden="true"
            style={{
              position:     "absolute",
              top:          "var(--space-2)",
              right:        "var(--space-2)",
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              background:   selected ? "var(--apple-accent)" : "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              color:        selected ? "white" : "rgba(255,255,255,0.7)",
              borderRadius: "50%",
              width:        22,
              height:       22,
              border:       `1px solid ${selected ? "var(--apple-accent)" : "rgba(255,255,255,0.4)"}`,
              transition:   "all 120ms ease",
              boxShadow:    "0 2px 8px rgba(0,0,0,0.3)",
              zIndex:       10,
            }}
          >
            {selected ? <CheckCircle2 size={16} color="white" /> : <Circle size={16} />}
          </div>
        )}

        {/* Deal Badge */}
        {game.dealPrice !== undefined && (
          <a
            href={game.dealUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="View deal on CheapShark"
            style={{
              position: "absolute",
              top: "var(--space-2)",
              left: "var(--space-2)",
              background: "var(--apple-green)",
              color: "white",
              padding: "var(--space-1) var(--space-2)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 700,
              zIndex: 10,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            ${game.dealPrice.toFixed(2)}
          </a>
        )}

        {/* Completion Progress Bar */}
        {(game.completionPercentage ?? 0) > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "rgba(0,0,0,0.5)",
              zIndex: 10,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${game.completionPercentage}%`,
                background: "var(--apple-accent)",
              }}
            />
          </div>
        )}
      </div>

      {/* ── Status Context Menu ── */}
      {statusMenuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 100,
            background: "var(--apple-tertiary-bg)",
            border: "1px solid var(--apple-separator)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-1) 0",
            minWidth: 140,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {(["Wishlist", "Backlog", "Playing", "Played"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.stopPropagation();
                onChangeStatus?.(game.igdbId, s);
                setStatusMenuOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                width: "100%",
                padding: "6px var(--space-3)",
                background: "transparent",
                color: "var(--apple-label)",
                fontSize: "var(--font-size-base)",
                textAlign: "left",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--apple-fill)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[s] }} />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Rate Context Menu ── */}
      {rateMenuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 100,
            background: "var(--apple-tertiary-bg)",
            border: "1px solid var(--apple-separator)",
            borderRadius: "var(--radius-2xl)",
            padding: "var(--space-3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "var(--apple-secondary-label)", fontSize: 11, fontWeight: 500 }}>
            Set Rating
          </span>
          <StarRatingInput
            size={22}
            value={game.rating ?? 0}
            onChange={(val) => {
              onRate?.(game.igdbId, val);
              setRateMenuOpen(false);
            }}
          />
        </div>
      )}

      {/* ── Metadata below tile ── */}
      <div style={{ padding: "0 2px", display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
        {/* Row 1: System + Year */}
        <div
          style={{
            fontSize: 11,
            color: "var(--apple-secondary-label)",
            fontFamily: "var(--apple-font-text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.2,
            minHeight: 14,
          }}
        >
          {[shortPlatform(game.platform), game.releaseYear].filter(Boolean).join(" · ")}
        </div>

        {/* Row 2: Status & Rating */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 20 }}>
          {game.status ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px var(--space-2)",
                borderRadius: 12,
                background: (game.status ? STATUS_SUBTLE[game.status] : null) || "var(--apple-tertiary-bg)",
                color: (game.status ? STATUS_COLORS[game.status] : null) || "var(--apple-secondary-label)",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "var(--apple-font-text)",
              }}
            >
              <StatusIcon status={game.status} />
              {game.status === "Played" ? "Completed" : game.status}
            </div>
          ) : (
            <div />
          )}
          
          {typeof game.rating === "number" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 2, color: "var(--apple-secondary-label)", fontSize: 11, fontWeight: 500 }}>
              <Star size={12} fill="var(--apple-orange)" color="var(--apple-orange)" aria-hidden="true" />
              {game.rating.toFixed(1)}
            </div>
          ) : (
             <div style={{ display: "flex", alignItems: "center", gap: 2, color: "var(--apple-secondary-label)", fontSize: 11 }} aria-label="Not rated">
               <Star size={12} aria-hidden="true" />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
