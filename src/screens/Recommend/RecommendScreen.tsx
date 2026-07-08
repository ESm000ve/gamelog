import { useState, useEffect } from "react";
import { RefreshCw, Play, Loader2 } from "lucide-react";
import { getRecommendations, type RecommenderCandidate } from "../../services/recommender";
import { coverUrl } from "../../types/gameDetail";
import { db } from "../../db/schema";
import { useNavigate, useLocation } from "react-router-dom";
import { RouletteModal } from "./RouletteModal";
import { Button } from "../../components/ui/Button";

export function RecommendScreen() {
  const [intent, setIntent] = useState("");
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<RecommenderCandidate[]>([]);
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchPicks = async (currentIntent: string, currentExcluded: number[]) => {
    setLoading(true);
    try {
      const results = await getRecommendations(currentIntent, currentExcluded);
      setPicks(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPicks("", []);
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).openRoulette) {
      setRouletteOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const handleOpenRoulette = () => setRouletteOpen(true);
    window.addEventListener("gamelog:open-roulette", handleOpenRoulette);
    return () => window.removeEventListener("gamelog:open-roulette", handleOpenRoulette);
  }, []);

  const handleReroll = () => {
    const newExcluded = [...excludedIds, ...picks.map(p => p.game.igdbId)];
    setExcludedIds(newExcluded);
    fetchPicks(intent, newExcluded);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setExcludedIds([]);
    fetchPicks(intent, []);
  };

  const handleStartPlaying = async (e: React.MouseEvent, igdbId: number) => {
    e.stopPropagation();
    const log = await db.logs.get(igdbId);
    if (log) {
      log.status = "Playing";
      log.updatedAt = Date.now();
      await db.logs.put(log);
      navigate(`/game/${igdbId}`);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-10)"}}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        
        <header style={{ marginBottom: "var(--space-8)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--apple-label)", letterSpacing: "-0.015em", marginBottom: "var(--space-4)"}}>
              What to Play
            </h1>

            <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, maxWidth: 500 }}>
            <input
              type="text"
              placeholder='e.g. "something short" or "a relaxing RPG"'
              value={intent}
              onChange={e => setIntent(e.target.value)}
              style={{
                flex: 1,
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--apple-separator)",
                background: "var(--apple-fill)",
                color: "var(--apple-label)",
                fontSize: "var(--font-size-base)",
                outline: "none",
              }}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
              style={{ borderRadius: "var(--radius-lg)", fontWeight: 500 }}
            >
              Get picks
            </Button>
          </form>
          </div>

          <Button
            variant="primary"
            onClick={() => setRouletteOpen(true)}
            style={{
              background: "var(--apple-blue)",
              color: "white",
              fontSize: 14,
              borderRadius: "var(--radius-full)",
              boxShadow: "0 4px 12px rgba(10,132,255,0.25)",
              padding: "10px var(--space-5)",
            }}
          >
            <RefreshCw size={16} /> Spin Backlog Roulette
          </Button>
        </header>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 size={32} className="animate-spin" color="var(--apple-secondary-label)" />
          </div>
        ) : picks.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--apple-secondary-label)" }}>
            No unplayed games left in your library that match!
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)"}}>
              <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 600, margin: 0, color: "var(--apple-label)" }}>Top Picks</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReroll}
                style={{ color: "var(--apple-accent)", fontWeight: 500, fontSize: 14 }}
              >
                <RefreshCw size={14} /> Show me others
              </Button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 24 }}>
              {picks.map((pick) => (
                <div
                  key={pick.game.igdbId}
                  onClick={() => navigate(`/game/${pick.game.igdbId}`)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--apple-fill)",
                    borderRadius: 16,
                    overflow: "hidden",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; }}
                >
                  <div style={{ aspectRatio: "3/4", background: pick.game.coverColor || "var(--apple-separator)", position: "relative" }}>
                    {pick.game.coverUrl && (
                      <img src={coverUrl(pick.game.coverUrl.split('/').pop()?.split('.')[0] || '')} alt={pick.game.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", flex: 1 }}>
                    <h3 style={{ margin: "0 0 var(--space-2) 0", fontSize: 15, fontWeight: 600, color: "var(--apple-label)" }}>{pick.game.title}</h3>
                    
                    {pick.reason && (
                      <p style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--font-size-base)", lineHeight: 1.4, color: "var(--apple-secondary-label)", flex: 1 }}>
                        "{pick.reason}"
                      </p>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => handleStartPlaying(e, pick.game.igdbId)}
                      style={{
                        width: "100%",
                        border: "1px solid var(--apple-separator)",
                        borderRadius: 8,
                        fontWeight: 500,
                        fontSize: "var(--font-size-base)",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--apple-separator)"}
                      onMouseLeave={e => e.currentTarget.style.background = "var(--apple-fill)"}
                    >
                      <Play size={14} /> Start playing
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {rouletteOpen && (
        <RouletteModal 
          onClose={() => setRouletteOpen(false)} 
          onStartPlaying={async (id) => {
            setRouletteOpen(false);
            const log = await db.logs.get(id);
            if (log) {
              log.status = "Playing";
              log.updatedAt = Date.now();
              await db.logs.put(log);
              navigate(`/game/${id}`);
            }
          }} 
        />
      )}
    </div>
  );
}
