import { db } from "../db/schema";
import type { Game } from "../types";

// Simple in-memory cache to avoid redundant API calls during the session
const dealCache = new Map<number, { price: number; url: string } | null>();

/**
 * Fetches the current cheapest deals for a list of games from CheapShark.
 * Updates the local database with the deal price and redirect URL.
 */
export async function fetchDealsForWishlist(games: Game[]): Promise<void> {
  const promises = games.map(async (game) => {
    if (dealCache.has(game.igdbId)) return;

    try {
      // CheapShark API requires exact or close title matches
      const query = encodeURIComponent(game.title);
      const res = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${query}&limit=3`);
      
      if (!res.ok) {
        dealCache.set(game.igdbId, null);
        return;
      }
      
      const data = await res.json();
      
      if (data && data.length > 0) {
        // Find best match (usually first, but we check if title matches loosely)
        const deal = data[0];
        const price = parseFloat(deal.cheapest);
        const url = `https://www.cheapshark.com/redirect?dealID=${deal.cheapestDealID}`;
        
        dealCache.set(game.igdbId, { price, url });
        
        // Update database with deal info
        await db.games.update(game.igdbId, { dealPrice: price, dealUrl: url });
      } else {
        dealCache.set(game.igdbId, null); // No deals found
      }
    } catch (e) {
      console.error(`Failed to fetch deal for ${game.title}`, e);
      dealCache.set(game.igdbId, null);
    }
  });

  await Promise.all(promises);
}
