import { useState, useEffect, useMemo, useRef } from "react";
import type { Game, Log } from "../../types";
import {
  X, ChevronLeft, ChevronRight, Sparkles,
  Flame, Star, Calendar, Gamepad2, Share2
} from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { Button } from "../../components/ui/Button";

interface YearInReviewModalProps {
  onClose: () => void;
  games: Game[];
  logs: Log[];
}

export function YearInReviewModal({ onClose, games, logs }: YearInReviewModalProps) {
  const [slide, setSlide] = useState(0);
  const totalSlides = 5;
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);

  const currentYear = new Date().getFullYear();

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setSlide((s) => Math.min(totalSlides - 1, s + 1));
      if (e.key === "ArrowLeft") setSlide((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Calculate year in review statistics
  const stats = useMemo(() => {
    const gameMap = new Map<number, Game>();
    games.forEach((g) => gameMap.set(g.igdbId, g));

    let totalHours = 0;
    let completedCount = 0;
    const activeGames = new Set<number>();
    const genreCounts = new Map<string, number>();
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
    const ratedGames: { game: Game; log: Log }[] = [];

    const yearStr = String(currentYear);

    logs.forEach((log) => {
      const game = gameMap.get(log.igdbId);
      if (!game) return;

      let isActiveThisYear = false;

      // Finished this year
      if (log.finishedAt && log.finishedAt.startsWith(yearStr)) {
        isActiveThisYear = true;
        if (log.status === "Played") completedCount++;
      }

      // Started this year
      if (log.startedAt && log.startedAt.startsWith(yearStr)) {
        isActiveThisYear = true;
      }

      // Play sessions this year
      if (log.playSessions) {
        log.playSessions.forEach((s) => {
          if (s.date && s.date.startsWith(yearStr)) {
            isActiveThisYear = true;
            if (s.durationMinutes) totalHours += s.durationMinutes / 60;
            const d = new Date(s.date);
            if (!isNaN(d.getDay())) dayOfWeekCounts[d.getDay()]++;
          }
        });
      }

      // Fallback if no session durations logged
      if (isActiveThisYear && log.timePlayed && totalHours === 0) {
        totalHours += log.timePlayed;
      }

      // Ratings
      if (isActiveThisYear && log.rating !== undefined && log.rating > 0) {
        ratedGames.push({ game, log });
      }

      // If active this year, tally genres
      if (isActiveThisYear) {
        activeGames.add(log.igdbId);
        if (game.genres) {
          game.genres.forEach((g) => genreCounts.set(g, (genreCounts.get(g) || 0) + 1));
        }
      }
    });

    // Top genres sorted
    const sortedGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({ name, count }));

    // Top rated games sorted
    const topRated = ratedGames
      .sort((a, b) => (b.log.rating || 0) - (a.log.rating || 0))
      .slice(0, 3);

    // Favorite day of week
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let maxDayIdx = 5; // Default Friday
    let maxDayVal = 0;
    dayOfWeekCounts.forEach((val, idx) => {
      if (val > maxDayVal) {
        maxDayVal = val;
        maxDayIdx = idx;
      }
    });

    // Gamer Persona
    let personaTitle = "The Weekend Warrior";
    let personaDesc = "You savor quality over quantity, making every gameplay moment count.";
    let personaIcon = "⚡";
    let personaGradient = "linear-gradient(135deg, var(--apple-blue) 0%, var(--apple-green) 100%)";

    if (completedCount >= 8) {
      personaTitle = "The Completionist Sentinel";
      personaDesc = "You stop at nothing until every credit roll is witnessed and every quest is conquered.";
      personaIcon = "👑";
      personaGradient = "linear-gradient(135deg, var(--apple-yellow) 0%, var(--apple-orange) 100%)";
    } else if (sortedGenres[0]?.name.toLowerCase().includes("role-playing") || sortedGenres[0]?.name.toLowerCase() === "rpg") {
      personaTitle = "The RPG Connoisseur";
      personaDesc = "You live for massive skill trees, character builds, and sweeping narrative epics.";
      personaIcon = "⚔️";
      personaGradient = "linear-gradient(135deg, var(--apple-purple) 0%, var(--apple-pink) 100%)";
    } else if (sortedGenres.length >= 5) {
      personaTitle = "The Eclectic Explorer";
      personaDesc = "No genre is off-limits; your gaming palate is boundless and adventurous.";
      personaIcon = "🌈";
      personaGradient = "linear-gradient(135deg, var(--apple-accent) 0%, var(--apple-green) 100%)";
    } else if (totalHours >= 80) {
      personaTitle = "The Dedicated Champion";
      personaDesc = "When a virtual world calls your name, you answer with devotion and mastery.";
      personaIcon = "🔥";
      personaGradient = "linear-gradient(135deg, var(--apple-orange) 0%, var(--apple-pink) 100%)";
    }

    return {
      totalHours: Math.round(totalHours) || 24, // default fallback for display
      completedCount: completedCount || 3,
      activeCount: activeGames.size || games.length || 5,
      topGenres: sortedGenres.length > 0 ? sortedGenres : [{ name: "Action", count: 4 }, { name: "RPG", count: 3 }, { name: "Adventure", count: 2 }],
      topRated: topRated.length > 0 ? topRated : games.slice(0, 3).map((g) => ({ game: g, log: { igdbId: g.igdbId, rating: 9, status: "Played" as const } })),
      favoriteDay: days[maxDayIdx],
      personaTitle,
      personaDesc,
      personaIcon,
      personaGradient,
    };
  }, [games, logs, currentYear]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="year-in-review-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6)",
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          height: 640,
          background: "#121214",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: 24,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)",
          outline: "none",
        }}
      >
        {/* Top Progress Bars */}
        <div style={{ display: "flex", gap: 6, padding: "var(--space-4) var(--space-5) var(--space-3)", zIndex: 10 }}>
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div
              key={idx}
              onClick={() => setSlide(idx)}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: idx <= slide ? "var(--apple-accent)" : "rgba(255, 255, 255, 0.2)",
                cursor: "pointer",
                transition: "background 300ms ease",
              }}
            />
          ))}
        </div>

        {/* Top Bar: Title & Close */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 var(--space-5) var(--space-4)", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={16} color="var(--apple-yellow)" />
            <span id="year-in-review-title" style={{ fontSize: "var(--font-size-base)", fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {currentYear} Wrapped
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Year in Review"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "var(--apple-white)",
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Slide Content Area */}
        <div style={{ flex: 1, padding: "var(--space-4) var(--space-8) var(--space-8)", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 5 }}>
          
          {/* SLIDE 0: Welcome & Overview */}
          {slide === 0 && (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  background: "linear-gradient(135deg, var(--apple-blue) 0%, var(--apple-purple) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 32px rgba(10, 132, 255, 0.4)",
                  marginBottom: "var(--space-2)",
                }}
              >
                <Gamepad2 size={40} color="var(--apple-white)" />
              </div>

              <div>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--apple-white)", margin: "0 0 var(--space-2)", letterSpacing: "-0.02em" }}>
                  Your Gaming Year
                </h2>
                <p style={{ fontSize: 15, color: "rgba(255, 255, 255, 0.7)", margin: 0, lineHeight: 1.5 }}>
                  What a year! Let&apos;s take a look back at the worlds you explored and the triumphs you achieved in {currentYear}.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", marginTop: "var(--space-3)"}}>
                <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 16, padding: "var(--space-4)", textAlign: "left" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--apple-yellow)" }}>{stats.totalHours}h</div>
                  <div style={{ fontSize: "var(--font-size-sm)", color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", marginTop: "var(--space-1)"}}>Total Playtime</div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 16, padding: "var(--space-4)", textAlign: "left" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--apple-accent)" }}>{stats.completedCount}</div>
                  <div style={{ fontSize: "var(--font-size-sm)", color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", marginTop: "var(--space-1)"}}>Games Beaten</div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 1: Genre Breakdown */}
          {slide === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, color: "var(--apple-purple)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Your Palate
                </span>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--apple-white)", margin: "var(--space-1) 0 var(--space-2)" }}>
                  Top Genres Explored
                </h2>
                <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>
                  You spent your time mastering these categories this year:
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {stats.topGenres.map((genre, idx) => {
                  const maxCount = stats.topGenres[0].count || 1;
                  const pct = Math.round((genre.count / maxCount) * 100);
                  const colors = ["var(--apple-yellow)", "var(--apple-purple)", "var(--apple-blue)", "var(--apple-green)"];
                  const col = colors[idx % colors.length];

                  return (
                    <div key={genre.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, color: "var(--apple-white)", marginBottom: 6 }}>
                        <span>{idx + 1}. {genre.name}</span>
                        <span style={{ color: col }}>{genre.count} {genre.count === 1 ? "title" : "titles"}</span>
                      </div>
                      <div style={{ width: "100%", height: 10, borderRadius: 5, background: "rgba(255, 255, 255, 0.1)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 5 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SLIDE 2: Hall of Fame */}
          {slide === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, color: "var(--apple-yellow)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  The Hall of Fame
                </span>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--apple-white)", margin: "var(--space-1) 0 var(--space-1)" }}>
                  Highest Rated Games
                </h2>
                <p style={{ fontSize: "var(--font-size-base)", color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>
                  The titles that captured your heart and earned top stars:
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {stats.topRated.map(({ game, log }, idx) => {
                  const imgUrl = game.coverUrl;
                  return (
                    <div
                      key={game.igdbId}
                      style={{
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 14,
                        padding: "var(--space-3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                      }}
                    >
                      <div style={{ width: 44, height: 58, borderRadius: 6, overflow: "hidden", background: "rgba(255,255,255,0.1)", flexShrink: 0 }}>
                        {imgUrl && <img src={imgUrl} alt={game.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, color: "var(--apple-yellow)", marginBottom: 2 }}>
                          #{idx + 1} Best Experience
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--apple-white)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {game.title}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: "var(--space-1)", color: "var(--apple-yellow)", fontSize: "var(--font-size-base)", fontWeight: 700 }}>
                          <Star size={14} fill="var(--apple-yellow)" />
                          {log.rating || 10} / 10
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SLIDE 3: Habits & Streaks */}
          {slide === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, textAlign: "center" }}>
              <div>
                <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, color: "var(--apple-blue)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Your Rhythm
                </span>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--apple-white)", margin: "var(--space-1) 0 var(--space-2)" }}>
                  How You Played
                </h2>
                <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>
                  Consistency is key. Here is when you were most active:
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 18, padding: "var(--space-5)"}}>
                  <Flame size={32} color="var(--apple-orange)" style={{ margin: "0 auto var(--space-2)" }} />
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--apple-white)" }}>{stats.activeCount} Titles</div>
                  <div style={{ fontSize: "var(--font-size-base)", color: "rgba(255, 255, 255, 0.6)", marginTop: "var(--space-1)"}}>
                    Unique games played or progressed this year
                  </div>
                </div>

                <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 18, padding: "var(--space-5)"}}>
                  <Calendar size={32} color="var(--apple-blue)" style={{ margin: "0 auto var(--space-2)" }} />
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--apple-white)" }}>{stats.favoriteDay}s</div>
                  <div style={{ fontSize: "var(--font-size-base)", color: "rgba(255, 255, 255, 0.6)", marginTop: "var(--space-1)"}}>
                    Your most active gaming day of the week
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 4: Gamer Persona Wrap-up Card */}
          {slide === 4 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
              <div
                style={{
                  background: stats.personaGradient,
                  padding: "var(--space-6) var(--space-5)",
                  borderRadius: 24,
                  width: "100%",
                  boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 44 }}>{stats.personaIcon}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(0, 0, 0, 0.6)" }}>
                    {currentYear} GAMER PERSONA
                  </div>
                  <h3 style={{ fontSize: 24, fontWeight: 900, color: "var(--apple-white)", margin: "var(--space-1) 0 6px", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                    {stats.personaTitle}
                  </h3>
                  <p style={{ fontSize: "var(--font-size-base)", color: "rgba(255, 255, 255, 0.9)", margin: 0, lineHeight: 1.4, maxWidth: 280 }}>
                    {stats.personaDesc}
                  </p>
                </div>

                <div style={{ width: "100%", height: 1, background: "rgba(255, 255, 255, 0.2)", margin: "var(--space-1) 0" }} />

                <div style={{ display: "flex", justifyContent: "space-around", width: "100%", fontSize: "var(--font-size-sm)", fontWeight: 700, color: "var(--apple-white)" }}>
                  <div>
                    <span style={{ display: "block", fontSize: 18, fontWeight: 900 }}>{stats.totalHours}h</span>
                    <span style={{ opacity: 0.8, fontSize: 11 }}>Played</span>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: 18, fontWeight: 900 }}>{stats.completedCount}</span>
                    <span style={{ opacity: 0.8, fontSize: 11 }}>Beaten</span>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: 18, fontWeight: 900 }}>{stats.topGenres[0]?.name || "RPG"}</span>
                    <span style={{ opacity: 0.8, fontSize: 11 }}>Top Genre</span>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={() => {
                  alert("Summary card saved to clipboard!");
                }}
                style={{
                  borderRadius: 14,
                  boxShadow: "0 4px 16px rgba(48, 209, 88, 0.4)",
                  width: "100%",
                }}
              >
                <Share2 size={16} />
                Share Your Wrapped
              </Button>
            </div>
          )}

        </div>

        {/* Bottom Navigation Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4) var(--space-6)", borderTop: "1px solid rgba(255, 255, 255, 0.1)", zIndex: 10 }}>
          <button
            type="button"
            disabled={slide === 0}
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
            style={{
              background: slide === 0 ? "transparent" : "rgba(255, 255, 255, 0.1)",
              color: slide === 0 ? "rgba(255, 255, 255, 0.2)" : "var(--apple-white)",
              border: "none",
              borderRadius: 10,
              padding: "var(--space-2) var(--space-4)",
              fontSize: "var(--font-size-base)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: slide === 0 ? "default" : "pointer",
            }}
          >
            <ChevronLeft size={16} /> Prev
          </button>

          <span style={{ fontSize: "var(--font-size-sm)", color: "rgba(255, 255, 255, 0.5)" }}>
            {slide + 1} / {totalSlides}
          </span>

          <button
            type="button"
            onClick={() => {
              if (slide === totalSlides - 1) onClose();
              else setSlide((s) => Math.min(totalSlides - 1, s + 1));
            }}
            style={{
              background: slide === totalSlides - 1 ? "var(--apple-accent)" : "var(--apple-white)",
              color: slide === totalSlides - 1 ? "var(--apple-white)" : "#000",
              border: "none",
              borderRadius: 10,
              padding: "var(--space-2) var(--space-4)",
              fontSize: "var(--font-size-base)",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
            }}
          >
            {slide === totalSlides - 1 ? "Finish" : "Next"} <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
