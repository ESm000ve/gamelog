import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Plus, Check, AlertCircle, Sparkles } from "lucide-react";
import { catalog, type CatalogGame } from "../../catalog";
import { GamesRepo } from "../../db/repositories";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/schema";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useLiveRegion } from "../../hooks/useLiveRegion";
import { parseLog } from "../../services/ai";
import type { Log } from "../../types";
import { Button } from "../../components/ui/Button";

interface AddGameModalProps {
  onClose: () => void;
  /** Called after a game is added, with its igdbId so the caller can open the Log Editor */
  onGameAdded?: (igdbId: number, prefill?: Partial<Log>) => void;
}

export function AddGameModal({ onClose, onGameAdded }: AddGameModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CatalogGame[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [quickLogQuery, setQuickLogQuery] = useState("");
  const [quickLogLoading, setQuickLogLoading] = useState(false);
  const [prefill, setPrefill] = useState<Partial<Log>>({});

  const { announce } = useLiveRegion();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);

  // Focus input on mount
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
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
    
    setLoading(true);
    setError(null);
    catalog.search(debouncedQuery).then(
      (games) => {
        if (!mounted) return;
        setResults(games);
        setLoading(false);
        announce(`Found ${games.length} games matching ${debouncedQuery}`);
      },
      (err) => {
        if (!mounted) return;
        console.error("IGDB search failed:", err);
        setError("Failed to search IGDB. Please try again.");
        setLoading(false);
        announce("Search failed", "assertive");
      }
    );
    return () => { mounted = false; };
  }, [debouncedQuery]);

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogQuery.trim() || quickLogLoading) return;
    
    setQuickLogLoading(true);
    setError(null);
    try {
      const res = await parseLog(quickLogQuery);
      setPrefill(res.logFields as Partial<Log>);
      setQuery(res.title);
      announce(`Parsed log for ${res.title}. Select a game to continue.`);
    } catch (err: any) {
      console.error(err);
      setError("Failed to parse log sentence. Please search normally.");
      announce("Failed to parse log", "assertive");
    } finally {
      setQuickLogLoading(false);
    }
  };

  // Read existing library to disable "Add" for games already in library
  const libraryIds = useLiveQuery(() => db.games.toCollection().primaryKeys()) as number[] | undefined;
  const librarySet = new Set(libraryIds ?? []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-game-title"
      ref={dialogRef}
      style={{
        position:             "fixed",
        inset:                0,
        zIndex:               50,
        display:              "flex",
        alignItems:           "flex-start",
        justifyContent:       "center",
        paddingTop:           "10vh",
        background:           "rgba(0,0,0,0.55)",
        backdropFilter:       "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        style={{
          width:         600,
          maxWidth:      "calc(100vw - 32px)",
          maxHeight:     "80vh",
          background:    "var(--apple-secondary-bg)",
          border:        "1px solid var(--apple-separator)",
          borderRadius:  "var(--radius-2xl)",
          boxShadow:     "0 32px 80px rgba(0,0,0,0.6)",
          display:       "flex",
          flexDirection: "column",
          overflow:      "hidden",
        }}
      >
        {/* Quick Log Form */}
        <form onSubmit={handleQuickLog} style={{
          display: "flex",
          alignItems: "center",
          padding: "var(--space-4) var(--space-5)",
          borderBottom: "1px solid var(--apple-separator)",
          background: "var(--apple-control-bg)",
          gap: 12
        }}>
          <Sparkles size={18} color="var(--apple-accent)" aria-hidden="true" />
          <input
            type="text"
            placeholder='Quick log (e.g. "log Hades, Switch, 4.5 stars, finished Sunday")'
            value={quickLogQuery}
            onChange={(e) => setQuickLogQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "var(--apple-label)",
              fontSize: 14,
              outline: "none",
            }}
          />
          {quickLogLoading && <Loader2 size={16} color="var(--apple-accent)" className="animate-spin" />}
          <button type="submit" style={{ display: "none" }} />
        </form>

        {/* Search Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: "var(--space-4) var(--space-5)",
          borderBottom: "1px solid var(--apple-separator)",
          gap: 12
        }}>
          <h2 id="add-game-title" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Add Game</h2>
          <Search size={18} color="var(--apple-tertiary-label)" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            aria-label="Search games to add"
            placeholder="Search game title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "var(--apple-label)",
              fontSize: "var(--font-size-lg)",
              outline: "none",
            }}
          />
          {loading && <Loader2 size={16} color="var(--apple-tertiary-label)" className="animate-spin" />}
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>

        {/* Results Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-3)", minHeight: 200 }}>
          {error && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-xl)", background: "var(--apple-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertCircle size={20} color="var(--apple-red)" aria-hidden="true" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <p style={{ color: "var(--apple-label)", fontSize: "var(--font-size-base)", fontWeight: 500 }}>Search failed</p>
                <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-sm)"}}>{error}</p>
              </div>
            </div>
          )}
          
          {!loading && !error && debouncedQuery && results.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-xl)", background: "var(--apple-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Search size={20} color="var(--apple-tertiary-label)" aria-hidden="true" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <p style={{ color: "var(--apple-label)", fontSize: "var(--font-size-base)", fontWeight: 500 }}>No games found</p>
                <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-sm)"}}>We couldn't find anything matching "{debouncedQuery}".</p>
              </div>
            </div>
          )}

          {!debouncedQuery && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-xl)", background: "var(--apple-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Search size={20} color="var(--apple-tertiary-label)" aria-hidden="true" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <p style={{ color: "var(--apple-label)", fontSize: "var(--font-size-base)", fontWeight: 500 }}>Find a game</p>
                <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-sm)"}}>Search the IGDB database to add a game.</p>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map((game) => (
              <ResultRow 
                key={game.igdbId} 
                game={game} 
                inLibrary={librarySet.has(game.igdbId)} 
                onAdd={async () => {
                  await GamesRepo.addFromCatalog(game, "Backlog");
                  if (onGameAdded) {
                    onGameAdded(game.igdbId, prefill);
                  } else {
                    onClose();
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ game, inLibrary, onAdd }: { game: CatalogGame; inLibrary: boolean; onAdd: () => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const { announce } = useLiveRegion();

  const handleAdd = async () => {
    if (inLibrary || adding) return;
    setAdding(true);
    await onAdd();
    setAdding(false);
    announce(`Added ${game.title} to library`);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "var(--space-3)",
        borderRadius: "var(--radius-lg)",
        background: "var(--apple-fill)",
        gap: 16,
      }}
    >
      {/* Cover thumb */}
      <div style={{
        width: 48,
        height: 64,
        borderRadius: "var(--radius-sm)",
        background: "var(--apple-tertiary-bg)",
        overflow: "hidden",
        flexShrink: 0
      }}>
        {game.coverUrl && (
          <img 
            src={game.coverUrl} 
            alt={game.title} 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <h3 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--apple-label)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          {game.title}
        </h3>
        <p style={{
          fontSize: "var(--font-size-base)",
          color: "var(--apple-secondary-label)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          {game.releaseYear ? `${game.releaseYear} • ` : ""}{game.developer}
        </p>
      </div>

      <Button
        variant={inLibrary ? "ghost" : "primary"}
        size="sm"
        onClick={handleAdd}
        disabled={inLibrary || adding}
        aria-label={inLibrary ? `Already added ${game.title}` : `Add ${game.title}`}
        style={{ opacity: adding ? 0.7 : 1, color: inLibrary ? "var(--apple-tertiary-label)" : undefined }}
      >
        {inLibrary ? (
          <>
            <Check size={14} aria-hidden="true" /> Added
          </>
        ) : (
          <>
            <Plus size={14} aria-hidden="true" /> {adding ? "Adding..." : "Add"}
          </>
        )}
      </Button>
    </div>
  );
}
