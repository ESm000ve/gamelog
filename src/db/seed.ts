/**
 * Seed data — converted from the Figma Make prototype's mock games.
 * Call seedIfEmpty() once at app startup; it no-ops if data already exists.
 * Remove or comment out after real IGDB integration is wired up.
 */

import { db } from "./index";
import type { Game, Log, Completion } from "../types";

const DAY = 86_400_000;
const NOW = Date.now();

// Helper: convert "Feb 28, 2026" → "2026-02-28"
function toISO(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toISOString().slice(0, 10);
}

// Helper: convert "120h" → 120, "47h" → 47
function parseHours(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const n = parseInt(s);
  return isNaN(n) ? undefined : n;
}

// addedAt was index 1–16 in prototype (16 = most recent).
// Map to real timestamps spaced 1 day apart.
function addedAt(index: number): number {
  return NOW - (16 - index) * DAY;
}

const SEED_GAMES: Game[] = [
  {
    igdbId: 1, title: "Elden Ring", slug: "elden-ring",
    developer: "FromSoftware", releaseYear: 2022,
    summary: "A vast open-world action RPG set in the Lands Between — FromSoftware's most ambitious work yet.",
    genres: ["Action RPG", "Soulslike", "Open World"],
    platforms: ["PC", "PS5", "Xbox Series X|S"],
    coverColor: "#2a1f2e",
    timeToBeat: { average: 56, finish: 78, master: 133 },
    addedAt: addedAt(16), updatedAt: addedAt(16),
  },
  {
    igdbId: 2, title: "Hades", slug: "hades",
    developer: "Supergiant Games", releaseYear: 2020,
    summary: "Defy the god of the dead as Zagreus, battling through an ever-changing labyrinth.",
    genres: ["Roguelike", "Action", "Indie"],
    platforms: ["PC", "Switch", "PS5", "Xbox Series X|S"],
    coverColor: "#1e2535",
    timeToBeat: { average: 8, finish: 13, master: 97 },
    addedAt: addedAt(15), updatedAt: addedAt(15),
  },
  {
    igdbId: 3, title: "Disco Elysium", slug: "disco-elysium",
    developer: "ZA/UM", releaseYear: 2019,
    summary: "A groundbreaking RPG where you play a detective with amnesia solving a murder.",
    genres: ["RPG", "Detective", "Indie"],
    platforms: ["PC", "PS5", "Xbox Series X|S"],
    coverColor: "#1a2a22",
    timeToBeat: { average: 22, finish: 30, master: 52 },
    addedAt: addedAt(14), updatedAt: addedAt(14),
  },
  {
    igdbId: 4, title: "Baldur's Gate 3", slug: "baldurs-gate-3",
    developer: "Larian Studios", releaseYear: 2023,
    summary: "A sprawling D&D RPG set in the Forgotten Realms.",
    genres: ["RPG", "Turn-Based", "Fantasy"],
    platforms: ["PC", "PS5"],
    coverColor: "#221a2f",
    timeToBeat: { average: 87, finish: 107, master: 194 },
    addedAt: addedAt(13), updatedAt: addedAt(13),
  },
  {
    igdbId: 5, title: "Hollow Knight", slug: "hollow-knight",
    developer: "Team Cherry", releaseYear: 2017,
    summary: "A sprawling hand-drawn metroidvania set in a ruined underground kingdom.",
    genres: ["Metroidvania", "Action", "Indie"],
    platforms: ["PC", "Switch", "PS4"],
    coverColor: "#1c2230",
    timeToBeat: { average: 23, finish: 39, master: 68 },
    addedAt: addedAt(12), updatedAt: addedAt(12),
  },
  {
    igdbId: 6, title: "Outer Wilds", slug: "outer-wilds",
    developer: "Mobius Digital", releaseYear: 2019,
    summary: "An exploration game set in a handcrafted solar system stuck in a 22-minute time loop.",
    genres: ["Adventure", "Exploration", "Mystery"],
    platforms: ["PC", "PS4", "Xbox One"],
    coverColor: "#29231a",
    timeToBeat: { average: 14, finish: 17, master: 26 },
    addedAt: addedAt(11), updatedAt: addedAt(11),
  },
  {
    igdbId: 7, title: "Celeste", slug: "celeste",
    developer: "Maddy Thorson & Noel Berry", releaseYear: 2018,
    summary: "A precision platformer about climbing a mountain and confronting anxiety.",
    genres: ["Platformer", "Indie"],
    platforms: ["PC", "Switch", "PS4", "Xbox One"],
    coverColor: "#1e1a2e",
    timeToBeat: { average: 9, finish: 13, master: 42 },
    addedAt: addedAt(10), updatedAt: addedAt(10),
  },
  {
    igdbId: 8, title: "Tunic", slug: "tunic",
    developer: "Andrew Shouldice", releaseYear: 2022,
    summary: "A fox explores a mysterious world armed with an in-game instruction manual in an invented language.",
    genres: ["Action Adventure", "Puzzle", "Indie"],
    platforms: ["PC", "Xbox Series X|S", "PS5", "Switch"],
    coverColor: "#162520",
    timeToBeat: { average: 12, finish: 16, master: 29 },
    addedAt: addedAt(9), updatedAt: addedAt(9),
  },
  {
    igdbId: 9, title: "Hades II", slug: "hades-ii",
    developer: "Supergiant Games", releaseYear: 2024,
    summary: "Melinoë, princess of the Underworld, fights toward Chronos through new biomes.",
    genres: ["Roguelike", "Action", "Indie"],
    platforms: ["PC"],
    coverColor: "#27182a",
    timeToBeat: { average: 11, finish: 18 },
    addedAt: addedAt(8), updatedAt: addedAt(8),
  },
  {
    igdbId: 10, title: "Stardew Valley", slug: "stardew-valley",
    developer: "ConcernedApe", releaseYear: 2016,
    summary: "Leave the corporate grind for your grandfather's farm in Pelican Town.",
    genres: ["Farming Sim", "RPG", "Indie"],
    platforms: ["PC", "Switch", "PS4", "Xbox One", "Mobile"],
    coverColor: "#1e2b1a",
    timeToBeat: { average: 52, finish: 76, master: 304 },
    addedAt: addedAt(6), updatedAt: addedAt(6),
  },
  {
    igdbId: 11, title: "Cyberpunk 2077", slug: "cyberpunk-2077",
    developer: "CD Projekt Red", releaseYear: 2020,
    summary: "An open-world RPG set in Night City. The 2.0 overhaul transformed it.",
    genres: ["Action RPG", "Open World", "Sci-Fi"],
    platforms: ["PC", "PS5", "Xbox Series X|S"],
    coverColor: "#261e14",
    timeToBeat: { average: 26, finish: 48, master: 103 },
    addedAt: addedAt(5), updatedAt: addedAt(5),
  },
  {
    igdbId: 12, title: "Return of the Obra Dinn", slug: "return-of-the-obra-dinn",
    developer: "Lucas Pope", releaseYear: 2018,
    summary: "An insurance investigator boards a ghost ship to determine the fate of its crew.",
    genres: ["Puzzle", "Mystery", "Indie"],
    platforms: ["PC", "Switch", "PS4", "Xbox One"],
    coverColor: "#1a1e26",
    timeToBeat: { average: 10, finish: 11, master: 14 },
    addedAt: addedAt(4), updatedAt: addedAt(4),
  },
  {
    igdbId: 13, title: "Pentiment", slug: "pentiment",
    developer: "Obsidian Entertainment", releaseYear: 2022,
    summary: "Set in a 16th-century Bavarian monastery — a murder spanning decades.",
    genres: ["Narrative RPG", "Historical", "Mystery"],
    platforms: ["PC", "Xbox Series X|S"],
    coverColor: "#271e16",
    timeToBeat: { average: 14, finish: 16, master: 18 },
    addedAt: addedAt(3), updatedAt: addedAt(3),
  },
  {
    igdbId: 14, title: "Inscryption", slug: "inscryption",
    developer: "Daniel Mullins Games", releaseYear: 2021,
    summary: "A darkly comic deckbuilding roguelike that isn't what it appears to be.",
    genres: ["Roguelike", "Deckbuilder", "Horror"],
    platforms: ["PC"],
    coverColor: "#1a2120",
    timeToBeat: { average: 10, finish: 12, master: 28 },
    addedAt: addedAt(2), updatedAt: addedAt(2),
  },
  {
    igdbId: 15, title: "Sea of Stars", slug: "sea-of-stars",
    developer: "Sabotage Studio", releaseYear: 2023,
    summary: "A turn-based RPG built as a love letter to the 16-bit era.",
    genres: ["RPG", "Turn-Based", "Retro"],
    platforms: ["PC", "Switch", "PS5", "Xbox Series X|S"],
    coverColor: "#141e2a",
    timeToBeat: { average: 28, finish: 30, master: 54 },
    addedAt: addedAt(1), updatedAt: addedAt(1),
  },
];

