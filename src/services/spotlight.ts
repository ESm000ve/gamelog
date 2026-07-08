import { db } from "../db/schema";
import type { Game, Log } from "../types";

export interface SpotlightData {
  game: Game;
  log: Log;
  reason: string;
}

/**
 * Returns a string representing the current ISO week (e.g., "2026-W28")
 */
function getWeekString() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo}`;
}

/**
 * Retrieves the current Game of the Week.
 * If one hasn't been picked for this week, it picks a random backlog game
 * and caches the selection in localStorage.
 */
export async function getSpotlight(): Promise<SpotlightData | null> {
  const currentWeek = getWeekString();
  const cachedWeek = localStorage.getItem("spotlight_week");
  const cachedId = localStorage.getItem("spotlight_igdbId");
  
  let targetId: number | null = null;
  
  if (cachedWeek === currentWeek && cachedId) {
    targetId = parseInt(cachedId, 10);
  } else {
    // Time to pick a new game!
    const logs = await db.logs.toArray();
    const backlogLogs = logs.filter(l => l.status === "Backlog");
    if (backlogLogs.length === 0) return null;
    
    const randomLog = backlogLogs[Math.floor(Math.random() * backlogLogs.length)];
    targetId = randomLog.igdbId;
    
    localStorage.setItem("spotlight_week", currentWeek);
    localStorage.setItem("spotlight_igdbId", targetId.toString());
  }
  
  const game = await db.games.get(targetId);
  const log = await db.logs.get(targetId);
  
  if (!game || !log) return null;
  
  // Generate a heuristic reason to play this game
  let reason = "It's time to finally tackle this from your backlog!";
  
  if (game.igdbRating && game.igdbRating >= 85) {
    reason = `Critics gave this a stunning ${Math.round(game.igdbRating)}/100. It's an essential classic!`;
  } else if (game.timeToBeat?.average && game.timeToBeat.average < 10) {
    reason = `At roughly ${game.timeToBeat.average} hours to beat, this is a perfect short experience for the weekend.`;
  } else if (log.createdAt && (Date.now() - log.createdAt > 1000 * 60 * 60 * 24 * 180)) {
    reason = "This has been sitting in your backlog for over 6 months. It's time!";
  } else if (game.genres && game.genres.length > 0) {
    reason = `Get your ${game.genres[0]} fix in. Let's start this adventure!`;
  }
  
  return { game, log, reason };
}
