import type { ICatalogSource, CatalogGame } from "./types";
import type { IgdbSearchResult } from "../types";

export function igdbCoverUrl(imageId: string, size = "cover_big"): string {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

import { searchGames, getGame, igdbGameToGame } from "../services/igdb";

const searchCache = new Map<string, CatalogGame[]>();
const fetchCache = new Map<number, CatalogGame>();

class RealIgdbCatalog implements ICatalogSource {
  async search(query: string): Promise<CatalogGame[]> {
    const q = query.trim().toLowerCase();
    if (searchCache.has(q)) return searchCache.get(q)!;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error("Timeout")), 8000);
      const res = await fetch(`/api/igdb/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!res.ok) throw new Error(`IGDB proxy failed: ${res.statusText}`);
      
      const raw = await res.json() as IgdbSearchResult[];
      const results = raw.map(normalise);
      searchCache.set(q, results);
      return results;
    } catch (err) {
      console.warn("IGDB search failed, falling back to local stub:", err);
      const stub = await searchGames(query);
      return stub.map(igdbGameToGame) as unknown as CatalogGame[];
    }
  }

  async searchAll(query: string, limit = 50, offset = 0): Promise<CatalogGame[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error("Timeout")), 8000);
      const res = await fetch(`/api/igdb/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!res.ok) throw new Error(`IGDB proxy failed: ${res.statusText}`);
      
      const raw = await res.json() as IgdbSearchResult[];
      return raw.map(normalise);
    } catch (err) {
      console.warn("IGDB searchAll failed, falling back to local stub:", err);
      const stub = await searchGames(query);
      return stub.map(igdbGameToGame) as unknown as CatalogGame[];
    }
  }

  async fetch(igdbId: number): Promise<CatalogGame | null> {
    if (fetchCache.has(igdbId)) return fetchCache.get(igdbId)!;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error("Timeout")), 8000);
      const res = await fetch(`/api/igdb/fetch?id=${igdbId}`, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!res.ok) throw new Error(`IGDB proxy failed: ${res.statusText}`);
      
      const raw = await res.json() as IgdbSearchResult[];
      const result = raw.length ? normalise(raw[0]) : null;
      if (result) fetchCache.set(igdbId, result);
      return result;
    } catch (err) {
      console.warn("IGDB fetch failed, falling back to local stub:", err);
      const stub = await getGame(igdbId);
      return stub ? igdbGameToGame(stub) as unknown as CatalogGame : null;
    }
  }
}

function normalise(raw: IgdbSearchResult): CatalogGame {
  const developer =
    raw.involved_companies?.find((ic) => ic.developer)?.company.name ?? "Unknown";
  const publisher =
    raw.involved_companies?.find((ic) => ic.publisher)?.company.name;
  return {
    igdbId:      raw.id,
    title:       raw.name,
    slug:        raw.slug,
    developer,
    publisher,
    releaseYear: raw.first_release_date
      ? new Date(raw.first_release_date * 1000).getFullYear()
      : 0,
    summary:     raw.summary,
    genres:      raw.genres?.map((g) => g.name) ?? [],
    platforms:   raw.platforms?.map((p) => p.name) ?? [],
    coverUrl:    raw.cover ? igdbCoverUrl(raw.cover.image_id) : undefined,
    igdbRating:  raw.rating ? Math.round(raw.rating) : undefined,
  };
}

// ─── Active instance ──────────────────────────────────────────────────────────

export const catalog: ICatalogSource = new RealIgdbCatalog();
