import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Grid2x2, List, BarChart2, Plus, Gamepad2, Sparkles, Settings, Users, Calendar } from "lucide-react";
import { Button } from "../components/ui/Button";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
  { to: "/",          label: "Library",        Icon: Grid2x2  },
  { to: "/lists",     label: "Lists",          Icon: List      },
  { to: "/systems",   label: "Browse Systems", Icon: Gamepad2  },
  { to: "/recommend", label: "What to Play",   Icon: Sparkles },
  { to: "/activity",  label: "Activity",       Icon: Calendar  },
  { to: "/friends",   label: "Friends",        Icon: Users     },
  { to: "/stats",     label: "Stats",          Icon: BarChart2 },
  { to: "/settings",  label: "Settings",       Icon: Settings },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  onAddGame: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ onAddGame }: SidebarProps) {
  return (
    <aside
      style={{
        width:              188,
        flexShrink:         0,
        display:            "flex",
        flexDirection:      "column",
        height:             "100vh",
        background:         "var(--apple-sidebar-bg)",
        backdropFilter:     "saturate(180%) blur(24px)",
        WebkitBackdropFilter: "saturate(180%) blur(24px)",
        borderRight:        "1px solid var(--apple-separator)",
        padding:            "var(--space-5) var(--space-3)",
        paddingTop:         "max(38px, env(safe-area-inset-top))",
        paddingBottom:      "max(20px, env(safe-area-inset-bottom))",
        WebkitAppRegion:    "drag",
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          display:     "flex",
          alignItems:  "center",
          gap:         10,
          paddingLeft: "var(--space-2)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            width:           28,
            height:          28,
            borderRadius:    8,
            background:      "var(--apple-accent)",
            flexShrink:      0,
          }}
        >
          <Gamepad2 size={16} color="var(--apple-accent-foreground)" />
        </div>
        <span
          style={{
            fontFamily:    "var(--apple-font-display)",
            fontWeight:    700,
            fontSize:      15,
            color:         "var(--apple-label)",
            letterSpacing: "-0.01em",
          }}
        >
          gamelog
        </span>
      </div>

      <nav
        aria-label="Main navigation"
        style={{ display: "flex", flexDirection: "column", gap: 4, WebkitAppRegion: "no-drag" }}
      >
        {NAV.map(({ to, label, Icon }) => (
          <SidebarNavItem key={to} to={to} label={label} Icon={Icon} />
        ))}
      </nav>

      {/* Add game CTA */}
      <div style={{ marginTop: "var(--space-4)", WebkitAppRegion: "no-drag" }}>
        <AddGameButton onClick={onAddGame} />
      </div>
    </aside>
  );
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

function SidebarNavItem({
  to,
  label,
  Icon,
}: {
  to:    string;
  label: string;
  Icon:  React.ElementType;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <NavLink
      to={to}
      end={to === "/"}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={({ isActive }) => ({
        display:       "flex",
        alignItems:    "center",
        gap:           10,
        padding:       "6px 10px",
        borderRadius:  "var(--radius-md)",
        background:    isActive
          ? "var(--apple-accent-subtle)"
          : hovered
          ? "var(--apple-fill)"
          : "transparent",
        color: isActive ? "var(--apple-accent)" : hovered ? "var(--apple-label)" : "var(--apple-secondary-label)",
        fontFamily:    "var(--apple-font-text)",
        fontSize:      "var(--font-size-base)",
        minHeight:     44,
        fontWeight:    isActive ? 500 : 400,
        textDecoration: "none",
        transition:    "background 120ms ease, color 120ms ease",
      })}
    >
      {({ isActive }) => (
        <>
          <Icon
            size={14}
            aria-hidden="true"
            color={
              isActive
                ? "var(--apple-accent)"
                : hovered
                ? "var(--apple-label)"
                : "var(--apple-tertiary-label)"
            }
          />
          {label}
        </>
      )}
    </NavLink>
  );
}

// ─── Add game button ──────────────────────────────────────────────────────────

function AddGameButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="primary"
      size="lg"
      onClick={onClick}
      aria-label="Add game to library"
      style={{
        width:        "100%",
        borderRadius: "var(--radius-lg)",
        fontFamily:   "var(--apple-font-text)",
        fontSize:     "var(--font-size-base)",
        fontWeight:   500,
      }}
    >
      <Plus size={13} aria-hidden="true" />
      Add game
    </Button>
  );
}
