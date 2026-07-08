import { useState, useEffect } from "react";
import { Search, ChevronDown, BookOpen, Plus, Grid2x2, List, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CoverCard } from "../../components/CoverCard";
import { LibraryTableView } from "./LibraryTableView";
import { ShareListModal } from "../../components/ShareListModal";
import { useLibrary, useLibraryCounts, type SortKey } from "../../hooks/useLibrary";
import { useLiveRegion } from "../../hooks/useLiveRegion";
import { LogsRepo } from "../../db/repositories";
import { FilterBar, ActiveFilterBadges } from "../../components/FilterBar";
import type { FilterSpec } from "../../services/filterEngine";
import { fetchDealsForWishlist } from "../../services/priceTracker";
import { SpotlightBanner } from "../../components/SpotlightBanner";
import { Button } from "../../components/ui/Button";
import type { Status } from "../../types";

// ─── Sort options ──────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent",     label: "Recently added" },
  { value: "rating",     label: "Rating"         },
  { value: "title-asc",  label: "Title (A-Z)"    },
  { value: "title-desc", label: "Title (Z-A)"    },
  { value: "year-desc",  label: "Release year (newest first)" },
  { value: "year-asc",   label: "Release year (oldest first)" },
  { value: "time",       label: "Time played"    },
];


// ─── Screen ───────────────────────────────────────────────────────────────────

