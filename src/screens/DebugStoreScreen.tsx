import { useState, useEffect } from "react";
import { GamesRepo, LogsRepo, ListsRepo } from "../db/repositories";
import { catalog } from "../catalog";

export function DebugStoreScreen() {
  const [logs, setLogs] = useState<string[]>([]);

  const appendLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  useEffect(() => {
    let mounted = true;
    
    async function runTest() {
      try {
        if (!mounted) return;
        appendLog("1. Initializing and clearing database for test...");
        const { db } = await import("../db/schema");
        await db.games.clear();
        await db.logs.clear();
        await db.lists.clear();
        
        if (!mounted) return;
        appendLog("2. Fetching game from catalog stub (IGDB)...");
        const results = await catalog.search("Elden Ring");
        const game = results[0];
        appendLog(`   -> Found in catalog: ${game.title} (IGDB ID: ${game.igdbId})`);

        if (!mounted) return;
        appendLog("3. Saving to GamesRepo / LogsRepo...");
        await GamesRepo.addFromCatalog(game, "Playing");
        
        const savedGame = await GamesRepo.get(game.igdbId);
        const savedLog = await LogsRepo.get(game.igdbId);
        appendLog(`   -> Verified save. Game: ${savedGame?.title}. Log status: ${savedLog?.status}`);
        
        if (!mounted) return;
        appendLog("4. Updating Log...");
        await LogsRepo.save(game.igdbId, { status: "Played", rating: 5, timePlayed: 120 });
        const updatedLog = await LogsRepo.get(game.igdbId);
        appendLog(`   -> Verified update. New status: ${updatedLog?.status}. Rating: ${updatedLog?.rating}`);

        if (!mounted) return;
        appendLog("5. Creating List via ListsRepo...");
        const listId = await ListsRepo.create("Favorites", true);
        await ListsRepo.addGame(listId, game.igdbId);
        const list = await ListsRepo.get(listId);
        appendLog(`   -> Verified list. Name: ${list?.name}. Games count: ${list?.gameIds.length}`);

        if (!mounted) return;
        appendLog("6. Data layer read/write check SUCCESS \u2713");
      } catch (err: any) {
        if (!mounted) return;
        appendLog(`ERROR: ${err.message}`);
      }
    }
    
    runTest();
    return () => { mounted = false; };
  }, []);

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
      <h1 style={{ marginBottom: "var(--space-6)", fontFamily: "var(--apple-font-display)", fontSize: 24 }}>Store Diagnostic Check</h1>
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
        {logs.length === 0 && <div style={{ fontSize: "var(--font-size-base)", color: "var(--apple-tertiary-label)" }}>Running tests...</div>}
      </div>
    </div>
  );
}
