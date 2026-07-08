import { db } from "../db/schema";
import { cosineSimilarity } from "./ai";
import type { Game, Log } from "../types";

export interface RecommenderCandidate {
  game: Game;
  log: Log;
  score: number;
  reason?: string;
}

/**
 * Pre-ranks the backlog based on user's top rated games and embeddings.
 */
export async function preRankCandidates(excludeIds: number[] = []): Promise<RecommenderCandidate[]> {
  const allGames = await db.games.toArray();
  const allLogs = await db.logs.toArray();

  const logMap = new Map<number, Log>();
  allLogs.forEach(l => logMap.set(l.igdbId, l));

  // 1. Identify user's top-rated games (proxy for their taste)
  const topRated = allGames.filter(g => {
    const l = logMap.get(g.igdbId);
    return l && (l.rating ?? 0) >= 4.0;
  });

  // 2. Identify candidates (Backlog or Wishlist, NOT Played/Playing)
  const candidates = allGames.filter(g => {
    if (excludeIds.includes(g.igdbId)) return false;
    const l = logMap.get(g.igdbId);
    if (!l) return false;
    return l.status === "Backlog" || l.status === "Wishlist";
  });

  if (candidates.length === 0) return [];

  // 3. Score candidates
  const scored = candidates.map(g => {
    let maxSim = 0;
    if (g.embedding && topRated.length > 0) {
      for (const top of topRated) {
        if (top.embedding) {
          const sim = cosineSimilarity(g.embedding, top.embedding);
          if (sim > maxSim) maxSim = sim;
        }
      }
    }

    // Base score: 
    // - Semantic similarity to top rated games (0 to 1) * 100
    let score = maxSim * 100;
    
    // Slight bump for IGDB rating as a baseline quality measure
    if (g.igdbRating) {
      score += (g.igdbRating / 100) * 10;
    }

    const log = logMap.get(g.igdbId)!;
    return { game: g, log, score };
  });

  // Sort descending by score
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Passes top candidates and user intent to the LLM.
 */
export async function getRecommendations(intent: string, excludeIds: number[] = []): Promise<RecommenderCandidate[]> {
  const ranked = await preRankCandidates(excludeIds);
  if (ranked.length === 0) return [];

  // If no LLM intent and we just want deterministic, return top 5
  if (!intent.trim()) {
    return ranked.slice(0, 5);
  }

  // Take top 20 pre-ranked candidates for the LLM to choose from
  const topCandidates = ranked.slice(0, 20);

  const payload = topCandidates.map(c => ({
    id: c.game.igdbId,
    title: c.game.title,
    genres: c.game.genres,
    timeToBeat: c.game.timeToBeat?.finish,
    igdbRating: c.game.igdbRating
  }));

  try {
    const res = await fetch('/api/ai/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent, candidates: payload }),
    });

    if (!res.ok) {
      throw new Error('LLM call failed');
    }

    const data = await res.json();
    
    // data.picks should be array of { id, reason }
    const picks: { id: number, reason: string }[] = data.picks || [];
    
    const finalPicks: RecommenderCandidate[] = [];
    for (const pick of picks) {
      const match = topCandidates.find(c => c.game.igdbId === pick.id);
      if (match) {
        finalPicks.push({ ...match, reason: pick.reason });
      }
    }

    if (finalPicks.length > 0) return finalPicks;
  } catch (err) {
    console.warn("Recommender LLM fallback triggered:", err);
  }

  // --- Local Fallback Logic ---
  const q = intent.toLowerCase();
  
  // 1. Identify local filters based on intent string
  const wantsShort = q.includes("short") || q.includes("quick") || q.includes("bite-sized");
  const wantsLong = q.includes("long") || q.includes("epic") || q.includes("hundred hours");
  
  const commonGenres = ["rpg", "action", "adventure", "strategy", "simulation", "sports", "puzzle", "indie", "shooter", "platform", "fighting", "racing", "arcade", "music", "tactical"];
  const matchedGenres = commonGenres.filter(g => q.includes(g));

  // 2. Score and filter candidates locally
  const localScored = ranked.map(c => {
    let score = c.score; // start with their pre-ranked score
    let reason = "A highly rated game in your backlog.";
    let matchesIntent = false;

    // Check Length
    const ttb = c.game.timeToBeat?.finish;
    if (wantsShort) {
      if (ttb && ttb <= 12) {
        score += 50;
        matchesIntent = true;
        reason = `Matches your request for a shorter game (~${Math.round(ttb)}h).`;
      } else if (ttb && ttb > 20) {
        score -= 100; // Penalize long games
      }
    } else if (wantsLong) {
      if (ttb && ttb >= 30) {
        score += 50;
        matchesIntent = true;
        reason = `An epic adventure you can sink time into (~${Math.round(ttb)}h).`;
      } else if (ttb && ttb < 15) {
        score -= 100;
      }
    }

    // Check Genres
    if (matchedGenres.length > 0 && c.game.genres) {
      const gameGenresLower = c.game.genres.map(g => g.toLowerCase());
      const hasGenre = matchedGenres.some(mg => gameGenresLower.some(gg => gg.includes(mg)));
      if (hasGenre) {
        score += 80;
        matchesIntent = true;
        const formattedGenres = matchedGenres.map(g => g.charAt(0).toUpperCase() + g.slice(1));
        reason = `Matches your request for ${formattedGenres.join(" / ")}.`;
      }
    }

    // Check title match (fallback keyword)
    if (c.game.title.toLowerCase().includes(q)) {
      score += 100;
      matchesIntent = true;
      reason = "Matches your keyword search exactly.";
    }

    return { ...c, score, reason: matchesIntent ? reason : "A great game from your backlog." };
  });

  // 3. Re-sort based on the new local score
  localScored.sort((a, b) => b.score - a.score);

  return localScored.slice(0, 5);
}