export function LibraryScreen({ onAddGame, onOpenLog, onOpenGame }: { onAddGame?: () => void; onOpenLog?: (igdbId: number) => void; onOpenGame?: (igdbId: number) => void }) {
  const [filterSpec, setFilterSpec] = useState<FilterSpec>({});
  const [sort,         setSort]         = useState<SortKey>("year-asc");
  const [sortOpen,     setSortOpen]     = useState(false);
  const [shareOpen,    setShareOpen]    = useState(false);
  const [search,       setSearch]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    return (localStorage.getItem("libraryViewMode") as any) || "grid";
  });

  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("libraryViewMode", mode);
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Close sort menu on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handle = () => setSortOpen(false);
    window.addEventListener("click", handle);
    return () => window.removeEventListener("click", handle);
  }, [sortOpen]);



  const navigate = useNavigate();
  const entries = useLibrary({ filters: filterSpec, sort, search: debouncedSearch });
  const counts  = useLibraryCounts();
  const { announce } = useLiveRegion();

  useEffect(() => {
    if (entries !== undefined) {
      announce(`Showing ${entries.length} games`);
    }
  }, [entries?.length, announce]);

  useEffect(() => {
    if (filterSpec.status && filterSpec.status.includes("Wishlist") && entries && entries.length > 0) {
      const games = entries.map(e => e.game);
      fetchDealsForWishlist(games);
    }
  }, [entries, filterSpec.status]);

  const totalCount = counts?.All ?? 0;
  const currentSort = SORT_OPTIONS.find((o) => o.value === sort)!;

  const handleStatusChange = async (igdbId: number, status: Status) => {
    await LogsRepo.updateStatus(igdbId, status);
  };

  const handleRate = async (igdbId: number, status: Status, rating: number) => {
    await LogsRepo.save(igdbId, { status, rating });
  };

  return (
    <main
      id="main-content"
      style={{
        flex:          1,
        display:       "flex",
        flexDirection: "column",
        overflow:      "hidden",
        minWidth:      0,
      }}
    >
      {/* ── Toolbar ── */}
      <div
        style={{
          flexShrink:           0,
          display:              "flex",
          alignItems:           "center",
          justifyContent:       "space-between",
          padding:              "var(--space-3) var(--space-8)",
          background:           "var(--apple-toolbar-bg)",
          backdropFilter:       "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom:         "1px solid var(--apple-separator)",
          WebkitAppRegion:      "drag",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <h1
            style={{
              fontFamily:    "var(--apple-font-display)",
              fontSize:      "var(--font-size-lg)",
              fontWeight:    600,
              color:         "var(--apple-label)",
              letterSpacing: "-0.015em",
              lineHeight:    1,
            }}
          >
            Library
          </h1>
          <span style={{ color: "var(--apple-secondary-label)", fontSize: "var(--font-size-base)"}}>
            {totalCount} {totalCount === 1 ? "game" : "games"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, WebkitAppRegion: "no-drag" }}>


        </div>
      </div>

      {/* ── Filter strip ── */}
      <div
        style={{
          flexShrink:   0,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "space-between",
          padding:      "var(--space-3) var(--space-8)",
          borderBottom: "1px solid var(--apple-separator)",
          position:     "relative",
          zIndex:       10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            overflowX: "auto",
            flex: 1,
            marginRight: "var(--space-3)",
          }}
        >
          <div style={{ position: "relative" }}>
            <Search
              size={13}
              color="var(--apple-tertiary-label)"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
            <input
              type="text"
              placeholder="Filter library"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Filter library"
              style={{
                paddingLeft: 30,
                paddingRight: 10,
                paddingTop: 6,
                paddingBottom: 6,
                borderRadius: "var(--radius-sm)",
                background: "var(--apple-fill)",
                border: "1px solid var(--apple-separator)",
                color: "var(--apple-label)",
                fontSize: "var(--font-size-base)",
                width: 180,
                fontWeight: 500,
                outline: "none",
              }}
            />
          </div>
          <ActiveFilterBadges spec={filterSpec} onChange={setFilterSpec} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* Share button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            title="Share & Export Library"
            style={{ padding: "6px var(--space-3)", fontSize: "var(--font-size-base)", fontWeight: 500 }}
          >
            <Share2 size={14} color="var(--apple-accent)" />
            Share
          </Button>

          {/* View mode toggle */}
          <div style={{ display: "flex", background: "var(--apple-fill)", borderRadius: "var(--radius-md)", border: "1px solid var(--apple-separator)", padding: 2, gap: 2 }}>
            <button
              type="button"
              onClick={() => handleViewModeChange("grid")}
              aria-label="Grid view"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 26,
                borderRadius: 6,
                background: viewMode === "grid" ? "var(--apple-accent)" : "transparent",
                color: viewMode === "grid" ? "var(--apple-white)" : "var(--apple-secondary-label)",
                border: "none",
                cursor: "pointer",
                transition: "all 120ms ease",
              }}
            >
              <Grid2x2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("table")}
              aria-label="Table view"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 26,
                borderRadius: 6,
                background: viewMode === "table" ? "var(--apple-accent)" : "transparent",
                color: viewMode === "table" ? "var(--apple-white)" : "var(--apple-secondary-label)",
                border: "none",
                cursor: "pointer",
                transition: "all 120ms ease",
              }}
            >
              <List size={15} />
            </button>
          </div>

          {/* Sort dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setSortOpen((v) => !v); }}
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          6,
                padding:      "6px var(--space-3)",
                borderRadius: "var(--radius-md)",
                border:       "1px solid var(--apple-separator)",
                background:   sortOpen ? "var(--apple-accent)" : "var(--apple-fill)",
                color:        sortOpen ? "white" : "var(--apple-label)",
                fontSize:     "var(--font-size-base)",
                fontWeight:   500,
                transition:   "background 120ms ease",
                cursor:       "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--apple-secondary-fill)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--apple-fill)")}
            >
              Sort: {currentSort.label}
              <ChevronDown size={13} color="var(--apple-tertiary-label)" aria-hidden="true" />
            </button>

            {sortOpen && (
              <>
                {/* Click-away trap */}
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  onClick={() => setSortOpen(false)}
                />
                <div
                  role="listbox"
                  aria-label="Sort by"
                  style={{
                    position:     "absolute",
                    right:        0,
                    top:          "calc(100% + 4px)",
                    zIndex:       100,
                    background:   "var(--apple-tertiary-bg)",
                    border:       "1px solid var(--apple-separator)",
                    borderRadius: "var(--radius-xl)",
                    minWidth:     176,
                    padding:      "var(--space-1) 0",
                    boxShadow:    "0 8px 32px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.05)",
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      role="option"
                      aria-selected={opt.value === sort}
                      onClick={() => { setSort(opt.value); setSortOpen(false); }}
                      style={{
                        display:    "block",
                        width:      "100%",
                        padding:    "7px 14px",
                        minHeight:  44,
                        fontSize:   "var(--font-size-base)",
                        fontWeight: opt.value === sort ? 500 : 400,
                        color:      opt.value === sort ? "var(--apple-accent)" : "var(--apple-label)",
                        background: "transparent",
                        border:     "none",
                        transition: "background 80ms ease",
                        textAlign:  "left",
                        cursor:     "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--apple-fill)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <FilterBar spec={filterSpec} onChange={setFilterSpec} />
        </div>
      </div>


      {/* ── Cover grid ── */}
      <div
        style={{
          flex:      1,
          overflowY: "auto",
          padding:   "var(--space-5) 0 var(--space-8)",
        }}
      >
        <SpotlightBanner />

        <div style={{ padding: "0 var(--space-8)" }}>
          {/* Loading */}
          {entries === undefined && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
              <span style={{ color: "var(--apple-secondary-label)", fontSize: "var(--font-size-base)"}}>Loading…</span>
            </div>
          )}

          {/* Empty state */}
          {entries !== undefined && entries.length === 0 && (
            <EmptyState
              hasSearch={!!search.trim() || Object.keys(filterSpec).length > 0}
              hasFilter={filterSpec.status !== undefined && filterSpec.status.length > 0}
              filter={filterSpec.status?.[0] || "All"}
              search={search}
              onAddGame={onAddGame}
            />
          )}

          {/* Grid or Table View */}
          {entries !== undefined && entries.length > 0 && (
            viewMode === "table" ? (
              <LibraryTableView
                entries={entries}
                onOpenGame={onOpenGame ? (id) => onOpenGame(id) : (id) => navigate(`/game/${id}`)}
                onOpenLog={onOpenLog}
                sortKey={sort}
                onSortChange={setSort}
              />
            ) : (
              <div
                style={{
                  display:             "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap:                 "24px 16px",
                }}
              >
                {entries.map(({ game, log }) => (
                  <CoverCard
                    key={game.igdbId}
                    game={{
                      ...game,
                      status:               log.status,
                      rating:               log.rating,
                      platform:             log.platform || game.platforms?.[0],
                      completionPercentage: log.completionPercentage,
                    }}
                    onClick={(id) => onOpenGame ? onOpenGame(id) : navigate(`/game/${id}`)}
                    onChangeStatus={handleStatusChange}
                    onRate={(id, r) => handleRate(id, log.status, r)}
                    onLog={onOpenLog ? () => onOpenLog(game.igdbId) : undefined}
                  />
                ))}
              </div>
            )
          )}
        </div>

        {/* Share Modal */}
        <ShareListModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          title="My Game Library"
          entries={entries || []}
        />
      </div>
    </main>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  hasSearch,
  hasFilter,
  filter,
  search,
  onAddGame,
}: {
  hasSearch:  boolean;
  hasFilter:  boolean;
  filter:     Status | "All";
  search:     string;
  onAddGame?: () => void;
}) {
  const title = hasSearch
    ? `No results for "${search}"`
    : hasFilter
    ? `Nothing in ${filter} yet`
    : "Your library is empty";

  const sub = hasSearch
    ? "Try a different title or clear your search."
    : "Start tracking your games by adding one.";

  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            12,
        minHeight:      300,
      }}
    >
      <div
        style={{
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          width:           48,
          height:          48,
          borderRadius:    "var(--radius-xl)",
          background:      "var(--apple-fill)",
        }}
      >
        {hasSearch || hasFilter ? (
          <Search size={20} color="var(--apple-tertiary-label)" />
        ) : (
          <BookOpen size={20} color="var(--apple-tertiary-label)" />
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <p style={{ color: "var(--apple-label)", fontSize: "var(--font-size-base)", fontWeight: 500 }}>{title}</p>
        <p style={{ color: "var(--apple-secondary-label)", fontSize: "var(--font-size-sm)"}}>{sub}</p>
      </div>
      {!hasSearch && !hasFilter && onAddGame && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAddGame}
          style={{ padding: "7px var(--space-4)", borderRadius: "var(--radius-lg)", fontSize: "var(--font-size-base)", fontWeight: 500 }}
        >
          <Plus size={13} />
          Add game
        </Button>
      )}
    </div>
  );
}