function makeLog(
  igdbId: number,
  status: "Playing" | "Backlog" | "Played" | "Wishlist",
  opts?: {
    completion?:  Completion;
    rating?:      number;
    platform?:    string;
    timePlayed?:  string;
    startedAt?:   string;
    finishedAt?:  string;
    ownership?:   "Physical" | "Digital" | "Subscription" | "Borrowed" | ("Physical" | "Digital" | "Subscription" | "Borrowed")[];
    notes?:       string;
  }
): Log {
  const now = Date.now();
  return {
    igdbId,
    status,
    completion:  opts?.completion,
    rating:      opts?.rating,
    platform:    opts?.platform,
    timePlayed:  parseHours(opts?.timePlayed),
    startedAt:   opts?.startedAt ? toISO(opts.startedAt) : undefined,
    finishedAt:  opts?.finishedAt ? toISO(opts.finishedAt) : undefined,
    ownership:   opts?.ownership ? (Array.isArray(opts.ownership) ? opts.ownership : [opts.ownership]) : undefined,
    notes:       opts?.notes,
    createdAt:   now,
    updatedAt:   now,
  };
}

const SEED_LOGS: Log[] = [
  makeLog(1, "Played", {
    completion: "Completed", rating: 5.0, platform: "PC",
    timePlayed: "120h", startedAt: "Feb 28, 2026", finishedAt: "May 12, 2026",
    ownership: "Digital",
    notes: "Finally got around to it. The open world removes the friction I always bounced off in previous FromSoft games — being able to go somewhere else when a boss wrecked me kept me moving forward. Malenia took three evenings. Worth every second.",
  }),
  makeLog(2, "Played", {
    completion: "Completed", rating: 4.5, platform: "PC",
    timePlayed: "47h", startedAt: "Mar 2, 2026", finishedAt: "Apr 18, 2026",
    ownership: "Digital",
    notes: "Picked this up on a whim during a sale and did not expect to lose three weeks to it. The loop is basically perfect — every failed run still moves something forward.",
  }),
  makeLog(3, "Playing", {
    platform: "PC", timePlayed: "32h", startedAt: "Jan 10, 2026",
    notes: "Halfway through and already certain this is something special. The skill system as character psychology is unlike anything else.",
  }),
  makeLog(4, "Playing", {
    platform: "PC", timePlayed: "60h", startedAt: "Nov 5, 2025",
    notes: "Act 2 is phenomenal. Party banter on long rests is some of the best character writing in games.",
  }),
  makeLog(5, "Backlog"),
  makeLog(6, "Backlog"),
  makeLog(7, "Played", {
    completion: "Mastered", rating: 5.0, platform: "Switch",
    timePlayed: "28h", startedAt: "Sep 1, 2025", finishedAt: "Sep 22, 2025",
    notes: "The B-side levels are among the most satisfying hard content I've played. Chapter 9 felt impossible until it suddenly wasn't.",
  }),
  makeLog(8, "Wishlist"),
  makeLog(9, "Playing", {
    platform: "PC", timePlayed: "18h", startedAt: "Apr 20, 2026",
    notes: "Early Access but incredibly polished. The new weapon movesets feel distinct in a way the first game's didn't always manage.",
  }),
  makeLog(10, "Played", {
    completion: "Completed", rating: 4.0, platform: "PC",
    timePlayed: "200h", startedAt: "Mar 15, 2025", finishedAt: "Oct 2, 2025",
    ownership: "Digital",
    notes: "Lost count of how many evenings disappeared into this. The multiplayer co-op farm with a friend was a highlight of last year.",
  }),
  makeLog(11, "Played", {
    completion: "Completed", rating: 3.5, platform: "PC",
    timePlayed: "65h", startedAt: "Dec 1, 2025", finishedAt: "Feb 14, 2026",
    notes: "Came back after the 2.0 patch and finally got what the hype was about. The last act hit hard. City design is still the best in the genre.",
  }),
  makeLog(12, "Played", {
    completion: "Completed", rating: 4.5, platform: "PC",
    timePlayed: "12h", startedAt: "Oct 10, 2025", finishedAt: "Oct 17, 2025",
    notes: "Solved it in a week of evenings. The moment the last cluster of fates clicked into place was one of the best feelings a game has given me.",
  }),
  makeLog(13, "Wishlist"),
  makeLog(14, "Backlog"),
  makeLog(15, "Backlog"),
];

/** Seed the database with prototype data — no-op if games already exist. */
export async function seedIfEmpty(): Promise<void> {
  const count = await db.games.count();
  if (count > 0) return;

  await db.transaction("rw", [db.games, db.logs], async () => {
    await db.games.bulkPut(SEED_GAMES);
    await db.logs.bulkPut(SEED_LOGS);
  });

  console.info(`[gamelog] Seeded ${SEED_GAMES.length} games.`);
}
