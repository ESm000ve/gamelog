import { LayoutList, BarChart3, Gamepad2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function ListsScreen() {
  return (
    <PlaceholderShell title="Lists">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: "var(--radius-xl)", background: "var(--apple-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LayoutList size={20} color="var(--apple-tertiary-label)" />
        </div>
        <p style={{ color: "var(--apple-secondary-label)", fontSize: "var(--font-size-base)"}}>Lists screen coming in Step 6</p>
      </div>
    </PlaceholderShell>
  );
}

export function StatsScreen() {
  return (
    <PlaceholderShell title="Stats">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: "var(--radius-xl)", background: "var(--apple-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart3 size={20} color="var(--apple-tertiary-label)" />
        </div>
        <p style={{ color: "var(--apple-secondary-label)", fontSize: "var(--font-size-base)"}}>Stats screen coming in Step 7</p>
      </div>
    </PlaceholderShell>
  );
}

export function GameDetailScreen() {
  const { igdbId } = useParams();
  const navigate = useNavigate();

  return (
    <PlaceholderShell title={`Game Detail: ${igdbId}`}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: "var(--radius-xl)", background: "var(--apple-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Gamepad2 size={20} color="var(--apple-tertiary-label)" />
        </div>
        <p style={{ color: "var(--apple-secondary-label)", fontSize: "var(--font-size-base)"}}>Game detail screen coming in Step 5</p>
        <Button variant="secondary" size="sm" onClick={() => navigate("/")}>
          Back to Library
        </Button>
      </div>
    </PlaceholderShell>
  );
}

function PlaceholderShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      <div style={{ flexShrink: 0, padding: "var(--space-3) var(--space-8)", background: "var(--apple-toolbar-bg)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderBottom: "1px solid var(--apple-separator)" }}>
        <h1 style={{ fontFamily: "var(--apple-font-display)", fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--apple-label)", letterSpacing: "-0.015em", lineHeight: 1 }}>
          {title}
        </h1>
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </main>
  );
}
