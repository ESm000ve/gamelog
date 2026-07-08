import { useState } from "react";
import type { Game, Log, Status, Completion } from "../../types";
import { Star, Clock, Edit3, ArrowUpDown } from "lucide-react";
import type { SortKey } from "../../hooks/useLibrary";
import { STATUS_COLORS, STATUS_SUBTLE, COMPLETION_COLORS, COMPLETION_SUBTLE } from "../../components/StatusChip";
import { Button } from "../../components/ui/Button";

interface LibraryTableViewProps {
  entries: { game: Game; log?: Log }[];
  onOpenGame?: (igdbId: number) => void;
  onOpenLog?: (igdbId: number) => void;
  sortKey?: SortKey;
  onSortChange?: (key: SortKey) => void;
}

export function LibraryTableView({
  entries,
  onOpenGame,
  onOpenLog,
  sortKey,
  onSortChange,
}: LibraryTableViewProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Sources colors from the canonical StatusChip maps so a given status/completion
  // value always renders with the same color everywhere in the app.
  const getStatusBadge = (status?: string) => {
    if (status && status in STATUS_COLORS) {
      const s = status as Status;
      return { label: s, color: STATUS_COLORS[s], bg: STATUS_SUBTLE[s] };
    }
    if (status && status in COMPLETION_COLORS) {
      const c = status as Completion;
      return { label: c, color: COMPLETION_COLORS[c], bg: COMPLETION_SUBTLE[c] };
    }
    return { label: "Unlogged", color: "var(--apple-secondary-label)", bg: "var(--apple-tertiary-bg)" };
  };

  const handleHeaderClick = (columnSort: SortKey) => {
    if (onSortChange) {
      onSortChange(columnSort);
    }
  };

  if (entries.length === 0) {
    return (
      <div
        style={{
          background: "var(--apple-card-bg)",
          border: "1px solid var(--apple-separator)",
          borderRadius: 16,
          padding: 48,
          textAlign: "center",
          color: "var(--apple-secondary-label)",
        }}
      >
        No games found in this view.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--apple-card-bg)",
        border: "1px solid var(--apple-separator)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr
              style={{
                background: "var(--apple-fill)",
                borderBottom: "1px solid var(--apple-separator)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 700,
                color: "var(--apple-secondary-label)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <th
                onClick={() => handleHeaderClick("title-asc")}
                style={{ padding: "14px var(--space-5)", cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: sortKey === "title-asc" ? "var(--apple-label)" : undefined }}>
                  Title <ArrowUpDown size={12} style={{ opacity: sortKey === "title-asc" ? 1 : 0.6 }} />
                </div>
              </th>
              <th style={{ padding: "14px var(--space-4)" }}>Status</th>
              <th
                onClick={() => handleHeaderClick("rating")}
                style={{ padding: "14px var(--space-4)", cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: sortKey === "rating" ? "var(--apple-label)" : undefined }}>
                  Rating <ArrowUpDown size={12} style={{ opacity: sortKey === "rating" ? 1 : 0.6 }} />
                </div>
              </th>
              <th style={{ padding: "14px var(--space-4)" }}>Platform</th>
              <th
                onClick={() => handleHeaderClick("time")}
                style={{ padding: "14px var(--space-4)", cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: sortKey === "time" ? "var(--apple-label)" : undefined }}>
                  Playtime <ArrowUpDown size={12} style={{ opacity: sortKey === "time" ? 1 : 0.6 }} />
                </div>
              </th>
              <th style={{ padding: "14px var(--space-4)" }}>Progress</th>
              <th style={{ padding: "14px var(--space-5)", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(({ game, log }) => {
              const imgUrl = game.coverUrl;
              const statusBadge = getStatusBadge(log?.status);
              const isHovered = hoveredId === game.igdbId;

              return (
                <tr
                  key={game.igdbId}
                  onClick={() => onOpenGame && onOpenGame(game.igdbId)}
                  onMouseEnter={() => setHoveredId(game.igdbId)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    borderBottom: "1px solid var(--apple-separator)",
                    background: isHovered ? "var(--apple-tertiary-bg)" : "transparent",
                    cursor: "pointer",
                    transition: "background 150ms ease",
                  }}
                >
                  {/* Title & Cover */}
                  <td style={{ padding: "var(--space-3) var(--space-5)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div
                        style={{
                          width: 36,
                          height: 48,
                          borderRadius: 6,
                          overflow: "hidden",
                          background: game.coverColor || "var(--apple-tertiary-bg)",
                          flexShrink: 0,
                        }}
                      >
                        {imgUrl && (
                          <img
                            src={imgUrl}
                            alt={game.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--apple-label)" }}>
                          {game.title}
                        </div>
                        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-secondary-label)", marginTop: 2 }}>
                          {game.releaseYear || "Unknown Year"} • {game.developer || game.genres?.[0] || "Game"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "var(--space-1) 10px",
                        borderRadius: 8,
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        color: statusBadge.color,
                        background: statusBadge.bg,
                      }}
                    >
                      {statusBadge.label}
                    </span>
                  </td>

                  {/* Rating */}
                  <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                    {log?.rating && log.rating > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--apple-yellow)", fontWeight: 700, fontSize: 14 }}>
                        <Star size={14} fill="var(--apple-yellow)" aria-hidden="true" />
                        {log.rating} / 5
                      </div>
                    ) : (
                      <span style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)"}}>—</span>
                    )}
                  </td>

                  {/* Platform */}
                  <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                    <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)" }}>
                      {log?.platform || log?.platforms?.[0] || game.platforms?.[0] || "—"}
                    </span>
                  </td>

                  {/* Playtime */}
                  <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                    {log?.timePlayed && log.timePlayed > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--apple-label)", fontSize: "var(--font-size-base)", fontWeight: 500 }}>
                        <Clock size={14} color="var(--apple-secondary-label)" />
                        {log.timePlayed}h
                      </div>
                    ) : (
                      <span style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)"}}>—</span>
                    )}
                  </td>

                  {/* Progress */}
                  <td style={{ padding: "var(--space-3) var(--space-4)", minWidth: 120 }}>
                    {log?.completionPercentage !== undefined && log.completionPercentage > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--apple-tertiary-bg)", overflow: "hidden" }}>
                          <div style={{ width: `${log.completionPercentage}%`, height: "100%", background: "var(--apple-accent)" }} />
                        </div>
                        <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--apple-label)", width: 36, textAlign: "right" }}>
                          {log.completionPercentage}%
                        </span>
                      </div>
                    ) : log?.completion ? (
                      <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)" }}>{log.completion}</span>
                    ) : (
                      <span style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)"}}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "var(--space-3) var(--space-5)", textAlign: "right" }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLog && onOpenLog(game.igdbId);
                      }}
                      aria-label={`Edit log for ${game.title}`}
                      style={{ background: isHovered ? "var(--apple-fill)" : "transparent" }}
                    >
                      <Edit3 size={14} /> Edit
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
