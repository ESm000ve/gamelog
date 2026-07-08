import { db } from "../db/schema";
import { catalog } from "../catalog";
import type { Game, Log, UserList } from "../types";

export interface BackupData {
  version: 1;
  games: { igdbId: number; addedAt: number; updatedAt: number }[];
  logs: Log[];
  lists: UserList[];
}

export async function exportData(): Promise<void> {
  const games = await db.games.toArray();
  const logs = await db.logs.toArray();
  const lists = await db.lists.toArray();

  const data: BackupData = {
    version: 1,
    games: games.map(g => ({
      igdbId: g.igdbId,
      addedAt: g.addedAt,
      updatedAt: g.updatedAt,
    })),
    logs,
    lists,
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `gamelog-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importData(
  jsonString: string,
  mode: "merge" | "replace",
  onProgress: (pct: number, message: string) => void
): Promise<void> {
  const data = JSON.parse(jsonString) as BackupData;
  if (!data.version || !data.games || !data.logs || !data.lists) {
    throw new Error("Invalid backup file format");
  }

  // Re-fetch catalog data for each game
  const fullGames: Game[] = [];
  let fetchedCount = 0;
  for (const minGame of data.games) {
    onProgress(
      Math.round((fetchedCount / data.games.length) * 100),
      `Fetching catalog data... (${fetchedCount + 1}/${data.games.length})`
    );
    const catalogGame = await catalog.fetch(minGame.igdbId);
    if (catalogGame) {
      fullGames.push({
        ...catalogGame,
        addedAt: minGame.addedAt,
        updatedAt: minGame.updatedAt,
      });
    }
    fetchedCount++;
  }

  onProgress(100, "Writing to database...");

  await db.transaction("rw", [db.games, db.logs, db.lists], async () => {
    if (mode === "replace") {
      await db.games.clear();
      await db.logs.clear();
      await db.lists.clear();
    }
    
    // Merge logic: dexie .put() acts as an upsert (replace if exists, insert if new)
    // For lists, we'll just put them too. If they already exist, they are overwritten.
    await db.games.bulkPut(fullGames);
    await db.logs.bulkPut(data.logs);
    await db.lists.bulkPut(data.lists);
  });
}
