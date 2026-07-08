import { useState, useEffect, useCallback } from "react";
import type { GameDetail } from "../types/gameDetail";
import { normalizeDetail } from "../types/gameDetail";
import { getGame } from "../services/igdb";

interface UseGameDetailResult {
  detail:  GameDetail | null;
  loading: boolean;
  error:   string | null;
  retry:   () => void;
}

// Simple in-memory cache keyed by igdbId
const cache = new Map<number, GameDetail>();

export function useGameDetail(igdbId: number | null): UseGameDetailResult {
  const [detail,  setDetail]  = useState<GameDetail | null>(igdbId ? (cache.get(igdbId) ?? null) : null);
  const [loading, setLoading] = useState(igdbId !== null && !cache.has(igdbId ?? -1));
  const [error,   setError]   = useState<string | null>(null);

  const fetchDetail = useCallback(() => {
    if (igdbId === null) return;
    if (cache.has(igdbId)) {
      setDetail(cache.get(igdbId)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error("Timeout")), 8000);

    fetch(`/api/igdb/detail?id=${igdbId}`, { signal: controller.signal })
      .then((r) => {
        clearTimeout(timeout);
        if (!r.ok) throw new Error(`Detail fetch failed: ${r.statusText}`);
        return r.json();
      })
      .then((data: { game: any; timeToBeat: any }) => {
        if (!data.game) throw new Error("Game not found");
        const normalized = normalizeDetail(data.game, data.timeToBeat);
        cache.set(igdbId, normalized);
        setDetail(normalized);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return; // Unmounted

        console.warn("IGDB detail fetch failed, falling back to local stub:", err);
        getGame(igdbId).then(stub => {
          if (stub) {
            const companies = [
              { name: stub.developer, roles: ["Developer"] },
              ...(stub.publisher ? [{ name: stub.publisher, roles: ["Publisher"] }] : []),
            ];
            const fallback: GameDetail = {
              igdbId: stub.igdbId,
              title: stub.title,
              slug: stub.slug,
              companies,
              developer: stub.developer,
              publisher: stub.publisher,
              releaseYear: stub.releaseYear,
              summary: stub.summary,
              genres: stub.genres,
              themes: [],
              keywords: [],
              engines: [],
              platforms: stub.platforms,
              releaseDates: [],
              coverUrl: stub.coverUrl,
              screenshots: [],
              artworks: [],
              videos: [],
              igdbRating: { score: stub.igdbRating, count: undefined },
              criticRating: {},
              gameModes: [],
              formattedMultiplayer: [],
              playerPersp: [],
              ageRatings: [],
              ageDescriptors: [],
              franchise: undefined,
              altNames: [],
              websites: [],
              languages: [],
              timeToBeat: stub.timeToBeat ?? null,
              related: { related: [], dlcs: [], expansions: [], ports: [], series: [], mods: [], bundles: [] }
            };
            cache.set(igdbId, fallback);
            setDetail(fallback);
          } else {
            setError(err instanceof Error ? err.message : "Failed to load game details");
          }
          setLoading(false);
        });
      });

    return () => { clearTimeout(timeout); controller.abort(); };
  }, [igdbId]);

  useEffect(() => {
    const cleanup = fetchDetail();
    return cleanup;
  }, [fetchDetail]);

  return { detail, loading, error, retry: fetchDetail };
}
