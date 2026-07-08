import { useMemo } from "react";
import type { Log } from "../../types";

interface HabitsChartProps {
  logs: Log[];
}

export function HabitsChart({ logs }: HabitsChartProps) {
  const { maxStreak, currentStreak, heatmapData } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const playDays = new Set<string>();
    for (const log of logs) {
      if (log.playSessions) {
        for (const session of log.playSessions) {
          playDays.add(session.date);
        }
      }
    }

    const sortedDays = Array.from(playDays).sort();
    
    let max = 0;
    let curr = 0;
    let lastDate: Date | null = null;
    
    // Simple streak calculation
    for (const ds of sortedDays) {
      const d = new Date(ds);
      d.setHours(0,0,0,0);
      if (!lastDate) {
        curr = 1;
      } else {
        const diffDays = (d.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays === 1) {
          curr++;
        } else if (diffDays > 1) {
          curr = 1;
        }
      }
      if (curr > max) max = curr;
      lastDate = d;
    }

    // Check if current streak is still alive (played today or yesterday)
    let currentAlive = 0;
    if (lastDate) {
      const diffDays = (today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays <= 1) {
        currentAlive = curr;
      }
    }

    // Generate last 365 days for heatmap
    const heatmap = [];
    const oneDay = 1000 * 3600 * 24;
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today.getTime() - i * oneDay);
      const ds = d.toISOString().split("T")[0];
      heatmap.push({ date: ds, played: playDays.has(ds) });
    }

    return { maxStreak: max, currentStreak: currentAlive, heatmapData: heatmap };
  }, [logs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 24, paddingBottom: "var(--space-4)", borderBottom: "1px solid var(--apple-separator)" }}>
        <div>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-tertiary-label)", fontWeight: 500, textTransform: "uppercase" }}>Current Streak</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: "var(--apple-label)", fontFamily: "var(--apple-font-display)" }}>{currentStreak} <span style={{ fontSize: "var(--font-size-lg)", fontWeight: 500, color: "var(--apple-secondary-label)" }}>days</span></p>
        </div>
        <div>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-tertiary-label)", fontWeight: 500, textTransform: "uppercase" }}>Longest Streak</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: "var(--apple-label)", fontFamily: "var(--apple-font-display)" }}>{maxStreak} <span style={{ fontSize: "var(--font-size-lg)", fontWeight: 500, color: "var(--apple-secondary-label)" }}>days</span></p>
        </div>
      </div>
      
      <div>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-tertiary-label)", marginBottom: "var(--space-2)"}}>Play Activity (Last 365 Days)</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(52, 1fr)", gap: 4 }}>
          {Array.from({ length: 52 }).map((_, colIdx) => (
            <div key={colIdx} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {Array.from({ length: 7 }).map((_, rowIdx) => {
                const dayIdx = colIdx * 7 + rowIdx;
                if (dayIdx >= heatmapData.length) return <div key={rowIdx} />;
                const data = heatmapData[dayIdx];
                return (
                  <div
                    key={rowIdx}
                    title={data.date}
                    style={{
                      width: "100%",
                      aspectRatio: "1/1",
                      borderRadius: 2,
                      background: data.played ? "var(--apple-accent)" : "var(--apple-fill)",
                      opacity: data.played ? 1 : 0.5,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
