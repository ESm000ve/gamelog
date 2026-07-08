import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import type { DerivedStats, Game, Log } from "../types";
import { STATUS_COLORS } from "../components/StatusChip";

type TimeRange = "all" | "year" | "last12";

// This hook isn't currently wired into any screen (Stats/StatsScreen.tsx computes
// its own aggregates via services/stats.ts::computeTasteAggregates instead), but
// it's kept as a small, self-contained alternative for simple "totals" widgets.
function deriveStats(logs: Log[], games: Game[]): DerivedStats {
  const gameMap = new Map(games.map((g) => [g.igdbId, g]));
  const year = new Date().getFullYear().toString();

  let hoursPlayed = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  let playedThisYear = 0;

  const ratingBuckets = new Map<string, number>();
  const platformCounts = new Map<string, number>();
  const genreCounts = new Map<string, number>();
  const statusCounts = new Map<string, number>();

  logs.forEach((log) => {
    const game = gameMap.get(log.igdbId);

    if (log.timePlayed) hoursPlayed += log.timePlayed;

    if (log.rating !== undefined && log.rating > 0) {
      ratingSum += log.rating;
      ratingCount++;
      const label = log.rating.toFixed(1);
      ratingBuckets.set(label, (ratingBuckets.get(label) || 0) + 1);
    }

    if (log.finishedAt?.startsWith(year)) playedThisYear++;

    statusCounts.set(log.status, (statusCounts.get(log.status) || 0) + 1);

    const platform = log.platform || game?.platforms?.[0];
    if (platform) platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1);

    game?.genres?.forEach((g) => genreCounts.set(g, (genreCounts.get(g) || 0) + 1));
  });

  const toDist = (m: Map<string, number>) =>
    Array.from(m.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

  return {
    totalGames: games.length,
    hoursPlayed: Math.round(hoursPlayed),
    avgRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    playedThisYear,
    ratingDist: toDist(ratingBuckets),
    byPlatform: toDist(platformCounts),
    byGenre: toDist(genreCounts),
    byStatus: toDist(statusCounts).map((d) => ({
      ...d,
      color: STATUS_COLORS[d.label as keyof typeof STATUS_COLORS] ?? "var(--apple-secondary-label)",
    })),
  };
}

/**
 * Derives all stats from the live log + game tables.
 * Re-runs automatically when either table changes.
 */
export function useStats(range: TimeRange = "all"): DerivedStats | undefined {
  return useLiveQuery(async () => {
    const [logs, games] = await Promise.all([
      db.logs.toArray(),
      db.games.toArray(),
    ]);

    // Filter logs by time range
    let filteredLogs = logs;
    if (range === "year") {
      const year = new Date().getFullYear().toString();
      filteredLogs = logs.filter(
        (l) => l.finishedAt?.startsWith(year)
      );
    } else if (range === "last12") {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      filteredLogs = logs.filter(
        (l) => l.finishedAt && l.finishedAt >= cutoffStr
      );
    }

    return deriveStats(filteredLogs, games);
  }, [range]);
}
