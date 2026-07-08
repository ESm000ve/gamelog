import { useState, useMemo } from "react";
import { Upload, Users, AlertCircle } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/schema";
import type { BackupData } from "../../services/backup";
import { CoverCard } from "../../components/CoverCard";
import { catalog } from "../../catalog";
import type { Game } from "../../types";

interface FriendsScreenProps {
  onOpenGame?: (igdbId: number) => void;
}

export function FriendsScreen({ onOpenGame }: FriendsScreenProps = {}) {
  const [friendData, setFriendData] = useState<BackupData | null>(null);
  const [friendGames, setFriendGames] = useState<Record<number, Game>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overlap" | "unique" | "hottakes">("overlap");

  const myGames = useLiveQuery(() => db.games.toArray()) ?? [];
  const myLogs = useLiveQuery(() => db.logs.toArray()) ?? [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;
      if (!data.games || !data.logs) throw new Error("Invalid export format");
      
      setFriendData(data);
      
      const myIgdbIds = new Set(myGames.map(g => g.igdbId));
      const fetched: Record<number, Game> = {};
      
      for (const fGame of data.games) {
        if (myIgdbIds.has(fGame.igdbId)) {
          fetched[fGame.igdbId] = myGames.find(g => g.igdbId === fGame.igdbId)!;
        } else {
          const catalogGame = await catalog.fetch(fGame.igdbId);
          if (catalogGame) {
            fetched[fGame.igdbId] = {
              ...catalogGame,
              addedAt: fGame.addedAt,
              updatedAt: fGame.updatedAt
            };
          }
        }
      }
      setFriendGames(fetched);
    } catch (err: any) {
      setError(err.message || "Failed to load friend's library");
    } finally {
      setLoading(false);
    }
  };

  const { overlap, unique, hotTakes } = useMemo(() => {
    if (!friendData) return { overlap: [], unique: [], hotTakes: [] };
    
    const myLogMap = new Map(myLogs.map(l => [l.igdbId, l]));
    const friendLogMap = new Map(friendData.logs.map(l => [l.igdbId, l]));
    
    const overlapIds = [];
    const uniqueIds = [];
    const takes = [];
    
    for (const fGame of friendData.games) {
      if (myLogMap.has(fGame.igdbId)) {
        overlapIds.push(fGame.igdbId);
        
        const myLog = myLogMap.get(fGame.igdbId);
        const fLog = friendLogMap.get(fGame.igdbId);
        if (myLog?.rating !== undefined && fLog?.rating !== undefined) {
          const diff = myLog.rating - fLog.rating;
          if (Math.abs(diff) > 0) {
            takes.push({ igdbId: fGame.igdbId, myRating: myLog.rating, fRating: fLog.rating, diff });
          }
        }
      } else {
        uniqueIds.push(fGame.igdbId);
      }
    }
    
    takes.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    
    return { overlap: overlapIds, unique: uniqueIds, hotTakes: takes };
  }, [friendData, myLogs]);

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          flexShrink: 0,
          padding: "var(--space-4) var(--space-8)",
          background: "var(--apple-toolbar-bg)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: "1px solid var(--apple-separator)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <h1 style={{ fontFamily: "var(--apple-font-display)", fontSize: 24, fontWeight: 700, color: "var(--apple-label)", letterSpacing: "-0.015em" }}>
          Friends
        </h1>
        <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)", marginTop: "var(--space-1)"}}>
          Upload a friend's library JSON export to see what you have in common.
        </p>
      </div>

      <div style={{ padding: "var(--space-8)", flex: 1, display: "flex", flexDirection: "column" }}>
        {!friendData ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ maxWidth: 400, width: "100%", padding: "var(--space-8)", border: "2px dashed var(--apple-separator)", borderRadius: "var(--radius-2xl)", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--apple-secondary-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-4)" }}>
                <Users size={24} color="var(--apple-tertiary-label)" />
              </div>
              <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--apple-label)", marginBottom: "var(--space-2)"}}>Import Friend's Library</h2>
              <p style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)", marginBottom: "var(--space-6)"}}>Select a .json export file generated from their Settings page.</p>
              
              <label style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px var(--space-5)",
                background: "var(--apple-accent)",
                color: "var(--apple-accent-foreground)",
                borderRadius: "var(--radius-md)",
                fontWeight: 600,
                fontSize: "var(--font-size-base)",
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}>
                <Upload size={16} />
                {loading ? "Loading..." : "Choose File"}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  disabled={loading}
                />
              </label>

              {error && (
                <div style={{ marginTop: "var(--space-4)", color: "var(--apple-red)", fontSize: "var(--font-size-base)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--apple-separator)", paddingBottom: "var(--space-4)"}}>
              <TabButton active={activeTab === "overlap"} onClick={() => setActiveTab("overlap")} label={`Overlap (${overlap.length})`} />
              <TabButton active={activeTab === "unique"} onClick={() => setActiveTab("unique")} label={`Friend's Unique Games (${unique.length})`} />
              <TabButton active={activeTab === "hottakes"} onClick={() => setActiveTab("hottakes")} label={`Hot Takes (${hotTakes.length})`} />
            </div>

            {activeTab === "overlap" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
                {overlap.map(id => {
                  const game = friendGames[id];
                  if (!game) return null;
                  const log = myLogs.find(l => l.igdbId === id);
                  return (
                    <CoverCard
                      key={id}
                      game={{ ...game, status: log?.status, rating: log?.rating, completionPercentage: log?.completionPercentage }}
                      onClick={() => onOpenGame?.(id)}
                    />
                  );
                })}
              </div>
            )}

            {activeTab === "unique" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
                {unique.map(id => {
                  const game = friendGames[id];
                  if (!game) return null;
                  const fLog = friendData!.logs.find(l => l.igdbId === id);
                  return (
                    <CoverCard
                      key={id}
                      game={{ ...game, status: fLog?.status, rating: fLog?.rating, completionPercentage: fLog?.completionPercentage }}
                      onClick={() => onOpenGame?.(id)}
                    />
                  );
                })}
              </div>
            )}

            {activeTab === "hottakes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {hotTakes.length === 0 ? (
                  <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)"}}>No major rating disagreements found!</p>
                ) : (
                  hotTakes.map(({ igdbId, myRating, fRating, diff }) => {
                    const game = friendGames[igdbId];
                    return (
                      <div key={igdbId} style={{ display: "flex", alignItems: "center", gap: 16, padding: "var(--space-4)", background: "var(--apple-secondary-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--apple-separator)" }}>
                        <div style={{ width: 48, height: 64, borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--apple-tertiary-bg)", flexShrink: 0 }}>
                          {game?.coverUrl && <img src={game.coverUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--apple-label)", marginBottom: "var(--space-1)"}}>{game?.title}</h3>
                          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                            <div>
                              <span style={{ fontSize: 11, color: "var(--apple-tertiary-label)", textTransform: "uppercase", letterSpacing: 0.5 }}>You</span>
                              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--apple-label)" }}>{myRating} ★</div>
                            </div>
                            <div>
                              <span style={{ fontSize: 11, color: "var(--apple-tertiary-label)", textTransform: "uppercase", letterSpacing: 0.5 }}>Friend</span>
                              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--apple-label)" }}>{fRating} ★</div>
                            </div>
                            <div style={{ paddingLeft: "var(--space-6)", borderLeft: "1px solid var(--apple-separator)", color: diff > 0 ? "var(--apple-green)" : "var(--apple-red)" }}>
                              <span style={{ fontSize: "var(--font-size-base)", fontWeight: 600 }}>{diff > 0 ? "You liked it more" : "They liked it more"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "var(--space-2) var(--space-4)",
        borderRadius: "var(--radius-md)",
        background: active ? "var(--apple-label)" : "transparent",
        color: active ? "var(--apple-bg)" : "var(--apple-secondary-label)",
        fontSize: "var(--font-size-base)",
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}
