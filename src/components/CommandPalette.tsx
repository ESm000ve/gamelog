import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Command, BookOpen, Sparkles, Trophy, Users, BarChart2, Settings, Plus, Flame, List, Gamepad2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/schema";

interface CommandItem {
  id: string;
  category: "Navigation" | "Actions" | "Library Games";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const games = useLiveQuery(() => db.games.toArray(), [], []);
  const logs = useLiveQuery(() => db.logs.toArray(), [], []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "/" && !isOpen) {
        const target = e.target as HTMLElement;
        if (
          target.tagName !== "INPUT" &&
          target.tagName !== "TEXTAREA" &&
          !target.isContentEditable
        ) {
          e.preventDefault();
          setIsOpen(true);
        }
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build items list
  const navItems: CommandItem[] = [
    {
      id: "nav-library",
      category: "Navigation",
      title: "Library",
      subtitle: "Browse your games collection",
      icon: <BookOpen size={18} color="var(--apple-accent)" />,
      onSelect: () => navigate("/"),
    },
    {
      id: "nav-lists",
      category: "Navigation",
      title: "Lists",
      subtitle: "Organize custom game lists and collections",
      icon: <List size={18} color="var(--apple-blue)" />,
      onSelect: () => navigate("/lists"),
    },
    {
      id: "nav-systems",
      category: "Navigation",
      title: "Browse Systems",
      subtitle: "Browse your games by hardware platform",
      icon: <Gamepad2 size={18} color="var(--apple-indigo)" />,
      onSelect: () => navigate("/systems"),
    },
    {
      id: "nav-what-to-play",
      category: "Navigation",
      title: "What to Play",
      subtitle: "Recommendations and Backlog Roulette",
      icon: <Sparkles size={18} color="var(--apple-orange)" />,
      onSelect: () => navigate("/recommend"),
    },
    {
      id: "nav-activity",
      category: "Navigation",
      title: "Activity",
      subtitle: "365-day heatmap, timeline, and Year in Review",
      icon: <Trophy size={18} color="var(--apple-yellow)" />,
      onSelect: () => navigate("/activity"),
    },
    {
      id: "nav-friends",
      category: "Navigation",
      title: "Friends",
      subtitle: "Compare library overlap and hot takes",
      icon: <Users size={18} color="var(--apple-purple)" />,
      onSelect: () => navigate("/friends"),
    },
    {
      id: "nav-stats",
      category: "Navigation",
      title: "Stats",
      subtitle: "Burndown charts and gaming habits",
      icon: <BarChart2 size={18} color="var(--apple-green)" />,
      onSelect: () => navigate("/stats"),
    },
    {
      id: "nav-settings",
      category: "Navigation",
      title: "Settings",
      subtitle: "Appearance, themes, backup, and imports",
      icon: <Settings size={18} color="var(--apple-secondary-label)" />,
      onSelect: () => navigate("/settings"),
    },
  ];

  const actionItems: CommandItem[] = [
    {
      id: "act-add",
      category: "Actions",
      title: "Add New Game to Library",
      subtitle: "Search IGDB catalog to track a game",
      icon: <Plus size={18} color="var(--apple-accent)" />,
      onSelect: () => {
        window.dispatchEvent(new CustomEvent("gamelog:open-add-game"));
      },
    },
    {
      id: "act-roulette",
      category: "Actions",
      title: "Spin Backlog Roulette",
      subtitle: "Pick a random game from your backlog to play",
      icon: <Flame size={18} color="var(--apple-red)" />,
      onSelect: () => {
        navigate("/recommend", { state: { openRoulette: true } });
        window.dispatchEvent(new CustomEvent("gamelog:open-roulette"));
      },
    },
    {
      id: "act-year-in-review",
      category: "Actions",
      title: "Open Year in Review",
      subtitle: "View your annual gaming story and wrapped slides",
      icon: <Trophy size={18} color="var(--apple-yellow)" />,
      onSelect: () => {
        navigate("/activity", { state: { openYearInReview: true } });
        window.dispatchEvent(new CustomEvent("gamelog:open-year-in-review"));
      },
    },
  ];

  const gameItems: CommandItem[] = (games || []).slice(0, 30).map((game) => {
    const log = (logs || []).find((l) => l.igdbId === game.igdbId);
    const imgUrl = game.coverUrl;
    return {
      id: `game-${game.igdbId}`,
      category: "Library Games",
      title: game.title,
      subtitle: `${log?.status || "Unlogged"} • ${game.releaseYear || "Unknown Year"}`,
      icon: (
        <div style={{ width: 20, height: 26, borderRadius: 3, overflow: "hidden", background: "var(--apple-tertiary-bg)" }}>
          {imgUrl && <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>
      ),
      onSelect: () => navigate(`/game/${game.igdbId}`),
    };
  });

  // Filter items
  const q = query.trim().toLowerCase();
  const allItems = [...actionItems, ...navItems, ...gameItems].filter((item) => {
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Reset selected index when filtered list changes
  useEffect(() => {
    if (selectedIndex >= allItems.length) {
      setSelectedIndex(Math.max(0, allItems.length - 1));
    }
  }, [allItems.length, selectedIndex]);

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % (allItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + (allItems.length || 1)) % (allItems.length || 1));
    } else if (e.key === "Enter" && allItems[selectedIndex]) {
      e.preventDefault();
      allItems[selectedIndex].onSelect();
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        paddingLeft: "var(--space-5)",
        paddingRight: "var(--space-5)",
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          background: "var(--apple-window-bg)",
          border: "1px solid var(--apple-separator)",
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--apple-accent-border)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "70vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--apple-separator)",
            gap: 12,
            background: "var(--apple-secondary-bg)",
          }}
        >
          <Search size={20} color="var(--apple-accent)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search your games… (e.g., 'Activity', 'Roulette', 'Zelda')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInInput}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--apple-label)",
              fontSize: "var(--font-size-lg)",
              fontWeight: 500,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "var(--space-1) var(--space-2)",
              borderRadius: 6,
              background: "var(--apple-tertiary-bg)",
              border: "1px solid var(--apple-separator)",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--apple-secondary-label)",
            }}
          >
            ESC
          </div>
        </div>

        {/* Results list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-3) 10px" }}>
          {allItems.length === 0 ? (
            <div style={{ padding: "var(--space-10) var(--space-5)", textAlign: "center", color: "var(--apple-secondary-label)", fontSize: 14 }}>
              No matching results found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            allItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const showHeader = index === 0 || allItems[index - 1].category !== item.category;

              return (
                <div key={item.id}>
                  {showHeader && (
                    <div
                      style={{
                        padding: "10px 14px 6px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--apple-secondary-label)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {item.category}
                    </div>
                  )}
                  <div
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => {
                      item.onSelect();
                      setIsOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: isSelected ? "var(--apple-accent)" : "transparent",
                      color: isSelected ? "var(--apple-white)" : "var(--apple-label)",
                      cursor: "pointer",
                      transition: "background 100ms ease",
                    }}
                  >
                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div
                          style={{
                            fontSize: "var(--font-size-sm)",
                            color: isSelected ? "rgba(255, 255, 255, 0.8)" : "var(--apple-secondary-label)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginTop: 2,
                          }}
                        >
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, opacity: 0.8 }}>
                        ↵ Select
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div
          style={{
            padding: "10px var(--space-5)",
            background: "var(--apple-tertiary-bg)",
            borderTop: "1px solid var(--apple-separator)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "var(--font-size-sm)",
            color: "var(--apple-secondary-label)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span><kbd style={{ background: "var(--apple-fill)", padding: "2px 6px", borderRadius: 4, marginRight: "var(--space-1)"}}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ background: "var(--apple-fill)", padding: "2px 6px", borderRadius: 4, marginRight: "var(--space-1)"}}>↵</kbd> Select</span>
            <span><kbd style={{ background: "var(--apple-fill)", padding: "2px 6px", borderRadius: 4, marginRight: "var(--space-1)"}}>ESC</kbd> Close</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: "var(--apple-accent)" }}>
            <Command size={14} /> ⌘K Command Palette
          </div>
        </div>
      </div>
    </div>
  );
}
