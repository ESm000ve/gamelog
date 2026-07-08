/**
 * IGDB service — stub implementation.
 *
 * All functions return typed mock data so the UI can be built and tested
 * before real IGDB credentials are available.
 *
 * To connect to real IGDB:
 *  1. Create a Twitch developer app at https://dev.twitch.tv
 *  2. Copy `.env.example` → `.env` and fill in VITE_IGDB_CLIENT_ID /
 *     VITE_IGDB_CLIENT_SECRET
 *  3. Replace the stub bodies below with real fetch() calls through the
 *     Vite API proxy defined in vite.config.ts (/api/igdb → api.igdb.com)
 *
 * The interface is intentionally narrow — callers never need to change.
 */

import type { Game, TimeToBeat, IgdbSearchResult } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IgdbGame {
  igdbId:      number;
  title:       string;
  slug:        string;
  developer:   string;
  publisher?:  string;
  releaseYear: number;
  firstReleaseDate?: number;
  summary?:    string;
  genres:      string[];
  platforms:   string[];
  coverUrl?:   string;
  timeToBeat?: TimeToBeat;
  igdbRating?: number;
}

// ─── Cover URL helper ─────────────────────────────────────────────────────────

export function igdbCoverUrl(imageId: string, size = "cover_big"): string {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

// ─── Stub implementations ─────────────────────────────────────────────────────

const STUB_RESULTS: IgdbGame[] = [
  {
    igdbId: 1020,
    title: "Elden Ring",
    slug: "elden-ring",
    developer: "FromSoftware",
    releaseYear: 2022,
    genres: ["Role-playing (RPG)", "Adventure"],
    platforms: ["PC", "PlayStation 5", "Xbox Series X|S"],
    summary: "A vast open-world action RPG set in the Lands Between.",
    igdbRating: 96,
  },
  {
    igdbId: 1021,
    title: "Hades",
    slug: "hades",
    developer: "Supergiant Games",
    releaseYear: 2020,
    genres: ["Hack and slash/Beat 'em up", "Role-playing (RPG)"],
    platforms: ["PC", "Nintendo Switch", "PlayStation 5"],
    summary: "Defy the god of the dead as Zagreus.",
    igdbRating: 93,
  },
  {
    igdbId: 1022,
    title: "Celeste",
    slug: "celeste",
    developer: "Maddy Thorson & Noel Berry",
    releaseYear: 2018,
    genres: ["Platform", "Indie"],
    platforms: ["PC", "Nintendo Switch", "PlayStation 4"],
    summary: "A precision platformer about climbing a mountain.",
    igdbRating: 92,
  },
  {
    igdbId: 1023,
    title: "Hollow Knight",
    slug: "hollow-knight",
    developer: "Team Cherry",
    releaseYear: 2017,
    genres: ["Platform", "Adventure", "Indie"],
    platforms: ["PC", "Nintendo Switch", "PlayStation 4"],
    summary: "A hand-drawn metroidvania in a ruined underground kingdom.",
    igdbRating: 88,
  },
  {
    igdbId: 1024,
    title: "Baldur's Gate 3",
    slug: "baldurs-gate-3",
    developer: "Larian Studios",
    releaseYear: 2023,
    genres: ["Role-playing (RPG)", "Strategy", "Adventure"],
    platforms: ["PC", "PlayStation 5"],
    summary: "A sprawling D&D RPG set in the Forgotten Realms.",
    igdbRating: 97,
  },
  {
    igdbId: 1025,
    title: "Disco Elysium",
    slug: "disco-elysium",
    developer: "ZA/UM",
    releaseYear: 2019,
    genres: ["Role-playing (RPG)", "Adventure", "Indie"],
    platforms: ["PC", "PlayStation 5"],
    summary: "A groundbreaking RPG where you play a detective with amnesia.",
    igdbRating: 91,
  },
];

/**
 * Search IGDB for games matching a query string.
 * Returns a subset of results suitable for the "Add game" modal.
 */
export async function searchGames(query: string): Promise<IgdbGame[]> {
  // Stub: filter the local array
  await new Promise((r) => setTimeout(r, 200)); // simulate latency
  const q = query.toLowerCase();
  return STUB_RESULTS.filter(
    (g) =>
      g.title.toLowerCase().includes(q) ||
      g.developer.toLowerCase().includes(q)
  ).slice(0, 8);
}

/**
 * Fetch full game metadata from IGDB by ID.
 */
export async function getGame(igdbId: number): Promise<IgdbGame | null> {
  await new Promise((r) => setTimeout(r, 150));
  return STUB_RESULTS.find((g) => g.igdbId === igdbId) ?? null;
}

/**
 * Normalise a raw IGDB search result into our IgdbGame shape.
 * Used when the real API is connected.
 */
export function normaliseIgdbResult(raw: IgdbSearchResult): IgdbGame {
  const developer =
    raw.involved_companies?.find((ic) => ic.developer)?.company.name ??
    "Unknown";
  const publisher =
    raw.involved_companies?.find((ic) => ic.publisher)?.company.name;
  const releaseYear = raw.first_release_date
    ? new Date(raw.first_release_date * 1000).getFullYear()
    : 0;

  return {
    igdbId:      raw.id,
    title:       raw.name,
    slug:        raw.slug,
    developer,
    publisher,
    releaseYear,
    firstReleaseDate: raw.first_release_date,
    summary:     raw.summary,
    genres:      raw.genres?.map((g) => g.name) ?? [],
    platforms:   raw.platforms?.map((p) => p.name) ?? [],
    coverUrl:    raw.cover ? igdbCoverUrl(raw.cover.image_id) : undefined,
  };
}

/**
 * Convert an IgdbGame into the Game shape ready for Dexie insertion.
 */
export function igdbGameToGame(igdb: IgdbGame): Omit<Game, "addedAt" | "updatedAt"> {
  return {
    igdbId:      igdb.igdbId,
    title:       igdb.title,
    slug:        igdb.slug,
    developer:   igdb.developer,
    publisher:   igdb.publisher,
    releaseYear: igdb.releaseYear,
    summary:     igdb.summary,
    genres:      igdb.genres,
    platforms:   igdb.platforms,
    coverUrl:    igdb.coverUrl,
    igdbRating:  igdb.igdbRating,
  };
}
