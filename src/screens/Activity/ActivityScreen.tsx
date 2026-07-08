import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { db } from "../../db/schema";
import { evaluateAchievements } from "../../services/achievements";
import { ContributionHeatmap } from "./ContributionHeatmap";
import { TimelineFeed } from "./TimelineFeed";
import { AchievementsSection } from "./AchievementsSection";
import { YearInReviewModal } from "./YearInReviewModal";
import {
  Calendar, Trophy, Sparkles,
  ArrowRight, Loader2
} from "lucide-react";

export function ActivityScreen() {
  const [activeTab, setActiveTab] = useState<"journal" | "achievements">("journal");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const navigate = useNavigate();

  const games = useLiveQuery(() => db.games.toArray()) ?? [];
  const logs = useLiveQuery(() => db.logs.toArray()) ?? [];

  const achievements = evaluateAchievements(games, logs);
  const currentYear = new Date().getFullYear();

  if (games.length === 0 && logs.length === 0) {
    return (
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-10)"}}>
        <div style={{ textAlign: "center", color: "var(--apple-secondary-label)" }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto var(--space-3)" }} />
          <div>Loading your activity journal...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-10)", background: "var(--apple-bg)" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
        
        {/* Header Title & Description */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1
              style={{
                fontSize: "var(--font-size-3xl)",
                fontWeight: 800,
                color: "var(--apple-label)",
                margin: "0 0 var(--space-2) 0",
                letterSpacing: "-0.03em",
                fontFamily: "var(--apple-font-display)",
              }}
            >
              Activity
            </h1>
            <p style={{ fontSize: 15, color: "var(--apple-secondary-label)", margin: 0 }}>
              Track your daily gameplay contributions, review your annual journey, and unlock library badges.
            </p>
          </div>

          {/* Year in Review Launcher Banner CTA */}
          <button
            type="button"
            onClick={() => setWrappedOpen(true)}
            style={{
              background: "linear-gradient(135deg, var(--apple-blue) 0%, var(--apple-purple) 50%, var(--apple-pink) 100%)",
              border: "none",
              borderRadius: 16,
              padding: "var(--space-3) var(--space-5)",
              color: "var(--apple-white)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(191, 90, 242, 0.35)",
              transition: "transform 150ms ease, box-shadow 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(191, 90, 242, 0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(191, 90, 242, 0.35)";
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={18} color="var(--apple-white)" />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.9 }}>
                Annual Wrap-Up
              </div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>
                Launch {currentYear} Wrapped
              </div>
            </div>
            <ArrowRight size={18} style={{ marginLeft: "var(--space-1)"}} />
          </button>
        </header>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: 12, borderBottom: "1px solid var(--apple-separator)", paddingBottom: "var(--space-4)"}}>
          <button
            type="button"
            onClick={() => {
              setActiveTab("journal");
              setSelectedDate(null);
            }}
            style={{
              background: activeTab === "journal" ? "var(--apple-accent)" : "var(--apple-card-bg)",
              color: activeTab === "journal" ? "var(--apple-white)" : "var(--apple-label)",
              border: "1px solid var(--apple-separator)",
              borderRadius: 12,
              padding: "10px var(--space-5)",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              transition: "all 150ms ease",
              boxShadow: activeTab === "journal" ? "0 4px 12px rgba(48, 209, 88, 0.3)" : "none",
            }}
          >
            <Calendar size={18} />
            Play Journal & Timeline
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("achievements")}
            style={{
              background: activeTab === "achievements" ? "var(--apple-accent)" : "var(--apple-card-bg)",
              color: activeTab === "achievements" ? "var(--apple-white)" : "var(--apple-label)",
              border: "1px solid var(--apple-separator)",
              borderRadius: 12,
              padding: "10px var(--space-5)",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              transition: "all 150ms ease",
              boxShadow: activeTab === "achievements" ? "0 4px 12px rgba(48, 209, 88, 0.3)" : "none",
            }}
          >
            <Trophy size={18} />
            Achievements & Milestones
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "journal" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <ContributionHeatmap
              logs={logs}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            <TimelineFeed
              games={games}
              logs={logs}
              selectedDate={selectedDate}
              onOpenGame={(id) => navigate(`/game/${id}`)}
            />
          </div>
        ) : (
          <AchievementsSection achievements={achievements} />
        )}

      </div>

      {/* Year in Review Modal */}
      {wrappedOpen && (
        <YearInReviewModal
          onClose={() => setWrappedOpen(false)}
          games={games}
          logs={logs}
        />
      )}
    </main>
  );
}
