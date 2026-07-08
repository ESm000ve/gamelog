import { db } from "../schema";
import type { Game, Log, Status } from "../../types";
import type { CatalogGame } from "../../catalog";
import { embed } from "../../services/ai";

export const GamesRepo = {
  /**
   * Adds a game from the catalog into the local library, creating its initial log.
   * Executed in a single transaction.
   */
  async addFromCatalog(catalogGame: CatalogGame, initialStatus: Status = "Backlog"): Promise<void> {
    const now = Date.now();
    const game: Game = {
      ...catalogGame,
      addedAt: now,
      updatedAt: now,
    };
    const log: Log = {
      igdbId: game.igdbId,
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
    };
    await db.transaction("rw", [db.games, db.logs], async () => {
      await db.games.put(game);
      await db.logs.put(log);
    });

    // Fire off embedding generation in background so UI isn't blocked
    setTimeout(async () => {
      try {
        const text = `${game.title}\nGenres: ${game.genres.join(', ')}\n${game.summary || ''}`;
        const embedding = await embed(text);
        await db.games.update(game.igdbId, { embedding });
      } catch (err) {
        console.warn(`Failed to embed ${game.title}:`, err);
      }
    }, 50);
  },

  /** 
   * Idempotently bulk imports games and logs.
   * If a log exists, its status is preserved.
   * Playtime is merged based on `overwritePlaytime`.
   */
  async bulkImport(
    gamesToImport: Game[],
    logsToImport: Log[],
    overwritePlaytime: boolean
  ): Promise<void> {
    await db.transaction("rw", [db.games, db.logs], async () => {
      // 1. Process games
      for (const game of gamesToImport) {
        const existingGame = await db.games.get(game.igdbId);
        if (!existingGame) {
          await db.games.put(game);
        } else {
          // Keep existing addedAt, update the rest
          await db.games.put({ ...game, addedAt: existingGame.addedAt });
        }
      }

      // 2. Process logs
      for (const log of logsToImport) {
        const existingLog = await db.logs.get(log.igdbId);
        if (!existingLog) {
          await db.logs.put(log);
        } else {
          const updatedLog = { ...existingLog, updatedAt: Date.now() };
          // Merge playtime
          if (log.timePlayed !== undefined && log.timePlayed > 0) {
            if (overwritePlaytime || existingLog.timePlayed === undefined || existingLog.timePlayed === 0) {
              updatedLog.timePlayed = log.timePlayed;
            }
          }
          await db.logs.put(updatedLog);
        }
      }
    });
  },

  /** Removes a game and its log from the local library, and cleans it from any lists. */
  async remove(igdbId: number): Promise<void> {
    await db.transaction("rw", [db.games, db.logs, db.lists], async () => {
      await db.games.delete(igdbId);
      await db.logs.delete(igdbId);
      
      const listsWithGame = await db.lists.filter(l => l.gameIds.includes(igdbId)).toArray();
      if (listsWithGame.length > 0) {
        for (const list of listsWithGame) {
          list.gameIds = list.gameIds.filter(id => id !== igdbId);
          list.updatedAt = Date.now();
          await db.lists.put(list);
        }
      }
    });
  },

  /** Retrieves a single game by ID. */
  async get(igdbId: number): Promise<Game | undefined> {
    return db.games.get(igdbId);
  },

  async getAll(): Promise<Game[]> {
    return db.games.toArray();
  },

  /** Backfills missing embeddings in the background */
  async backfillEmbeddings(): Promise<void> {
    const missing = await db.games.filter(g => !g.embedding).toArray();
    for (const game of missing) {
      try {
        const text = `${game.title}\nGenres: ${game.genres.join(', ')}\n${game.summary || ''}`;
        const embedding = await embed(text);
        await db.games.update(game.igdbId, { embedding });
      } catch (err) {
        console.warn(`Failed to backfill embedding for ${game.title}:`, err);
        break; // Stop backfill if API is down
      }
    }
  },

  async backfillReleaseDates(): Promise<void> {
    const missing = await db.games.filter(g => !g.firstReleaseDate).toArray();
    if (missing.length === 0) return;
    
    for (let i = 0; i < missing.length; i += 100) {
      const chunk = missing.slice(i, i + 100);
      const ids = chunk.map(g => g.igdbId).join(',');
      try {
        const res = await fetch(`/api/igdb/bulk-fetch?ids=${ids}`);
        if (!res.ok) continue;
        const data = await res.json();
        
        for (const igdbGame of data) {
          if (igdbGame.first_release_date) {
            await db.games.update(igdbGame.id, { firstReleaseDate: igdbGame.first_release_date });
          }
        }
      } catch (err) {
        console.warn('Failed to backfill release dates:', err);
      }
    }
  }
};
