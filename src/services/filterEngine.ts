import type { LibraryEntry, Status } from "../types";

export interface FilterSpec {
  status?: Status[];
  genres?: string[];
  platforms?: string[];
  releaseYear?: { min?: number; max?: number };
  timeToBeat?: { min?: number; max?: number }; // maps to game.timeToBeat.finish
  rating?: { min?: number; max?: number };
  tagIds?: string[];
}

export function filterEntries(entries: LibraryEntry[], spec: FilterSpec): LibraryEntry[] {
  return entries.filter(({ game, log }) => {
    // Status (OR logic within the facet)
    if (spec.status && spec.status.length > 0) {
      if (!spec.status.includes(log.status)) return false;
    }

    // Genres (OR logic within the facet: matches if the game has ANY of the selected genres)
    if (spec.genres && spec.genres.length > 0) {
      const hasGenre = spec.genres.some(genre => {
        const searchTerms = [genre.toLowerCase()];
        if (genre === "Sports") searchTerms.push("sport");
        if (genre === "Simulation") searchTerms.push("simulator", "sim");
        if (genre === "Platform") searchTerms.push("platformer");
        
        return game.genres.some(g => 
          searchTerms.some(term => g.toLowerCase().includes(term))
        );
      });
      if (!hasGenre) return false;
    }

    // Platforms (OR logic within the facet)
    if (spec.platforms && spec.platforms.length > 0) {
      const hasPlatform = spec.platforms.some(plat => 
        game.platforms.some(p => p.toLowerCase().includes(plat.toLowerCase()))
      );
      if (!hasPlatform) return false;
    }

    // Release Year Range
    if (spec.releaseYear) {
      if (spec.releaseYear.min !== undefined && game.releaseYear < spec.releaseYear.min) return false;
      if (spec.releaseYear.max !== undefined && game.releaseYear > spec.releaseYear.max) return false;
    }

    // Time to Beat Range
    if (spec.timeToBeat) {
      const ttb = game.timeToBeat?.finish;
      if (ttb === undefined) return false; // exclude if we don't know the length
      if (spec.timeToBeat.min !== undefined && ttb < spec.timeToBeat.min) return false;
      if (spec.timeToBeat.max !== undefined && ttb > spec.timeToBeat.max) return false;
    }

    // Rating Range
    if (spec.rating) {
      const r = log.rating;
      if (r === undefined) return false; // exclude if unrated
      if (spec.rating.min !== undefined && r < spec.rating.min) return false;
      if (spec.rating.max !== undefined && r > spec.rating.max) return false;
    }

    // Tags (AND logic within the facet: matches if the game has ALL of the selected tags)
    if (spec.tagIds && spec.tagIds.length > 0) {
      if (!log.tagIds) return false;
      const hasAllTags = spec.tagIds.every(tid => log.tagIds!.includes(tid));
      if (!hasAllTags) return false;
    }

    return true;
  });
}
