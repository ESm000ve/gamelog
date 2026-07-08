import { useState } from "react";
import { coverUrl, type RelatedGameSlim } from "../../types/gameDetail";

export function RelatedCard({ game, onClick }: { game: RelatedGameSlim; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const imgUrl = game.cover ? coverUrl(game.cover.image_id, "cover_big") : undefined;
  const year = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : undefined;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 8, cursor: "pointer" }}
      onClick={onClick}
    >
      <div
        style={{
          width:        "100%",
          aspectRatio:  "3/4",
          borderRadius: "var(--radius-xl)",
          border:       "1px solid var(--apple-separator)",
          overflow:     "hidden",
          background:   "var(--apple-tertiary-bg)",
          boxShadow:    hovered ? "0 8px 24px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.3)",
          transform:    hovered ? "translateY(-2px)" : "none",
          transition:   "box-shadow 150ms ease, transform 150ms ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {imgUrl ? (
          <img src={imgUrl} alt={game.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
            <span style={{ color: "var(--apple-label)", fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>{game.name}</span>
          </div>
        )}
      </div>
      <div>
        <p style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--apple-label)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
          {game.name}
        </p>
        {year && <p style={{ fontSize: 11, color: "var(--apple-tertiary-label)", marginTop: 2 }}>{year}</p>}
      </div>
    </div>
  );
}
