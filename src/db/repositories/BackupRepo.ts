import { db } from "../schema";
import type { Game, Log, UserList } from "../../types";

export interface BackupData {
  version:  1;
  exported: string;
  games:    Game[];
  logs:     Log[];
  lists:    UserList[];
}

export const BackupRepo = {
  /** Export all data to a JSON string. */
  async exportBackup(): Promise<string> {
    const [games, logs, lists] = await Promise.all([
      db.games.toArray(),
      db.logs.toArray(),
      db.lists.toArray(),
    ]);
    const backup: BackupData = {
      version:  1,
      exported: new Date().toISOString(),
      games,
      logs,
      lists,
    };
    return JSON.stringify(backup, null, 2);
  },

  /** Import a previously exported backup (replaces all data). */
  async importBackup(json: string): Promise<void> {
    const data = JSON.parse(json) as BackupData;
    if (data.version !== 1) throw new Error("Unsupported backup version");
    await db.transaction("rw", [db.games, db.logs, db.lists], async () => {
      await db.games.clear();
      await db.logs.clear();
      await db.lists.clear();
      await db.games.bulkPut(data.games);
      await db.logs.bulkPut(data.logs);
      await db.lists.bulkPut(data.lists);
    });
  }
};
