import { useState } from "react";
import { coverUrl, type RelatedGameSlim } from "../../types/gameDetail";

interface RelatedStripProps {
  games:       RelatedGameSlim[];
  onGameClick: (igdbId: number) => void;
}

export function RelatedStrip({ games, onGameClick }: RelatedStripProps) {
  return (
    <div
      style={{
        display:        "flex",
        gap:            12,
        overflowX:      "auto",
        paddingBottom:  "var(--space-2)",
        // hide scrollbar
        scrollbarWidth: "none",
      }}
    >
      {games.map((g) => (
        <RelatedCard key={g.id} game={g} onClick={() => onGameClick(g.id)} />
      ))}
    </div>
  );
}

function RelatedCard({ game, onClick }: { game: RelatedGameSlim; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const imgUrl = game.cover ? coverUrl(game.cover.image_id, "cover_small") : undefined;
  const year = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : undefined;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, width: 90, cursor: "pointer" }}
      onClick={onClick}
    >
      <div
        style={{
          width:        90,
          aspectRatio:  "3/4",
          borderRadius: "var(--radius-lg)",
          border:       "1px solid var(--apple-separator)",
          background:   "var(--apple-tertiary-bg)",
          overflow:     "hidden",
          boxShadow:    hovered ? "0 6px 18px rgba(0,0,0,0.45)" : "0 2px 6px rgba(0,0,0,0.3)",
          transform:    hovered ? "translateY(-2px)" : "none",
          transition:   "box-shadow 150ms ease, transform 150ms ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {imgUrl ? (
          <img src={imgUrl} alt={game.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-2)"}}>
            <span style={{ color: "var(--apple-label)", fontSize: "var(--font-size-xs)", fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>{game.name}</span>
          </div>
        )}
      </div>
      <div>
        <p style={{
          fontSize:     11,
          fontWeight:   500,
          color:        "var(--apple-label)",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          lineHeight:   1.3,
        }}>
          {game.name}
        </p>
        {year && (
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--apple-tertiary-label)", marginTop: 1 }}>{year}</p>
        )}
      </div>
    </div>
  );
}
