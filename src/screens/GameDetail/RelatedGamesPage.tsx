import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useGameDetail } from "../../hooks/useGameDetail";
import { RelatedCard } from "./RelatedGamesGrid";

type RelatedTabKey = "related" | "dlcs" | "expansions" | "ports" | "series" | "mods" | "bundles";

const TAB_LABELS: Record<RelatedTabKey, string> = {
  related:    "Related",
  dlcs:       "DLC",
  expansions: "Expansions",
  ports:      "Ports",
  series:     "Series",
  mods:       "Mods",
  bundles:    "In bundles",
};

interface RelatedGamesPageProps {
  onOpenGame: (igdbId: number) => void;
}

export function RelatedGamesPage({ onOpenGame }: RelatedGamesPageProps) {
  const { igdbId: igdbIdStr } = useParams<{ igdbId: string }>();
  const navigate              = useNavigate();
  const [searchParams]        = useSearchParams();

  const igdbId    = igdbIdStr ? parseInt(igdbIdStr, 10) : null;
  const initialTab = (searchParams.get("tab") ?? "related") as RelatedTabKey;

  const { detail, loading } = useGameDetail(igdbId);

  const allTabs: RelatedTabKey[] = ["related", "dlcs", "expansions", "ports", "series", "mods", "bundles"];
  const activeTabs = detail
    ? allTabs.filter((k) => (detail.related[k]?.length ?? 0) > 0)
    : [];

  const [activeTab, setActiveTab] = useState<RelatedTabKey>(
    activeTabs.includes(initialTab) ? initialTab : (activeTabs[0] ?? "related")
  );

  const currentTab = activeTabs.includes(activeTab) ? activeTab : (activeTabs[0] ?? "related");
  const games = detail?.related[currentTab] ?? [];

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      {/* Toolbar */}
      <div
        style={{
          flexShrink:           0,
          display:              "flex",
          alignItems:           "center",
          gap:                  8,
          padding:              "var(--space-3) var(--space-5)",
          background:           "var(--apple-toolbar-bg)",
          backdropFilter:       "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom:         "1px solid var(--apple-separator)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back to game"
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        4,
            padding:    "var(--space-1) var(--space-2)",
            borderRadius:"var(--radius-md)",
            background: "transparent",
            color:      "var(--apple-accent)",
            fontSize:   14,
            fontWeight: 500,
            textAlign:  "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--apple-fill)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <ChevronLeft size={16} /> {detail?.title ?? "Back"}
        </button>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h1
            style={{
              fontFamily:    "var(--apple-font-display)",
              fontSize:      14,
              fontWeight:    600,
              color:         "var(--apple-label)",
              letterSpacing: "-0.015em",
              lineHeight:    1,
            }}
          >
            Related games
          </h1>
          {detail && (
            <span style={{ fontSize: 11, color: "var(--apple-tertiary-label)", marginTop: 2 }}>
              {detail.title}
            </span>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      {activeTabs.length > 0 && (
        <div style={{ flexShrink: 0, display: "flex", gap: 0, borderBottom: "1px solid var(--apple-separator)", padding: "0 var(--space-6)" }}>
          {activeTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding:      "var(--space-2) 14px",
                fontSize:     "var(--font-size-base)",
                fontWeight:   currentTab === tab ? 600 : 400,
                color:        currentTab === tab ? "var(--apple-accent)" : "var(--apple-secondary-label)",
                borderBottom: currentTab === tab ? "2px solid var(--apple-accent)" : "2px solid transparent",
                background:   "transparent",
                transition:   "color 120ms ease",
                textAlign:    "center",
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-5) var(--space-8) var(--space-8)" }}>
        {loading && (
          <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)"}}>Loading…</p>
        )}
        {!loading && games.length === 0 && (
          <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)"}}>No games in this category.</p>
        )}
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap:                 "20px 14px",
          }}
        >
          {games.map((g) => (
            <RelatedCard key={g.id} game={g} onClick={() => onOpenGame(g.id)} />
          ))}
        </div>
      </div>
    </main>
  );
}
