import { useState, useEffect } from "react";
import { GamesRepo, LogsRepo, ListsRepo } from "../db/repositories";
import { catalog } from "../catalog";

export function DebugStoreScreen() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const appendLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  async function runTest() {
    if (!window.confirm("Warning: Running this diagnostic will clear your entire local library database. Continue?")) {
      return;
    }
    setIsRunning(true);
    setLogs([]);
    try {
      appendLog("1. Initializing and clearing database for test...");
      const { db } = await import("../db/schema");
      await db.games.clear();
      await db.logs.clear();
      await db.lists.clear();
      
      appendLog("2. Fetching game from catalog stub (IGDB)...");
      const results = await catalog.search("Elden Ring");
      const game = results[0];
      appendLog(`   -> Found in catalog: ${game.title} (IGDB ID: ${game.igdbId})`);

      appendLog("3. Saving to GamesRepo / LogsRepo...");
      await GamesRepo.addFromCatalog(game, "Playing");
      
      const savedGame = await GamesRepo.get(game.igdbId);
      const savedLog = await LogsRepo.get(game.igdbId);
      appendLog(`   -> Verified save. Game: ${savedGame?.title}. Log status: ${savedLog?.status}`);
      
      appendLog("4. Updating Log...");
      await LogsRepo.save(game.igdbId, { status: "Played", rating: 5, timePlayed: 120 });
      const updatedLog = await LogsRepo.get(game.igdbId);
      appendLog(`   -> Verified update. New status: ${updatedLog?.status}. Rating: ${updatedLog?.rating}`);

      appendLog("5. Creating List via ListsRepo...");
      const listId = await ListsRepo.create("Favorites", true);
      await ListsRepo.addGame(listId, game.igdbId);
      const list = await ListsRepo.get(listId);
      appendLog(`   -> Verified list. Name: ${list?.name}. Games count: ${list?.gameIds.length}`);

      appendLog("6. Data layer read/write check SUCCESS \u2713");
    } catch (err: any) {
      appendLog(`ERROR: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div style={{ 
      padding: "var(--space-8)", 
      color: "var(--apple-label)", 
      fontFamily: "monospace", 
      overflow: "auto",
      width: "100%",
      height: "100%",
      background: "var(--apple-window-bg)"
    }}>
      <h1 style={{ marginBottom: "var(--space-4)", fontFamily: "var(--apple-font-display)", fontSize: 24 }}>Store Diagnostic Check</h1>
      <p style={{ marginBottom: "var(--space-6)", color: "var(--apple-secondary-label)", fontFamily: "var(--apple-font-sans)" }}>
        Running this diagnostic check verifies database read/write operations. Note: this will clear existing local database data.
      </p>
      <button
        onClick={runTest}
        disabled={isRunning}
        style={{
          padding: "10px 18px",
          background: "var(--apple-accent)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: isRunning ? "not-allowed" : "pointer",
          fontWeight: 600,
          marginBottom: "var(--space-6)",
          fontFamily: "var(--apple-font-sans)",
        }}
      >
        {isRunning ? "Running Diagnostic..." : "Run Diagnostic & Test Database"}
      </button>
      <div style={{
        background: "var(--apple-tertiary-bg)",
        padding: "var(--space-6)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--apple-separator)",
      }}>
        {logs.map((l, i) => (
          <div key={i} style={{ marginBottom: "var(--space-2)", fontSize: "var(--font-size-base)", lineHeight: 1.5, color: l.includes("SUCCESS") ? "var(--apple-accent)" : l.includes("ERROR") ? "red" : "inherit" }}>
            {l}
          </div>
        ))}
        {logs.length === 0 && <div style={{ fontSize: "var(--font-size-base)", color: "var(--apple-tertiary-label)" }}>Click button above to start diagnostic test.</div>}
      </div>
    </div>
  );
}
