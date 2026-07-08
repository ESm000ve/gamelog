import { db } from "../schema";
import type { Log, Status, Completion, Ownership } from "../../types";

export interface LogUpdate {
  status:      Status;
  completion?: Completion;
  rating?:     number;
  platform?:   string;
  platforms?:  string[];
  timePlayed?: number;
  startedAt?:  string;
  finishedAt?: string;
  ownership?:  Ownership[];
  notes?:      string;
  tagIds?:     string[];
  completionPercentage?: number;
  playSessions?: { date: string; durationMinutes?: number }[];
}

export const LogsRepo = {
  /** Save (overwrite) all editable log fields for a game. */
  async save(igdbId: number, update: LogUpdate): Promise<void> {
    await db.logs.update(igdbId, {
      ...update,
      // Clear completion if switching away from Played
      completion: update.status === "Played" ? update.completion : undefined,
      updatedAt:  Date.now(),
    });
  },

  /** Update only the status field (quick action from UI). */
  async updateStatus(igdbId: number, status: Status): Promise<void> {
    await db.logs.update(igdbId, { status, updatedAt: Date.now() });
  },

  /** Quickly log a play session for today. */
  async logSession(igdbId: number): Promise<void> {
    const log = await db.logs.get(igdbId);
    if (!log) return;
    const today = new Date().toISOString().split("T")[0];
    const sessions = log.playSessions || [];
    await db.logs.update(igdbId, {
      playSessions: [...sessions, { date: today, durationMinutes: 60 }],
      updatedAt: Date.now()
    });
  },

  /** Retrieves a log by its ID. */
  async get(igdbId: number): Promise<Log | undefined> {
    return db.logs.get(igdbId);
  },

  /** Retrieves all logs. */
  async getAll(): Promise<Log[]> {
    return db.logs.toArray();
  }
};
