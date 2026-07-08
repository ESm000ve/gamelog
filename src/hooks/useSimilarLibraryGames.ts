import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/schema";
import { embed, cosineSimilarity } from "../services/ai";
import type { GameDetail, RelatedGameSlim } from "../types/gameDetail";

export function useSimilarLibraryGames(detail: GameDetail | null) {
  const [targetEmbedding, setTargetEmbedding] = useState<number[] | null>(null);

  // Fetch or generate embedding for the current game
  useEffect(() => {
    if (!detail) return;
    let isActive = true;

    async function getEmbed() {
      // Try to get from library first
      const gameInDb = await db.games.get(detail!.igdbId);
      if (gameInDb?.embedding) {
        if (isActive) setTargetEmbedding(gameInDb.embedding);
        return;
      }
      // Otherwise, generate it
      try {
        const text = `${detail!.title}\nGenres: ${detail!.genres.join(', ')}\n${detail!.summary || ''}`;
        const emb = await embed(text);
        if (isActive) setTargetEmbedding(emb);
      } catch (err) {
        console.warn("Failed to embed current game for similarity comparison", err);
      }
    }
    getEmbed();

    return () => { isActive = false; };
  }, [detail]);

  // Compare against library
  const similarGames = useLiveQuery(async () => {
    if (!detail || !targetEmbedding) return [];
    
    const allGames = await db.games.toArray();
    
    const scored = allGames
      .filter(g => g.igdbId !== detail.igdbId && g.embedding)
      .map(g => ({
        game: g,
        score: cosineSimilarity(targetEmbedding, g.embedding!)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // top 10

    // Format as RelatedGameSlim for the RelatedStrip
    return scored.map(s => ({
      id: s.game.igdbId,
      name: s.game.title,
      slug: s.game.slug,
      cover: s.game.coverUrl ? { image_id: s.game.coverUrl.split('/').pop()?.replace('.jpg', '') || '' } : undefined,
      first_release_date: s.game.releaseYear ? new Date(`${s.game.releaseYear}-01-01`).getTime() / 1000 : undefined,
    } as RelatedGameSlim));
  }, [detail, targetEmbedding]);

  return similarGames ?? [];
}
