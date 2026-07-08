import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Clock, Flag, Trophy, Edit3, Plus, ChevronRight, AlertCircle, ExternalLink } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/schema";
import { Button } from "../../components/ui/Button";
import { GamesRepo } from "../../db/repositories/GamesRepo";
import { LogsRepo } from "../../db/repositories";
import { useGameDetail } from "../../hooks/useGameDetail";
import { StarRating } from "../../components/StarRating";
import { STATUS_COLORS, STATUS_SUBTLE } from "../../components/StatusChip";
import { RelatedStrip } from "./RelatedStrip";
import { Skeleton } from "../../components/Skeleton";
import { useSimilarLibraryGames } from "../../hooks/useSimilarLibraryGames";
import { TagsRepo } from "../../db/repositories/TagsRepo";
import type { Game, Log, Tag as TagType } from "../../types";
import type { CatalogGame } from "../../catalog/types";

// ─── Tab config ───────────────────────────────────────────────────────────────

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

// ─── Screen ───────────────────────────────────────────────────────────────────

interface GameDetailScreenProps {
  onOpenLog:        (igdbId: number) => void;
  onOpenGame:       (igdbId: number) => void;
  onOpenAddToList?: (igdbId: number, title: string) => void;
}

export function GameDetailScreen({ onOpenLog, onOpenGame, onOpenAddToList }: GameDetailScreenProps) {
  const { igdbId: igdbIdStr } = useParams<{ igdbId: string }>();
  const navigate              = useNavigate();
  const igdbId                = igdbIdStr ? parseInt(igdbIdStr, 10) : null;

  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const { detail, loading, error, retry } = useGameDetail(igdbId);
  const similarLibraryGames = useSimilarLibraryGames(detail);

  // Live library state for THIS game
  const libraryEntry = useLiveQuery(async () => {
    if (!igdbId) return null;
    const [game, log] = await Promise.all([db.games.get(igdbId), db.logs.get(igdbId)]);
    if (!game || !log) return null;
    return { game, log } as { game: Game; log: Log };
  }, [igdbId]);

  // ── Back nav ────────────────────────────────────────────────────────────────
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  // ── Add to library (not-in-library CTA) ────────────────────────────────────
  const handleAddAndLog = async () => {
    if (!detail || !igdbId) return;
    const catalogGame: CatalogGame = {
      igdbId:      detail.igdbId,
      title:       detail.title,
      slug:        detail.slug,
      developer:   detail.developer ?? "Unknown",
      publisher:   detail.publisher,
      releaseYear: detail.releaseYear,
      firstReleaseDate: detail.firstReleaseDate,
      summary:     detail.summary,
      genres:      detail.genres,
      platforms:   detail.platforms,
      coverUrl:    detail.coverUrl,
      timeToBeat:  detail.timeToBeat ?? undefined,
      igdbRating:  detail.igdbRating?.score,
    };
    await GamesRepo.addFromCatalog(catalogGame, "Backlog");
    onOpenLog(igdbId);
  };

  // ── Quick Log Session ───────────────────────────────────────────────────────
  const handleQuickLogSession = async () => {
    if (!igdbId) return;
    await LogsRepo.logSession(igdbId);
  };

  // ── Related tabs — only show tabs with entries ──────────────────────────────
  const allTabs: RelatedTabKey[] = ["related", "dlcs", "expansions", "ports", "series", "mods", "bundles"];
  const activeTabs = detail
    ? allTabs.filter((k) => (detail.related[k]?.length ?? 0) > 0)
    : [];
  const [activeRelTab, setActiveRelTab] = useState<RelatedTabKey | null>(null);
  const currentRelTab = activeRelTab ?? activeTabs[0] ?? null;

  // ── Tags ────────────────────────────────────────────────────────────────────
  const [allTags, setAllTags] = useState<TagType[]>([]);
  useEffect(() => {
    TagsRepo.getAll().then(setAllTags);
  }, [libraryEntry?.log?.tagIds]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <ScreenShell onBack={goBack} title="">
        <div style={{ flex: 1, overflowY: "auto", padding: "28px var(--space-8) 48px" }}>
          {/* Skeleton Hero */}
          <div style={{ display: "flex", gap: 28, alignItems: "flex-start", marginBottom: 36 }}>
            <Skeleton width={160} height={213} borderRadius="var(--radius-xl)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              <Skeleton width="60%" height={32} borderRadius="var(--radius-sm)" />
              <div style={{ display: "flex", gap: 12 }}>
                <Skeleton width={80} height={20} borderRadius="var(--radius-sm)" />
                <Skeleton width={80} height={20} borderRadius="var(--radius-sm)" />
                <Skeleton width={80} height={20} borderRadius="var(--radius-sm)" />
              </div>
              <Skeleton width="100%" height={80} borderRadius="var(--radius-sm)" />
            </div>
          </div>
          {/* Skeleton Body */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
             <Skeleton width="100%" height={120} borderRadius="var(--radius-xl)" />
             <Skeleton width="100%" height={120} borderRadius="var(--radius-xl)" />
          </div>
        </div>
      </ScreenShell>
    );
  }

  if (error || !detail) {
    return (
      <ScreenShell onBack={goBack} title="">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <AlertCircle size={24} color="var(--apple-red)" />
          <p style={{ color: "var(--apple-secondary-label)", fontSize: "var(--font-size-base)"}}>{error ?? "Game not found."}</p>
          <Button variant="secondary" onClick={retry} style={{ marginTop: "var(--space-2)"}}>
            Retry
          </Button>
        </div>
      </ScreenShell>
    );
  }

  const inLibrary = !!libraryEntry;
  const log = libraryEntry?.log;

  return (
    <ScreenShell onBack={goBack} title={detail.title}>
      <div style={{ flex: 1, overflowY: "auto", padding: "28px var(--space-8) 48px" }}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 28, alignItems: "flex-start", marginBottom: 36 }}>
          {/* Left: cover + Add to list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            <div
              style={{
                width:        160,
                aspectRatio:  "3/4",
                borderRadius: "var(--radius-xl)",
                overflow:     "hidden",
                background:   "var(--apple-tertiary-bg)",
                boxShadow:    "0 8px 32px rgba(0,0,0,0.45)",
              }}
            >
              {detail.coverUrl ? (
                <img src={detail.coverUrl} alt={detail.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-3)"}}>
                  <span style={{ color: "var(--apple-label)", fontSize: "var(--font-size-base)", fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>{detail.title}</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenAddToList
                ? onOpenAddToList(detail.igdbId, detail.title)
                : alert("List picker coming in Step 6")
              }
              style={{
                width: "100%",
                color: "var(--apple-secondary-label)",
              }}
            >
              <Plus size={13} /> Add to list
            </Button>
          </div>

          {/* Right: metadata */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: "var(--space-1)"}}>
            <h1
              style={{
                fontFamily:    "var(--apple-font-display)",
                fontSize:      26,
                fontWeight:    700,
                color:         "var(--apple-label)",
                letterSpacing: "-0.03em",
                lineHeight:    1.15,
                marginBottom:  6,
              }}
            >
              {detail.title}
            </h1>
            <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)", marginBottom: 14 }}>
              {detail.companies.find(c => c.roles.includes("Developer"))?.name || "Unknown Developer"}{detail.releaseYear ? ` · ${detail.releaseYear}` : ""}
            </p>

            {/* Ratings */}
            {(detail.igdbRating.score || detail.criticRating.score) && (
              <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                {detail.igdbRating.score && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--apple-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "var(--font-size-sm)", fontWeight: 700 }}>
                      {detail.igdbRating.score}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--apple-label)", lineHeight: 1 }}>User Score</span>
                      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--apple-tertiary-label)", marginTop: 2 }}>{detail.igdbRating.count ?? 0} ratings</span>
                    </div>
                  </div>
                )}
                {detail.criticRating.score && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--apple-orange)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "var(--font-size-sm)", fontWeight: 700 }}>
                      {detail.criticRating.score}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--apple-label)", lineHeight: 1 }}>Critic Score</span>
                      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--apple-tertiary-label)", marginTop: 2 }}>{detail.criticRating.count ?? 0} reviews</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "var(--space-4)", alignItems: "center" }}>
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-secondary-label)", fontWeight: 500, marginRight: 2 }}>Genres</span>
              {detail.genres.map((g) => (
                <Tag key={g} label={g} filled={false} />
              ))}
              {log?.tagIds?.map((tid) => {
                const t = allTags.find(x => x.id === tid);
                if (!t) return null;
                return <Tag key={t.id} label={t.name} filled={false} />;
              })}
            </div>

            {/* Summary */}
            {detail.summary && (
              <div style={{ marginBottom: "var(--space-3)"}}>
                <ExpandableText text={detail.summary} />
              </div>
            )}
            
            {/* Storyline */}
            {detail.storyline && (
              <div style={{ marginBottom: "var(--space-4)"}}>
                <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--apple-secondary-label)", marginBottom: "var(--space-1)"}}>Storyline</h3>
                <ExpandableText text={detail.storyline} />
              </div>
            )}
          </div>
        </div>

        {/* ── Time to Beat ─────────────────────────────────────────────────── */}
        {detail.timeToBeat && (detail.timeToBeat.average || detail.timeToBeat.finish || detail.timeToBeat.master) && (
          <Section title="Time to Beat">
            <div style={{ display: "flex", gap: 24, padding: "10px 0", borderTop: "0.5px solid var(--apple-separator)", borderBottom: "0.5px solid var(--apple-separator)" }}>
              {detail.timeToBeat.average !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={14} color="var(--apple-tertiary-label)" />
                  <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-label)", fontWeight: 600 }}>{detail.timeToBeat.average}h</span>
                  <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)" }}>Average</span>
                </div>
              )}
              {detail.timeToBeat.finish !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Flag size={14} color="var(--apple-tertiary-label)" />
                  <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-label)", fontWeight: 600 }}>{detail.timeToBeat.finish}h</span>
                  <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)" }}>To finish</span>
                </div>
              )}
              {detail.timeToBeat.master !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Trophy size={14} color="var(--apple-tertiary-label)" />
                  <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-label)", fontWeight: 600 }}>{detail.timeToBeat.master}h</span>
                  <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)" }}>To master</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Log card / CTA ───────────────────────────────────────────────── */}
        {inLibrary && log ? (
          <Section title="Your Log">
            <div
              style={{
                background:   "var(--apple-fill)",
                border:       "1px solid var(--apple-separator)",
                borderRadius: "var(--radius-2xl)",
                padding:      "var(--space-4) var(--space-5)",
                display:      "flex",
                flexDirection:"column",
                gap:          14,
              }}
            >
              {/* Status + completion */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <StatusBadge status={log.status} />
                {log.completion && (
                  <span style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-tertiary-label)" }}>· {log.completion}</span>
                )}
              </div>

              {/* Rating */}
              {log.rating !== undefined && (
                <StarRating rating={log.rating} size={14} showValue />
              )}

              {/* Meta strip */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
                {log.platforms && log.platforms.length > 0 ? (
                  <MetaItem label={log.platforms.length > 1 ? "Platforms" : "Platform"} value={log.platforms.join(", ")} />
                ) : log.platform ? (
                  <MetaItem label="Platform" value={log.platform} />
                ) : null}
                {log.timePlayed !== undefined && <MetaItem label="Time played" value={`${log.timePlayed}h`} />}
                {log.startedAt    && <MetaItem label="Started"      value={log.startedAt} />}
                {log.finishedAt   && <MetaItem label="Finished"     value={log.finishedAt} />}
              </div>

              {/* Notes */}
              {log.notes && (
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-secondary-label)", lineHeight: 1.6, borderTop: "1px solid var(--apple-separator)", paddingTop: 10 }}>
                  {log.notes}
                </p>
              )}

              {/* Edit log & Quick Session */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                {(log.status === "Playing" || log.status === "Played") && (
                  <Button
                    variant="outline"
                    onClick={handleQuickLogSession}
                  >
                    <Plus size={13} /> Quick log session
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={() => onOpenLog(igdbId!)}
                >
                  <Edit3 size={13} /> Edit log
                </Button>
              </div>
            </div>
          </Section>
        ) : (
          <Section title="Log this game">
            <div
              style={{
                background:     "var(--apple-fill)",
                border:         "1px solid var(--apple-separator)",
                borderRadius:   "var(--radius-2xl)",
                padding:        "var(--space-6) var(--space-5)",
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                gap:            12,
              }}
            >
              <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)", textAlign: "center" }}>
                This game isn't in your library yet.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddAndLog}
              >
                <Plus size={14} /> Add to library & log
              </Button>
            </div>
          </Section>
        )}

        {/* ── Details ─────────────────────────────────────────────────── */}
        {(detail.companies.length > 0 || detail.gameModes.length > 0 || detail.formattedMultiplayer?.length > 0 || detail.playerPersp.length > 0 || detail.ageRatings.length > 0 || detail.franchise || detail.engines.length > 0) && (
          <Section title="Details">
            <div>
              {(() => {
                const groupedRoles = detail.companies.reduce((acc, c) => {
                  c.roles.forEach(role => {
                    if (!acc[role]) acc[role] = [];
                    acc[role].push(c.name);
                  });
                  return acc;
                }, {} as Record<string, string[]>);
                return Object.entries(groupedRoles).map(([role, companies]) => (
                  <DetailRow key={role} label={role} value={companies.join(", ")} />
                ));
              })()}
              {detail.engines.length > 0 && <DetailRow label="Engine" value={detail.engines.join(", ")} />}
              {detail.gameModes.length > 0 && <DetailRow label="Game modes"  value={detail.gameModes.join(", ")} />}
              {detail.formattedMultiplayer?.length > 0 && <DetailRow label="Multiplayer" value={detail.formattedMultiplayer.join("; ")} />}
              {detail.playerPersp.length > 0 && <DetailRow label="Perspective" value={detail.playerPersp.join(", ")} />}
              {detail.ageRatings.length > 0 && <DetailRow label="Age rating" value={detail.ageRatings.join(" · ")} />}
              {detail.ageDescriptors.length > 0 && <DetailRow label="Content" value={detail.ageDescriptors.join(", ")} />}
              {detail.altNames.length > 0 && <DetailRow label="Alt names" value={detail.altNames.map(a => a.name).join(", ")} />}
              {detail.franchise && (
                <DetailRow
                  label="Franchise"
                  value={detail.franchise}
                  onValueClick={() => navigate(`/game/${igdbId}/related?tab=series`)}
                />
              )}
            </div>
          </Section>
        )}

        {/* ── Media ─────────────────────────────────────────────────────────── */}
        {(detail.screenshots.length > 0 || detail.artworks.length > 0 || detail.videos.length > 0) && (
          <Section title="Media">
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: "var(--space-4)", scrollSnapType: "x mandatory", margin: "0 -32px", paddingLeft: "var(--space-8)", paddingRight: "var(--space-8)"}}>
              {detail.videos.map(v => (
                <div key={v.videoId} style={{ flexShrink: 0, width: 320, height: 180, scrollSnapAlign: "start", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "black", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                  <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${v.videoId}`} title={v.name} frameBorder="0" allowFullScreen loading="lazy" />
                </div>
              ))}
              {detail.screenshots.map(s => (
                <div key={s.url} onClick={() => setLightboxImg(s.url)} style={{ flexShrink: 0, width: 320, height: 180, scrollSnapAlign: "start", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--apple-tertiary-bg)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", cursor: "pointer" }}>
                  <img src={s.url} alt="Screenshot" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                </div>
              ))}
              {detail.artworks.map(a => (
                <div key={a.url} onClick={() => setLightboxImg(a.url)} style={{ flexShrink: 0, width: 320, height: 180, scrollSnapAlign: "start", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--apple-tertiary-bg)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", cursor: "pointer" }}>
                  <img src={a.url} alt="Artwork" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Platforms & Languages ─────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32, marginBottom: 28 }}>
          {detail.releaseDates.length > 0 && (
            <Section title="Releases">
              <div>
                {(() => {
                  const groupedReleases = detail.releaseDates.reduce((acc, rd) => {
                    const key = rd.platform + (rd.region ? ` (${rd.region})` : "");
                    if (!acc.some(x => x.key === key)) acc.push({ key, date: rd.date });
                    return acc;
                  }, [] as { key: string; date: string }[]);
                  return groupedReleases.slice(0, 15).map((rd, i) => (
                    <DetailRow key={i} label={rd.key} value={rd.date} />
                  ));
                })()}
              </div>
            </Section>
          )}

          {detail.languages && detail.languages.length > 0 && (
            <Section title="Language Support">
              <div>
                {detail.languages.slice(0, 20).map((ls, i) => (
                  <DetailRow key={i} label={ls.language} value={ls.types.join(", ")} />
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── Links ─────────────────────────────────────────────────── */}
        {detail.websites.length > 0 && (
          <Section title="Links">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {detail.websites
                .filter(w => !["Facebook", "Twitter", "Instagram", "Twitch", "Reddit", "Discord", "External Link"].includes(w.categoryName))
                .map(w => (
                <a key={w.url} href={w.url} target="_blank" rel="noreferrer" style={{ padding: "6px var(--space-3)", borderRadius: "var(--radius-full)", background: "var(--apple-fill)", color: "var(--apple-label)", fontSize: "var(--font-size-base)", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: 6, transition: "background 150ms ease" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--apple-secondary-fill)")} onMouseLeave={(e) => (e.currentTarget.style.background = "var(--apple-fill)")}>
                  <ExternalLink size={13} color="var(--apple-tertiary-label)" />
                  {w.categoryName}
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* ── Related games ─────────────────────────────────────────────────── */}
        {activeTabs.length > 0 && currentRelTab && (
          <Section title="Related">
            {/* Tab switcher */}
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--apple-separator)", marginBottom: "var(--space-4)"}}>
              {activeTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveRelTab(tab)}
                  style={{
                    padding:        "6px 14px",
                    fontSize:       "var(--font-size-base)",
                    fontWeight:     currentRelTab === tab ? 600 : 400,
                    color:          currentRelTab === tab ? "var(--apple-accent)" : "var(--apple-secondary-label)",
                    borderBottom:   currentRelTab === tab ? "2px solid var(--apple-accent)" : "2px solid transparent",
                    background:     "transparent",
                    minHeight:      44,
                    transition:     "color 120ms ease",
                    textAlign:      "center",
                  }}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            {/* Horizontal strip + View all */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)"}}>
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-tertiary-label)" }}>
                {detail.related[currentRelTab]?.length ?? 0} {detail.related[currentRelTab]?.length === 1 ? "game" : "games"}
              </span>
              <button
                onClick={() => navigate(`/game/${igdbId}/related?tab=${currentRelTab}`)}
                style={{
                  display:    "flex",
                  alignItems: "center",
                  gap:        4,
                  fontSize:   "var(--font-size-sm)",
                  color:      "var(--apple-accent)",
                  textAlign:  "center",
                }}
              >
                View all <ChevronRight size={13} />
              </button>
            </div>

            <RelatedStrip
              games={detail.related[currentRelTab] ?? []}
              onGameClick={(id) => onOpenGame(id)}
            />
          </Section>
        )}

        {/* ── Games like this from your library (Semantic) ────────────────── */}
        {similarLibraryGames.length > 0 && (
          <Section title="Games like this from your library">
            <RelatedStrip
              games={similarLibraryGames}
              onGameClick={(id) => onOpenGame(id)}
            />
          </Section>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-10)",
            cursor: "pointer"
          }}
        >
          <img src={lightboxImg} alt="Larger view" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "var(--radius-lg)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
        </div>
      )}
    </ScreenShell>
  );
}

// ─── Screen shell with toolbar ────────────────────────────────────────────────

function ScreenShell({ children, onBack, title }: { children: React.ReactNode; onBack: () => void; title: string }) {
  return (
    <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
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
          onClick={onBack}
          aria-label="Back"
          style={{
            display:        "flex",
            alignItems:     "center",
            gap:            4,
            padding:        "var(--space-1) var(--space-2)",
            minHeight:      44,
            borderRadius:   "var(--radius-md)",
            background:     "transparent",
            color:          "var(--apple-accent)",
            fontSize:       14,
            fontWeight:     500,
            textAlign:      "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--apple-fill)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <ChevronLeft size={16} /> Back
        </button>

        {title && (
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
            {title}
          </h1>
        )}
      </div>
      {children}
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontSize:      "var(--font-size-base)",
          fontWeight:    500,
          color:         "var(--apple-secondary-label)",
          marginBottom:  10,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Tag({ label, filled }: { label: string; filled: boolean }) {
  return (
    <span
      style={{
        padding:      "3px 10px",
        borderRadius: "var(--radius-full)",
        fontSize:     11,
        fontWeight:   500,
        background:   filled ? "var(--apple-accent)" : "transparent",
        color:        filled ? "var(--apple-white)" : "var(--apple-secondary-label)",
        border:       `1px solid ${filled ? "var(--apple-accent)" : "var(--apple-separator)"}`,
      }}
    >
      {label}
    </span>
  );
}



function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "var(--apple-tertiary-label)";
  return (
    <span
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          6,
        padding:      "3px 10px",
        borderRadius: "var(--radius-full)",
        background:   STATUS_SUBTLE[status as keyof typeof STATUS_SUBTLE] ?? "var(--apple-tertiary-bg)",
        border:       "none",
        fontSize:     "var(--font-size-sm)",
        fontWeight:   600,
        color,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
      {status}
    </span>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--apple-tertiary-label)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-label)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value, onValueClick }: { label: string; value: string; onValueClick?: () => void }) {
  return (
    <div
      style={{
        display:       "flex",
        alignItems:    "baseline",
        gap:           12,
        padding:       "10px 0",
        borderBottom:  "0.5px solid var(--apple-separator)",
      }}
    >
      <span style={{ minWidth: 110, fontSize: "var(--font-size-sm)", color: "var(--apple-tertiary-label)", fontWeight: 500, flexShrink: 0 }}>{label}</span>
      {onValueClick ? (
        <button
          onClick={onValueClick}
          style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-accent)", textAlign: "left", textDecoration: "underline", textDecorationStyle: "dotted" }}
        >
          {value}
        </button>
      ) : (
        <span style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-label)" }}>{value}</span>
      )}
    </div>
  );
}

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <p style={{
        fontSize: "var(--font-size-base)", lineHeight: 1.65, color: "var(--apple-secondary-label)",
        display: expanded ? "block" : "-webkit-box",
        WebkitLineClamp: 6, WebkitBoxOrient: "vertical", overflow: "hidden"
      }}>
        {text}
      </p>
      {text.length > 300 && (
        <button 
          onClick={() => setExpanded(!expanded)} 
          style={{ marginTop: 6, fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--apple-accent)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
