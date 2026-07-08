import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import type { LibraryEntry, Status } from "../types";
import { filterEntries, type FilterSpec } from "../services/filterEngine";

export type SortKey = "recent" | "rating" | "title-asc" | "title-desc" | "year-desc" | "year-asc" | "time";

interface UseLibraryOptions {
  filters?: FilterSpec;
  sort?:    SortKey;
  search?:  string;
}

/**
 * Reactive library hook.
 * Returns undefined while the initial IndexedDB query is loading.
 * After that, re-renders automatically on any db change.
 */
export function useLibrary({
  filters = {},
  sort    = "year-asc",
  search  = "",
}: UseLibraryOptions = {}) {
  return useLiveQuery(async () => {
    const [games, logs] = await Promise.all([
      db.games.toArray(),
      db.logs.toArray(),
    ]);

    const logMap = new Map(logs.map((l) => [l.igdbId, l]));

    let entries: LibraryEntry[] = games
      .filter((g) => logMap.has(g.igdbId))
      .map((g) => ({ game: g, log: logMap.get(g.igdbId)! }));

    // Apply FilterSpec
    entries = filterEntries(entries, filters);

    // Title search
    const q = search.trim().toLowerCase();
    if (q) {
      entries = entries.filter((e) =>
        e.game.title.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sort) {
      case "recent":
        entries.sort((a, b) => b.game.addedAt  - a.game.addedAt);
        break;
      case "rating":
        entries.sort((a, b) => (b.log.rating  ?? 0) - (a.log.rating  ?? 0));
        break;
      case "title-asc":
        entries.sort((a, b) => a.game.title.localeCompare(b.game.title));
        break;
      case "title-desc":
        entries.sort((a, b) => b.game.title.localeCompare(a.game.title));
        break;
      case "year-desc":
        entries.sort((a, b) => {
          const diff = b.game.releaseYear - a.game.releaseYear;
          if (diff !== 0) return diff;
          return (b.game.firstReleaseDate || 0) - (a.game.firstReleaseDate || 0);
        });
        break;
      case "year-asc":
        entries.sort((a, b) => {
          const diff = a.game.releaseYear - b.game.releaseYear;
          if (diff !== 0) return diff;
          return (a.game.firstReleaseDate || 0) - (b.game.firstReleaseDate || 0);
        });
        break;
      case "time":
        entries.sort((a, b) => (b.log.timePlayed ?? 0) - (a.log.timePlayed ?? 0));
        break;
    }

    return entries;
  }, [JSON.stringify(filters), sort, search]);
}

/** Counts per status — used for the filter strip badges. */
export function useLibraryCounts() {
  return useLiveQuery(async () => {
    const logs = await db.logs.toArray();
    const counts: Record<Status | "All", number> = {
      All:      logs.length,
      Playing:  0,
      Backlog:  0,
      Played:   0,
      Wishlist: 0,
    };
    for (const l of logs) {
      counts[l.status] = (counts[l.status] ?? 0) + 1;
    }
    return counts;
  });
}

/** Fetch a single LibraryEntry by igdbId. */
export function useGame(igdbId: number) {
  return useLiveQuery(async () => {
    const [game, log] = await Promise.all([
      db.games.get(igdbId),
      db.logs.get(igdbId),
    ]);
    if (!game || !log) return null;
    return { game, log } as LibraryEntry;
  }, [igdbId]);
}
