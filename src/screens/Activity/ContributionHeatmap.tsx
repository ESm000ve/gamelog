import { useMemo, useState } from "react";
import type { Log } from "../../types";
import { Calendar, Zap, Flame, CheckCircle2 } from "lucide-react";

interface ContributionHeatmapProps {
  logs: Log[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

interface DayCell {
  dateStr: string;
  displayDate: string;
  count: number;
  level: number; // 0 to 4
}

export function ContributionHeatmap({ logs, selectedDate, onSelectDate }: ContributionHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<DayCell | null>(null);

  // Build the heatmap grid and metrics
  const { weeks, totalActiveDays, maxStreak, totalActivities } = useMemo(() => {
    const activityMap = new Map<string, number>();
    let totalAct = 0;

    logs.forEach((log) => {
      // Sessions
      if (log.playSessions) {
        log.playSessions.forEach((s) => {
          if (s.date) {
            activityMap.set(s.date, (activityMap.get(s.date) || 0) + 1);
            totalAct++;
          }
        });
      }
      // Dates
      if (log.startedAt) {
        activityMap.set(log.startedAt, (activityMap.get(log.startedAt) || 0) + 1);
        totalAct++;
      }
      if (log.finishedAt) {
        activityMap.set(log.finishedAt, (activityMap.get(log.finishedAt) || 0) + 1);
        totalAct++;
      }
      if (log.updatedAt) {
        const d = new Date(log.updatedAt);
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        activityMap.set(ds, (activityMap.get(ds) || 0) + 1);
        totalAct++;
      }
    });

    const today = new Date();
    const weeksArr: DayCell[][] = [];
    
    // We want 52 weeks (364 days ending today or this week)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    // Adjust to Sunday of that week
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentStreak = 0;
    let bestStreak = 0;
    let activeCount = 0;

    const curr = new Date(startDate);
    const endToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    for (let w = 0; w < 52; w++) {
      const week: DayCell[] = [];
      for (let d = 0; d < 7; d++) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, "0");
        const day = String(curr.getDate()).padStart(2, "0");
        const ds = `${y}-${m}-${day}`;

        const count = activityMap.get(ds) || 0;
        let level = 0;
        if (count === 1) level = 1;
        else if (count === 2) level = 2;
        else if (count === 3) level = 3;
        else if (count >= 4) level = 4;

        // Calculate streaks up to today
        if (curr.getTime() <= endToday) {
          if (count > 0) {
            activeCount++;
            currentStreak++;
            if (currentStreak > bestStreak) bestStreak = currentStreak;
          } else {
            currentStreak = 0;
          }
        }

        const displayDate = curr.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        week.push({ dateStr: ds, displayDate, count, level });
        curr.setDate(curr.getDate() + 1);
      }
      weeksArr.push(week);
    }

    return {
      weeks: weeksArr,
      totalActiveDays: activeCount,
      maxStreak: bestStreak,
      totalActivities: totalAct,
    };
  }, [logs]);

  const getCellColor = (level: number, isSelected: boolean) => {
    if (isSelected) return "var(--apple-white)";
    switch (level) {
      case 1: return "rgba(48, 209, 88, 0.25)";
      case 2: return "rgba(48, 209, 88, 0.5)";
      case 3: return "rgba(48, 209, 88, 0.75)";
      case 4: return "var(--apple-accent)";
      default: return "var(--apple-tertiary-bg)";
    }
  };

  return (
    <div
      style={{
        background: "var(--apple-card-bg)",
        border: "1px solid var(--apple-separator)",
        borderRadius: 16,
        padding: "var(--space-6)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Header Stats */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--apple-label)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={18} color="var(--apple-accent)" />
            Play Activity Heatmap
          </h3>
          <p style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)", margin: "var(--space-1) 0 0 0" }}>
            Click any square to filter your play journal by date
          </p>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(48, 209, 88, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Flame size={18} color="var(--apple-accent)" />
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--apple-label)" }}>{maxStreak} days</div>
              <div style={{ fontSize: 11, color: "var(--apple-secondary-label)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Best Streak</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(10, 132, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={18} color="var(--apple-blue)" />
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--apple-label)" }}>{totalActiveDays} days</div>
              <div style={{ fontSize: 11, color: "var(--apple-secondary-label)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active This Year</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--apple-orange-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={18} color="var(--apple-orange)" />
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--apple-label)" }}>{totalActivities}</div>
              <div style={{ fontSize: 11, color: "var(--apple-secondary-label)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div style={{ overflowX: "auto", paddingBottom: "var(--space-2)"}}>
        <div style={{ display: "flex", gap: 3, minWidth: "fit-content" }}>
          {weeks.map((week, wIdx) => (
            <div key={wIdx} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {week.map((cell) => {
                const isSelected = selectedDate === cell.dateStr;
                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => onSelectDate(isSelected ? null : cell.dateStr)}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    aria-label={`${cell.count} activities on ${cell.displayDate}`}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: getCellColor(cell.level, isSelected),
                      border: isSelected ? "2px solid #000" : "1px solid rgba(255,255,255,0.05)",
                      padding: 0,
                      cursor: "pointer",
                      transition: "transform 100ms ease, background 150ms ease",
                      transform: isSelected ? "scale(1.2)" : "scale(1)",
                      boxShadow: isSelected ? "0 0 8px var(--apple-accent)" : "none",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Legend & Tooltip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--font-size-sm)", color: "var(--apple-secondary-label)" }}>
        <div>
          {selectedDate ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--apple-tertiary-bg)", padding: "var(--space-1) 10px", borderRadius: 12, color: "var(--apple-label)" }}>
              Filtering by: <strong>{selectedDate}</strong>
              <button
                type="button"
                onClick={() => onSelectDate(null)}
                style={{ background: "transparent", border: "none", color: "var(--apple-secondary-label)", cursor: "pointer", padding: 0, marginLeft: "var(--space-1)"}}
              >
                ✕
              </button>
            </span>
          ) : hoveredCell ? (
            <span>
              <strong>{hoveredCell.count}</strong> {hoveredCell.count === 1 ? "activity" : "activities"} on <strong>{hoveredCell.displayDate}</strong>
            </span>
          ) : (
            <span>Hover over a square for details</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>Less</span>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--apple-tertiary-bg)" }} />
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(48, 209, 88, 0.25)" }} />
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(48, 209, 88, 0.5)" }} />
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(48, 209, 88, 0.75)" }} />
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--apple-accent)" }} />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
