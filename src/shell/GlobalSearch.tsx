import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Plus, Check, Sparkles, X } from "lucide-react";
import { catalog, type CatalogGame } from "../catalog";
import { GamesRepo } from "../db/repositories";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/schema";
import { useLiveRegion } from "../hooks/useLiveRegion";
import { parseLog } from "../services/ai";
import type { Log } from "../types";

interface GlobalSearchProps {
  onGameAdded?: (igdbId: number, prefill?: Partial<Log>) => void;
}

export function GlobalSearch({ onGameAdded }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CatalogGame[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const [nlMode, setNlMode] = useState(false);
  const [quickLogLoading, setQuickLogLoading] = useState(false);
  const [prefill, setPrefill] = useState<Partial<Log>>({});

  const { announce } = useLiveRegion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("click", handleOutside);
    return () => window.removeEventListener("click", handleOutside);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Execute search
  useEffect(() => {
    let mounted = true;
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    
    if (nlMode) return; // handled by submit

    setLoading(true);
    catalog.search(debouncedQuery).then(
      (games) => {
        if (!mounted) return;
        setResults(games);
        setLoading(false);
        setIsOpen(true);
      },
      (err) => {
        if (!mounted) return;
        console.error("IGDB search failed:", err);
        setLoading(false);
      }
    );
    return () => { mounted = false; };
  }, [debouncedQuery, nlMode]);

  const handleNlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || quickLogLoading) return;
    
    setQuickLogLoading(true);
    try {
      const res = await parseLog(query);
      setPrefill(res.logFields as Partial<Log>);
      setQuery(res.title); // This will trigger normal search
      setNlMode(false);
      announce(`Parsed log for ${res.title}. Select a game to continue.`);
    } catch (err: any) {
      console.error(err);
      announce("Failed to parse log", "assertive");
    } finally {
      setQuickLogLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const libraryIds = useLiveQuery(() => db.games.toCollection().primaryKeys()) as number[] | undefined;
  const librarySet = new Set(libraryIds ?? []);

  // Expose global open event
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      inputRef.current?.focus();
    };
    window.addEventListener("open-global-search", handleOpen);
    return () => window.removeEventListener("open-global-search", handleOpen);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "absolute", top: 12, right: 32, zIndex: 1000, width: 260, WebkitAppRegion: "no-drag" }}>
      {nlMode ? (
        <form onSubmit={handleNlSubmit} style={{ position: "relative", display: "flex", width: "100%" }}>
          <Sparkles size={14} color="var(--apple-accent)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Quick log (e.g. log Hades, finished)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            style={{
              width: "100%",
              height: 28,
              padding: "0 30px",
              boxSizing: "border-box",
              borderRadius: "var(--radius-sm)",
              background: "var(--apple-fill)",
              border: "1px solid var(--apple-accent)",
              color: "var(--apple-label)",
              fontSize: "var(--font-size-base)",
              fontWeight: 500,
              outline: "none",
              boxShadow: "0 0 0 3px var(--apple-accent-subtle)",
              transition: "border-color 200ms ease, box-shadow 200ms ease",
              WebkitAppRegion: "no-drag",
            }}
          />
          {quickLogLoading && <Loader2 size={14} color="var(--apple-accent)" className="animate-spin" style={{ position: "absolute", right: 30, top: "50%", transform: "translateY(-50%)" }} />}
          <button type="button" onClick={() => { setNlMode(false); setQuery(""); }} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--apple-tertiary-label)", cursor: "pointer", display: "flex", padding: "var(--space-1)"}}>
            <X size={14} />
          </button>
        </form>
      ) : (
        <div style={{ position: "relative", width: "100%" }}>
          <Search size={13} color="var(--apple-tertiary-label)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a game…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen && e.target.value) setIsOpen(true);
            }}
            onFocus={() => { if (query) setIsOpen(true); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && debouncedQuery.trim()) {
                e.preventDefault();
                setIsOpen(false);
                navigate(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`);
              }
            }}
            style={{
              width: "100%",
              height: 28,
              padding: "0 30px",
              boxSizing: "border-box",
              borderRadius: "var(--radius-sm)",
              background: "var(--apple-fill)",
              border: "1px solid var(--apple-separator)",
              color: "var(--apple-label)",
              fontSize: "var(--font-size-base)",
              fontWeight: 500,
              outline: "none",
              transition: "border-color 200ms ease, box-shadow 200ms ease",
              WebkitAppRegion: "no-drag",
            }}
          />
          {query && (
            <button type="button" onClick={handleClear} style={{ position: "absolute", right: 30, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--apple-tertiary-label)", cursor: "pointer", display: "flex", padding: "var(--space-1)"}}>
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => { setNlMode(true); setIsOpen(true); inputRef.current?.focus(); }}
            title="Natural Language Log"
            style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "transparent", color: "var(--apple-tertiary-label)", border: "none", borderRadius: "var(--radius-sm)", padding: "var(--space-1)", cursor: "pointer", display: "flex" }}
          >
            <Sparkles size={14} />
          </button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (query || loading) && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "var(--space-2)",
          background: "var(--apple-window-bg)",
          border: "1px solid var(--apple-separator)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          maxHeight: 400,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
          {loading ? (
            <div style={{ padding: "var(--space-5)", textAlign: "center", color: "var(--apple-tertiary-label)" }}>
              <Loader2 size={20} className="animate-spin" style={{ margin: "0 auto" }} />
            </div>
          ) : results.length > 0 ? (
            results.map((game) => (
              <ResultRow
                key={game.igdbId}
                game={game}
                inLibrary={librarySet.has(game.igdbId)}
                onAdd={async () => {
                  try {
                    await GamesRepo.addFromCatalog(game, "Backlog");
                    onGameAdded?.(game.igdbId, Object.keys(prefill).length > 0 ? prefill : undefined);
                    setIsOpen(false);
                  } catch (e) {
                    console.error("Failed to add:", e);
                  }
                }}
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/game/${game.igdbId}`);
                }}
              />
            ))
          ) : (
            <div style={{ padding: "var(--space-5)", textAlign: "center", color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)"}}>
              No games found for "{debouncedQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({ game, inLibrary, onAdd, onClick }: { game: CatalogGame; inLibrary: boolean; onAdd: () => Promise<void>; onClick: () => void }) {
  const [adding, setAdding] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px",
        borderBottom: "1px solid var(--apple-separator)",
        background: hovered ? "var(--apple-tertiary-bg)" : "transparent",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <div style={{ width: 32, height: 44, borderRadius: "var(--radius-sm)", background: "var(--apple-tertiary-bg)", overflow: "hidden", flexShrink: 0 }}>
        {game.coverUrl && <img src={game.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: 600, color: "var(--apple-label)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {game.title}
        </h3>
        <p style={{ fontSize: 11, color: "var(--apple-secondary-label)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {game.releaseYear} • {game.developer}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setAdding(true); onAdd().finally(() => setAdding(false)); }}
        disabled={inLibrary || adding}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          padding: "var(--space-1) 10px", borderRadius: "var(--radius-md)",
          background: inLibrary ? "transparent" : "var(--apple-accent)",
          color: inLibrary ? "var(--apple-tertiary-label)" : "var(--apple-white)",
          fontSize: "var(--font-size-sm)", fontWeight: 600, border: "none", cursor: inLibrary ? "default" : "pointer",
        }}
      >
        {inLibrary ? <Check size={12} /> : <Plus size={12} />}
      </button>
    </div>
  );
}
