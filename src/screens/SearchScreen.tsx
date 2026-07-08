import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Loader2, ChevronLeft } from "lucide-react";
import { catalog, type CatalogGame } from "../catalog";
import { CoverCard } from "../components/CoverCard";
import { db } from "../db/schema";
import { useLiveQuery } from "dexie-react-hooks";
import { GamesRepo, LogsRepo } from "../db/repositories";
import { useLiveRegion } from "../hooks/useLiveRegion";
import type { Status } from "../types";
import { Button } from "../components/ui/Button";

export function SearchScreen({ onOpenGame, onOpenLog }: { onOpenGame?: (id: number) => void; onOpenLog?: (id: number) => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  
  const [query, setQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  
  const [results, setResults] = useState<CatalogGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkStatus, setBulkStatus] = useState<Status>("Backlog");

  const navigate = useNavigate();
  const { announce } = useLiveRegion();
  const limit = 50;
  
  const libraryMap = useLiveQuery(async () => {
    const logs = await db.logs.toArray();
    return new Map(logs.map(l => [l.igdbId, l.status]));
  }) ?? new Map<number, Status>();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery });
    } else {
      setSearchParams({});
    }
    setOffset(0);
    setResults([]);
    setHasMore(true);
  }, [debouncedQuery, setSearchParams]);

  useEffect(() => {
    let mounted = true;
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    
    async function fetchResults() {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      
      try {
        const games = await catalog.searchAll(debouncedQuery, limit, offset);
        if (!mounted) return;
        
        setResults(prev => offset === 0 ? games : [...prev, ...games]);
        setHasMore(games.length >= limit);
        if (offset === 0) announce(`Found ${games.length} games matching ${debouncedQuery}`);
      } catch (err) {
        if (!mounted) return;
        console.error(err);
        setError("Failed to fetch results.");
        announce("Failed to search", "assertive");
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }
    fetchResults();
    return () => { mounted = false; };
  }, [debouncedQuery, offset]);

  // Infinite scroll logic using IntersectionObserver on a sentinel element
  const observerTarget = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && debouncedQuery) {
          setOffset(prev => prev + limit);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, debouncedQuery]);

  const handleStatusChange = async (game: CatalogGame, status: Status) => {
    if (!libraryMap.has(game.igdbId)) {
      await GamesRepo.addFromCatalog(game, status);
    } else {
      await LogsRepo.updateStatus(game.igdbId, status);
    }
  };

  const handleRate = async (game: CatalogGame, rating: number) => {
    if (!libraryMap.has(game.igdbId)) {
      await GamesRepo.addFromCatalog(game, "Played");
      await LogsRepo.save(game.igdbId, { status: "Played", rating });
    } else {
      const status = libraryMap.get(game.igdbId)!;
      await LogsRepo.save(game.igdbId, { status, rating });
    }
  };
  
  const handleLog = async (game: CatalogGame) => {
    if (!libraryMap.has(game.igdbId)) {
      await GamesRepo.addFromCatalog(game, "Backlog");
    }
    onOpenLog?.(game.igdbId);
  };

  const handleToggleSelect = (game: CatalogGame, e: React.MouseEvent) => {
    if (libraryMap.has(game.igdbId)) return;
    const index = results.findIndex(r => r.igdbId === game.igdbId);
    if (index === -1) return;

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (e.shiftKey && lastSelectedIndex !== null) {
        const start = Math.min(index, lastSelectedIndex);
        const end = Math.max(index, lastSelectedIndex);
        for (let i = start; i <= end; i++) {
          const g = results[i];
          if (!libraryMap.has(g.igdbId)) {
            next.add(g.igdbId);
          }
        }
      } else {
        if (next.has(game.igdbId)) {
          next.delete(game.igdbId);
        } else {
          next.add(game.igdbId);
        }
      }
      return next;
    });
    setLastSelectedIndex(index);
  };

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        minWidth: 0,
      }}
    >
      {/* ── Toolbar ── */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "var(--space-3) var(--space-8)",
          background: "var(--apple-toolbar-bg)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: "1px solid var(--apple-separator)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--apple-tertiary-label)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "var(--space-1)"}}
          aria-label="Back to Library"
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <h1
            style={{
              fontFamily: "var(--apple-font-display)",
              fontSize: "var(--font-size-lg)",
              fontWeight: 600,
              color: "var(--apple-label)",
              letterSpacing: "-0.015em",
              lineHeight: 1,
            }}
          >
            Search Results
          </h1>
        </div>

        <div style={{ flex: 1 }} />
        
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {selectMode && (
            <button
              onClick={() => {
                const selectableIds = results.filter(g => !libraryMap.has(g.igdbId)).map(g => g.igdbId);
                if (selectedIds.size === selectableIds.length && selectableIds.length > 0) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(selectableIds));
                }
              }}
              style={{
                background: "transparent",
                color: "var(--apple-accent)",
                border: "none",
                padding: "var(--space-1) var(--space-2)",
                fontSize: "var(--font-size-base)",
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              {selectedIds.size > 0 && selectedIds.size === results.filter(g => !libraryMap.has(g.igdbId)).length
                ? "Clear selection" 
                : "Select all loaded"}
            </button>
          )}
          
          <button
            onClick={() => {
              if (selectMode) {
                setSelectMode(false);
                setSelectedIds(new Set());
                setLastSelectedIndex(null);
              } else {
                setSelectMode(true);
              }
            }}
            style={{
              background: selectMode ? "var(--apple-accent)" : "var(--apple-fill)",
              color: selectMode ? "white" : "var(--apple-label)",
              border: "1px solid var(--apple-separator)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-1) var(--space-3)",
              fontSize: "var(--font-size-base)",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 120ms ease"
            }}
          >
            {selectMode ? "Cancel" : "Select"}
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <Search
            size={13}
            color="var(--apple-tertiary-label)"
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search game title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
              width: 300,
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-5) var(--space-8) var(--space-8)" }}>
        {loading && offset === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
            <Loader2 size={24} color="var(--apple-tertiary-label)" className="animate-spin" />
          </div>
        ) : error ? (
          <div style={{ display: "flex", justifyContent: "center", minHeight: 300, color: "var(--apple-red)" }}>
            {error}
          </div>
        ) : results.length === 0 && debouncedQuery ? (
          <div style={{ display: "flex", justifyContent: "center", minHeight: 300, color: "var(--apple-tertiary-label)" }}>
            No results found for "{debouncedQuery}"
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "24px 16px",
            }}
          >
            {results.map((game) => {
              const status = libraryMap.get(game.igdbId);
              return (
                <CoverCard
                  key={game.igdbId}
                  game={{
                    igdbId: game.igdbId,
                    title: game.title,
                    status: status,
                    coverUrl: game.coverUrl,
                    platform: game.platforms?.[0],
                    releaseYear: game.releaseYear,
                  }}
                  onClick={(_id) => onOpenGame?.(_id)}
                  onChangeStatus={(_id, s) => handleStatusChange(game, s)}
                  onRate={(_id, r) => handleRate(game, r)}
                  onLog={(_id) => handleLog(game)}
                  selectable={selectMode && !status}
                  selected={selectedIds.has(game.igdbId)}
                  onToggleSelect={(_id, e) => handleToggleSelect(game, e)}
                />
              );
            })}
          </div>
        )}
        
        {/* Infinite Scroll Sentinel */}
        {hasMore && !loading && debouncedQuery && results.length > 0 && (
          <div ref={observerTarget} style={{ height: 40, display: "flex", justifyContent: "center", alignItems: "center", marginTop: "var(--space-5)"}}>
            {loadingMore && <Loader2 size={18} color="var(--apple-tertiary-label)" className="animate-spin" /> || <span>Scroll for more</span>}
          </div>
        )}
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectMode && selectedIds.size > 0 && (
        <div style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--apple-tertiary-bg)",
          border: "1px solid var(--apple-separator)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-3) var(--space-5)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          zIndex: 50
        }}>
          <span style={{ fontSize: "var(--font-size-base)", fontWeight: 500, color: "var(--apple-label)" }}>
            {selectedIds.size} selected
          </span>
          <div style={{ width: 1, height: 24, background: "var(--apple-separator)" }} />
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as Status)}
            style={{
              padding: "6px var(--space-3)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--apple-separator)",
              background: "var(--apple-fill)",
              color: "var(--apple-label)",
              fontSize: "var(--font-size-base)",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="Wishlist">Wishlist</option>
            <option value="Backlog">Backlog</option>
            <option value="Playing">Playing</option>
            <option value="Played">Played</option>
          </select>
          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              const gamesToImport = results.filter(g => selectedIds.has(g.igdbId)).map(g => ({
                ...g,
                addedAt: Date.now(),
                updatedAt: Date.now()
              }));
              const logsToImport = gamesToImport.map(g => ({
                igdbId: g.igdbId,
                status: bulkStatus,
                createdAt: Date.now(),
                updatedAt: Date.now()
              }));
              await GamesRepo.bulkImport(gamesToImport as any, logsToImport as any, false);

              announce(`Added ${selectedIds.size} games to ${bulkStatus}`);
              setSelectMode(false);
              setSelectedIds(new Set());
              setLastSelectedIndex(null);
            }}
          >
            Add {selectedIds.size} games
          </Button>
        </div>
      )}
    </main>
  );
}
