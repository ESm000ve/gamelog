import { useState } from "react";
import type { AchievementStatus } from "../../services/achievements";
import { 
  Trophy, CheckCircle2, Star, Award, Clock, Flame, 
  Gamepad2, Library, Sword, Compass, Monitor, Zap, Lock 
} from "lucide-react";

interface AchievementsSectionProps {
  achievements: AchievementStatus[];
}

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const [filter, setFilter] = useState<"all" | "unlocked" | "progress">("all");

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const masterPercentage = Math.round((unlockedCount / achievements.length) * 100);

  const filtered = achievements.filter((a) => {
    if (filter === "unlocked") return a.unlocked;
    if (filter === "progress") return !a.unlocked;
    return true;
  });

  const getIcon = (iconName: string, unlocked: boolean) => {
    const color = unlocked ? "var(--apple-yellow)" : "var(--apple-secondary-label)";
    const size = 24;
    switch (iconName) {
      case "Gamepad2": return <Gamepad2 size={size} color={color} />;
      case "Library": return <Library size={size} color={color} />;
      case "Sword": return <Sword size={size} color={color} />;
      case "Compass": return <Compass size={size} color={color} />;
      case "Monitor": return <Monitor size={size} color={color} />;
      case "Star": return <Star size={size} color={color} />;
      case "Award": return <Award size={size} color={color} />;
      case "Clock": return <Clock size={size} color={color} />;
      case "Flame": return <Flame size={size} color={color} />;
      case "CheckCircle2": return <CheckCircle2 size={size} color={color} />;
      case "Trophy": return <Trophy size={size} color={color} />;
      case "Zap": return <Zap size={size} color={color} />;
      default: return <Trophy size={size} color={color} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Master Progress Header Card */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(255, 214, 10, 0.15) 0%, rgba(255, 159, 10, 0.05) 100%)",
          border: "1px solid rgba(255, 214, 10, 0.3)",
          borderRadius: 16,
          padding: "var(--space-6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, var(--apple-yellow) 0%, var(--apple-orange) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(255, 214, 10, 0.3)",
            }}
          >
            <Trophy size={30} color="#000" />
          </div>
          <div>
            <h3 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--apple-label)", margin: 0 }}>
              Library Mastery
            </h3>
            <p style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)", margin: "var(--space-1) 0 0 0" }}>
              Unlock badges by logging, exploring, and completing games in your library.
            </p>
          </div>
        </div>

        <div style={{ minWidth: 200, flex: "1 1 200px", maxWidth: 300 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)"}}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--apple-label)" }}>
              {unlockedCount} / {achievements.length} Unlocked
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--apple-yellow)" }}>
              {masterPercentage}%
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: 8,
              borderRadius: 4,
              background: "rgba(0, 0, 0, 0.3)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${masterPercentage}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--apple-yellow) 0%, var(--apple-orange) 100%)",
                transition: "width 300ms ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--apple-separator)", paddingBottom: "var(--space-3)"}}>
        <button
          type="button"
          onClick={() => setFilter("all")}
          style={{
            background: filter === "all" ? "var(--apple-accent)" : "var(--apple-tertiary-bg)",
            color: filter === "all" ? "var(--apple-white)" : "var(--apple-label)",
            border: "none",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: "var(--font-size-base)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          All ({achievements.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unlocked")}
          style={{
            background: filter === "unlocked" ? "var(--apple-accent)" : "var(--apple-tertiary-bg)",
            color: filter === "unlocked" ? "var(--apple-white)" : "var(--apple-label)",
            border: "none",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: "var(--font-size-base)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          Unlocked ({unlockedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("progress")}
          style={{
            background: filter === "progress" ? "var(--apple-accent)" : "var(--apple-tertiary-bg)",
            color: filter === "progress" ? "var(--apple-white)" : "var(--apple-label)",
            border: "none",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: "var(--font-size-base)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          In Progress ({achievements.length - unlockedCount})
        </button>
      </div>

      {/* Grid of Achievement Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((ach) => {
          return (
            <div
              key={ach.id}
              style={{
                background: ach.unlocked
                  ? "linear-gradient(135deg, rgba(255, 214, 10, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)"
                  : "var(--apple-card-bg)",
                border: ach.unlocked
                  ? "1px solid rgba(255, 214, 10, 0.4)"
                  : "1px solid var(--apple-separator)",
                borderRadius: 16,
                padding: "var(--space-5)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 16,
                position: "relative",
                overflow: "hidden",
                transition: "transform 150ms ease, box-shadow 150ms ease",
              }}
            >
              {/* Top Row: Icon + Category Badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: ach.unlocked
                      ? "rgba(255, 214, 10, 0.15)"
                      : "var(--apple-tertiary-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: ach.unlocked ? "1px solid rgba(255, 214, 10, 0.3)" : "none",
                  }}
                >
                  {getIcon(ach.iconName, ach.unlocked)}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--apple-secondary-label)",
                      background: "var(--apple-tertiary-bg)",
                      padding: "2px var(--space-2)",
                      borderRadius: 6,
                    }}
                  >
                    {ach.category}
                  </span>
                  {ach.unlocked && (
                    <span
                      style={{
                        background: "rgba(48, 209, 88, 0.15)",
                        color: "var(--apple-accent)",
                        padding: "2px var(--space-2)",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <CheckCircle2 size={12} />
                      Unlocked
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h4
                  style={{
                    fontSize: "var(--font-size-lg)",
                    fontWeight: 700,
                    color: ach.unlocked ? "var(--apple-yellow)" : "var(--apple-label)",
                    margin: "0 0 var(--space-1) 0",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {ach.title}
                  {!ach.unlocked && <Lock size={14} style={{ opacity: 0.4 }} />}
                </h4>
                <p style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)", margin: 0, lineHeight: 1.4 }}>
                  {ach.description}
                </p>
              </div>

              {/* Progress bar (if not unlocked) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-sm)", marginBottom: 6, color: "var(--apple-secondary-label)" }}>
                  <span>Progress</span>
                  <span style={{ fontWeight: 600, color: ach.unlocked ? "var(--apple-yellow)" : "var(--apple-label)" }}>
                    {ach.current} / {ach.target}
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: 6,
                    borderRadius: 3,
                    background: "var(--apple-tertiary-bg)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${ach.percentage}%`,
                      height: "100%",
                      background: ach.unlocked
                        ? "linear-gradient(90deg, var(--apple-yellow) 0%, var(--apple-orange) 100%)"
                        : "var(--apple-accent)",
                      transition: "width 300ms ease",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
