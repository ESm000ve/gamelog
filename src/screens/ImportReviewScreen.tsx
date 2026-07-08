import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";
import { steamImportSource } from "../services/steamImport";
import type { MatchedImportGame } from "../services/importSource";
import { GamesRepo } from "../db/repositories/GamesRepo";
import type { Status, Game, Log } from "../types";
import { Button } from "../components/ui/Button";

export function ImportReviewScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Initializing...");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  
  const [matches, setMatches] = useState<MatchedImportGame[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [defaultStatus, setDefaultStatus] = useState<Status>("Backlog");
  const [overwritePlaytime, setOverwritePlaytime] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const steamId = localStorage.getItem("steamId");
    if (!steamId) {
      setError("No Steam ID found. Please set it in Settings.");
      setLoading(false);
      return;
    }

    async function doFetch() {
      try {
        setLoading(true);
        setStatusMsg("Fetching Steam library...");
        setProgress(5);
        const imported = await steamImportSource.fetchLibrary(steamId!);
        
        setStatusMsg("Matching games with IGDB catalog...");
        setProgress(10);
        const matched = await steamImportSource.matchGames(imported, (pct, msg) => {
          setProgress(pct);
          setStatusMsg(msg);
        });
        
        setMatches(matched);
        
        // Auto-select high confidence matches
        const initialSelected = new Set<string>();
        matched.forEach(m => {
          if (m.confidence === "high" && m.igdbGame) {
            initialSelected.add(m.imported.sourceId);
          }
        });
        setSelectedIds(initialSelected);

      } catch (err: any) {
        setError(err.message || "Failed to fetch and match games");
      } finally {
        setLoading(false);
      }
    }
    doFetch();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const gamesToImport: Game[] = [];
      const logsToImport: Log[] = [];
      const now = Date.now();

      for (const match of matches) {
        if (!selectedIds.has(match.imported.sourceId) || !match.igdbGame) continue;

        gamesToImport.push({
          ...match.igdbGame,
          addedAt: now,
          updatedAt: now,
        });

        logsToImport.push({
          igdbId: match.igdbGame.igdbId,
          status: defaultStatus,
          timePlayed: match.imported.timePlayedHours,
          createdAt: now,
          updatedAt: now,
        });
      }

      await GamesRepo.bulkImport(gamesToImport, logsToImport, overwritePlaytime);
      navigate("/"); // Return to library
    } catch (err: any) {
      setError(err.message || "Failed to import games");
      setImporting(false);
    }
  };

  if (loading || importing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", padding: "var(--space-10)"}}>
        <Loader2 size={40} className="spinner" color="var(--apple-accent)" style={{ marginBottom: "var(--space-5)"}} />
        <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 600, marginBottom: 10 }}>{importing ? "Importing to Library..." : "Analyzing Steam Library..."}</h2>
        <p style={{ color: "var(--apple-secondary-label)", marginBottom: "var(--space-5)"}}>{importing ? "Saving games to local database" : statusMsg}</p>
        
        {!importing && (
          <div style={{ width: 300, height: 6, background: "var(--apple-separator)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--apple-accent)", width: `${progress}%`, transition: "width 0.2s" }} />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "var(--space-10)", width: "100%" }}>
        <div style={{ background: "rgba(255,50,50,0.1)", color: "var(--apple-red)", padding: "var(--space-5)", borderRadius: "var(--radius-lg)" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, marginBottom: 10 }}>
            <AlertCircle /> Error
          </h2>
          <p>{error}</p>
          <Button variant="danger" onClick={() => navigate("/settings")} style={{ marginTop: "var(--space-5)"}}>
            Return to Settings
          </Button>
        </div>
      </div>
    );
  }

  const highConf = matches.filter(m => m.confidence === "high");
  const lowConf = matches.filter(m => m.confidence !== "high");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* Header */}
      <header style={{ padding: "30px var(--space-10)", borderBottom: "1px solid var(--apple-separator)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--apple-font-display)", marginBottom: "var(--space-2)"}}>Review Steam Import</h1>
          <p style={{ color: "var(--apple-secondary-label)" }}>Found {matches.length} games. {highConf.length} exact matches, {lowConf.length} need review.</p>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={overwritePlaytime} onChange={e => setOverwritePlaytime(e.target.checked)} />
            Overwrite existing playtimes
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <span>Default Status:</span>
            <select 
              value={defaultStatus} 
              onChange={e => setDefaultStatus(e.target.value as Status)}
              style={{ padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--apple-separator)", background: "var(--apple-fill)", color: "var(--apple-label)" }}
            >
              <option value="Backlog">Backlog</option>
              <option value="Playing">Playing</option>
              <option value="Played">Played</option>
              <option value="Wishlist">Wishlist</option>
            </select>
          </div>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={selectedIds.size === 0}
          >
            Import {selectedIds.size} Games
          </Button>
        </div>
      </header>

      {/* List */}
      <div style={{ flex: 1, overflow: "auto", padding: "var(--space-5) var(--space-10)" }}>
        {lowConf.length > 0 && (
          <div style={{ marginBottom: "var(--space-10)"}}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: "var(--space-4)", color: "var(--apple-orange)", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={18} /> Needs Review ({lowConf.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {lowConf.map(m => <MatchRow key={m.imported.sourceId} match={m} selected={selectedIds.has(m.imported.sourceId)} onToggle={() => toggleSelect(m.imported.sourceId)} />)}
            </div>
          </div>
        )}

        {highConf.length > 0 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: "var(--space-4)", color: "var(--apple-green)", display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={18} /> Exact Matches ({highConf.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {highConf.map(m => <MatchRow key={m.imported.sourceId} match={m} selected={selectedIds.has(m.imported.sourceId)} onToggle={() => toggleSelect(m.imported.sourceId)} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchRow({ match, selected, onToggle }: { match: MatchedImportGame; selected: boolean; onToggle: () => void }) {
  const g = match.igdbGame;
  const time = match.imported.timePlayedHours;
  
  return (
    <div
      onClick={g ? onToggle : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "var(--space-4)",
        background: "var(--apple-fill)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--apple-separator)",
        cursor: g ? "pointer" : "default",
        opacity: selected ? 1 : 0.7,
        transition: "opacity 0.2s"
      }}
    >
      <input type="checkbox" checked={selected} readOnly disabled={!g} style={{ width: 18, height: 18, cursor: g ? "pointer" : "default" }} />
      
      {g ? (
        <>
          <div style={{ width: 40, height: 56, borderRadius: "var(--radius-sm)", background: g.coverUrl ? `url(${g.coverUrl}) center/cover` : "var(--apple-separator)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: "var(--space-1)"}}>{g.title}</div>
            <div style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)" }}>Steam: {match.imported.sourceName}</div>
          </div>
        </>
      ) : (
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: "var(--space-1)"}}>{match.imported.sourceName}</div>
          <div style={{ fontSize: "var(--font-size-base)", color: "var(--apple-red)" }}>No IGDB match found</div>
        </div>
      )}
      
      {time !== undefined && time > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--apple-secondary-label)", fontSize: 14 }}>
          <Clock size={16} />
          {time}h played
        </div>
      )}
    </div>
  );
}
