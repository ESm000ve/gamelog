import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/schema";
import { STATUS_COLORS } from "../../components/StatusChip";
import { Button } from "../../components/ui/Button";
import { VerticalBarChart, HorizontalBarChart, KPICard } from "./Charts";
import { Activity, Clock, Star, Calendar, Gamepad2, BarChart2, Hash, Layers, Sparkles, RefreshCw } from "lucide-react";
import type { Log } from "../../types";
import { computeTasteAggregates } from "../../services/stats";
import { generateTasteInsights } from "../../services/ai";
import { HabitsChart } from "./HabitsChart";

type TimeRange = "all" | "year" | "months12";

export function StatsScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  
  const [insights, setInsights] = useState<string[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Fetch all games and logs
  const allGames = useLiveQuery(() => db.games.toArray());
  const allLogs = useLiveQuery(() => db.logs.toArray());

  // Calculate cutoffs for date filtering
  const now = new Date();
  const currentYearStart = new Date(now.getFullYear(), 0, 1).getTime();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();

  // ─── Filter Logic ───────────────────────────────────────────────────────────

  const isLogInRange = (log: Log, range: TimeRange) => {
    if (range === "all") return true;
    
    // We only filter based on finishedAt. If there's no finishedAt, it's outside the range.
    if (!log.finishedAt) return false;

    // Parse finishedAt "YYYY-MM-DD"
    const finishedDate = new Date(log.finishedAt).getTime();
    
    if (range === "year") return finishedDate >= currentYearStart;
    if (range === "months12") return finishedDate >= twelveMonthsAgo;
    
    return true;
  };

  // ─── Metrics Calculation ───────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (!allGames || !allLogs) return null;

    // Unfiltered KPIs
    const totalGames = allGames.length;
    
    const playedThisYear = allLogs.filter(log => {
      if (log.status !== "Played" || !log.finishedAt) return false;
      const finishedDate = new Date(log.finishedAt).getTime();
      return finishedDate >= currentYearStart;
    }).length;

    // Library by status (Unfiltered)
    const statusCounts = { Played: 0, Backlog: 0, Wishlist: 0, Playing: 0 };
    allLogs.forEach(log => {
      if (log.status in statusCounts) {
        statusCounts[log.status as keyof typeof statusCounts]++;
      }
    });

    const statusChartData = [
      { label: "Played",   value: statusCounts.Played,   color: STATUS_COLORS.Played },
      { label: "Backlog",  value: statusCounts.Backlog,  color: STATUS_COLORS.Backlog },
      { label: "Playing",  value: statusCounts.Playing,  color: STATUS_COLORS.Playing },
      { label: "Wishlist", value: statusCounts.Wishlist, color: STATUS_COLORS.Wishlist },
    ];

    // Filtered logs
    const filteredLogs = allLogs.filter(log => isLogInRange(log, timeRange));
    const filteredLogIds = new Set(filteredLogs.map(l => l.igdbId));
    
    // We also need the filtered games to calculate genres and platforms
    const filteredGames = allGames.filter(g => filteredLogIds.has(g.igdbId));

    // Filtered KPIs
    let hoursPlayed = 0;
    let totalRating = 0;
    let ratingCount = 0;

    const ratingDistribution = { 1: 0, 1.5: 0, 2: 0, 2.5: 0, 3: 0, 3.5: 0, 4: 0, 4.5: 0, 5: 0 };

    filteredLogs.forEach(log => {
      if (log.timePlayed) hoursPlayed += log.timePlayed;
      if (typeof log.rating === "number") {
        totalRating += log.rating;
        ratingCount++;
        
        // Count for distribution
        const ratingStr = log.rating.toString();
        if (ratingStr in ratingDistribution) {
          ratingDistribution[ratingStr as unknown as keyof typeof ratingDistribution]++;
        }
      }
    });

    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "—";

    const ratingChartData = [
      { label: "1",   value: ratingDistribution[1] },
      { label: "1.5", value: ratingDistribution[1.5] },
      { label: "2",   value: ratingDistribution[2] },
      { label: "2.5", value: ratingDistribution[2.5] },
      { label: "3",   value: ratingDistribution[3] },
      { label: "3.5", value: ratingDistribution[3.5] },
      { label: "4",   value: ratingDistribution[4] },
      { label: "4.5", value: ratingDistribution[4.5] },
      { label: "5",   value: ratingDistribution[5] },
    ];

    // Filtered Charts
    const platformCounts: Record<string, number> = {};
    const genreCounts: Record<string, number> = {};

    filteredGames.forEach(game => {
      // Find the log to see the played platform, or use game platforms
      const log = filteredLogs.find(l => l.igdbId === game.igdbId);
      if (log?.platforms && log.platforms.length > 0) {
        log.platforms.forEach(p => {
          platformCounts[p] = (platformCounts[p] || 0) + 1;
        });
      } else if (log?.platform) {
        platformCounts[log.platform] = (platformCounts[log.platform] || 0) + 1;
      } else {
        game.platforms.forEach(p => {
          platformCounts[p] = (platformCounts[p] || 0) + 1;
        });
      }

      game.genres.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });

    const platformChartData = Object.entries(platformCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5

    const genreChartData = Object.entries(genreCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5

    // Backlog Burndown (last 12 months)
    const today = new Date();
    const burndownData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();
      let count = 0;
      for (const log of allLogs) {
        if (log.status !== "Wishlist" && log.createdAt <= endOfMonth) {
           const started = log.startedAt ? new Date(log.startedAt).getTime() : Infinity;
           const finished = log.finishedAt ? new Date(log.finishedAt).getTime() : Infinity;
           if (started > endOfMonth && finished > endOfMonth) {
             count++;
           }
        }
      }
      burndownData.push({ label: d.toLocaleString('default', { month: 'short' }), value: count });
    }

    return {
      totalGames,
      hoursPlayed: parseFloat(hoursPlayed.toFixed(1)),
      avgRating,
      playedThisYear,
      ratingChartData,
      platformChartData,
      genreChartData,
      statusChartData,
      burndownData,
    };
  }, [allGames, allLogs, timeRange, currentYearStart, twelveMonthsAgo]);


  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleGenerateInsights = async () => {
    if (!allGames || !allLogs) return;
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const aggregates = computeTasteAggregates(allGames, allLogs);
      const generated = await generateTasteInsights(aggregates);
      setInsights(generated);
    } catch (err: any) {
      console.error(err);
      setInsightsError("Failed to generate insights. Please try again.");
    } finally {
      setInsightsLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      {/* Toolbar */}
      <div
        style={{
          flexShrink:           0,
          display:              "flex",
          alignItems:           "center",
          justifyContent:       "space-between",
          padding:              "var(--space-3) 308px var(--space-3) var(--space-8)",
          background:           "var(--apple-toolbar-bg)",
          backdropFilter:       "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom:         "1px solid var(--apple-separator)",
        }}
      >
        <h1 style={{ fontFamily: "var(--apple-font-display)", fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--apple-label)", letterSpacing: "-0.015em" }}>
          Stats
        </h1>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          aria-label="Time range"
          style={{
            padding: "var(--space-1) 28px var(--space-1) var(--space-3)",
            borderRadius: "var(--radius-md)",
            background: "var(--apple-fill)",
            border: "1px solid var(--apple-separator)",
            color: "var(--apple-label)",
            fontSize: "var(--font-size-base)",
            fontWeight: 500,
            outline: "none",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%238E8E93%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px top 50%",
            backgroundSize: "10px auto",
          }}
        >
          <option value="all">All time</option>
          <option value="year">This year</option>
          <option value="months12">Last 12 months</option>
        </select>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: 32 }}>
        {!stats ? (
          <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)", textAlign: "center" }}>Loading…</p>
        ) : stats.totalGames === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "var(--radius-xl)", background: "var(--apple-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={20} color="var(--apple-tertiary-label)" aria-hidden="true" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <p style={{ color: "var(--apple-label)", fontSize: "var(--font-size-base)", fontWeight: 500 }}>Nothing to chart yet</p>
              <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-sm)"}}>Add some games to your library to see your stats.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Taste Insights */}
            <div style={{ background: "var(--apple-secondary-bg)", border: "1px solid var(--apple-separator)", borderRadius: "var(--radius-2xl)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-5) var(--space-8)", borderBottom: insights.length > 0 ? "1px solid var(--apple-separator)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: "var(--apple-accent)", color: "white" }}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "var(--apple-font-display)", fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--apple-label)", letterSpacing: "-0.01em" }}>Taste Insights</h2>
                    <p style={{ fontSize: "var(--font-size-base)", color: "var(--apple-tertiary-label)", marginTop: 2 }}>AI-generated observations on your gaming habits.</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateInsights}
                  loading={insightsLoading}
                >
                  {insightsLoading ? (
                    "Analyzing…"
                  ) : insights.length > 0 ? (
                    <><RefreshCw size={14} /> Regenerate</>
                  ) : (
                    <><Sparkles size={14} /> Generate</>
                  )}
                </Button>
              </div>

              {insightsError && (
                <div style={{ padding: "var(--space-4) var(--space-6)", color: "var(--apple-red)", fontSize: "var(--font-size-base)", background: "rgba(255,59,48,0.1)" }}>
                  {insightsError}
                </div>
              )}

              {insights.length > 0 && !insightsLoading && (
                <ul style={{ padding: "var(--space-4) var(--space-6)", display: "flex", flexDirection: "column", gap: 10, margin: 0, listStyle: "none" }}>
                  {insights.map((insight, idx) => (
                    <li key={idx} style={{ fontSize: 14, lineHeight: 1.55, color: "var(--apple-secondary-label)", paddingLeft: 14, position: "relative" }}>
                      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: "0.55em", width: 5, height: 5, borderRadius: "50%", background: "var(--apple-separator)", display: "inline-block" }} />
                      {insight}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Play Habits & Streaks */}
            <ChartSection title="Play Habits" icon={<Calendar size={16} aria-hidden="true" />}>
              <HabitsChart logs={allLogs ?? []} />
            </ChartSection>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
              <KPICard label="Total games" value={stats.totalGames} icon={<Hash size={14} aria-hidden="true" />} />
              <KPICard label="Hours played" value={stats.hoursPlayed} icon={<Clock size={14} aria-hidden="true" />} />
              <KPICard label="Avg rating" value={stats.avgRating} icon={<Star size={14} aria-hidden="true" />} />
              <KPICard label="Played this year" value={stats.playedThisYear} icon={<Calendar size={14} aria-hidden="true" />} />
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <ChartSection title="Rating distribution" icon={<BarChart2 size={16} aria-hidden="true" />}>
                <VerticalBarChart data={stats.ratingChartData} height={180} />
              </ChartSection>
              
              <ChartSection title="By platform" icon={<Gamepad2 size={16} aria-hidden="true" />}>
                <HorizontalBarChart data={stats.platformChartData} />
              </ChartSection>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <ChartSection title="Top genres" icon={<Layers size={16} aria-hidden="true" />}>
                <HorizontalBarChart data={stats.genreChartData} />
              </ChartSection>
              
              <ChartSection title="Library by status" icon={<Activity size={16} aria-hidden="true" />}>
                <HorizontalBarChart data={stats.statusChartData} />
              </ChartSection>
            </div>

            {/* Charts Row 3 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
              <ChartSection title="Backlog Burndown (Last 12 Months)" icon={<BarChart2 size={16} aria-hidden="true" />}>
                <VerticalBarChart data={stats.burndownData} height={180} color="var(--apple-blue)" />
              </ChartSection>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ChartSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ padding: "var(--space-6)", background: "var(--apple-secondary-bg)", border: "1px solid var(--apple-separator)", borderRadius: "var(--radius-2xl)", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "var(--apple-tertiary-label)" }}>{icon}</span>
        <h2 style={{ fontFamily: "var(--apple-font-display)", fontSize: 14, fontWeight: 600, color: "var(--apple-label)", letterSpacing: "-0.01em" }}>
          {title}
        </h2>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {children}
      </div>
    </div>
  );
}
