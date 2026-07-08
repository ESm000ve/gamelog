import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Gamepad2, Search, ChevronLeft, ChevronRight, Filter, ArrowUpDown,
  Plus, Loader2, X, CheckSquare
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/schema";
import { CoverCard } from "../../components/CoverCard";
import { Skeleton } from "../../components/Skeleton";
import { Button } from "../../components/ui/Button";
import { useLiveRegion } from "../../hooks/useLiveRegion";
import type { Status, Log } from "../../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ERA_MAPPING: Record<number, string> = {
  9: "2020s",
  8: "2010s",
  7: "2000s",
  6: "2000s",
  5: "1990s",
  4: "1990s",
  3: "1980s",
  2: "1970s",
  1: "1970s",
};

const MAJOR_SYSTEM_SUBSTRINGS = [
  "PlayStation", "PS1", "PS2", "PS3", "PS4", "PS5", "PSP", "Vita",
  "Xbox", "Nintendo", "NES", "SNES", "Wii", "GameCube", "Game Boy", "DS", "Switch",
  "Sega", "Genesis", "Mega Drive", "Dreamcast", "Saturn", "Master System", "Game Gear",
  "PC", "Mac", "Linux", "iOS", "Android", "Arcade", "Oculus", "Meta Quest", "Playdate",
  "Steam", "Atari 2600"
];

function getPlatformEra(p: Platform): string {
  const name = p.name.toLowerCase();
  if (name.includes("playdate") || name.includes("quest 3") || name.includes("ps5") || name.includes("series x")) return "2020s";
  if (name.includes("switch") || name.includes("ps4") || name.includes("xbox one") || name.includes("quest 2") || name.includes("oculus")) return "2010s";
  if (name.includes("pc") || name.includes("mac") || name.includes("linux") || name.includes("web") || name.includes("android") || name.includes("ios") || name.includes("steam")) return "Computers & Mobile";
  if (p.generation && ERA_MAPPING[p.generation]) return ERA_MAPPING[p.generation];
  return "Other Systems";
}

function isMajor(p: Platform) {
  return MAJOR_SYSTEM_SUBSTRINGS.some(sub => 
    p.name.toLowerCase().includes(sub.toLowerCase()) || 
    (p.abbreviation && p.abbreviation.toLowerCase().includes(sub.toLowerCase()))
  );
}

const IGDB_GENRES = [
  { id: 31, name: "Adventure" },
  { id: 12, name: "Role-playing (RPG)" },
  { id: 5,  name: "Shooter" },
  { id: 8,  name: "Platform" },
  { id: 32, name: "Indie" },
  { id: 15, name: "Strategy" },
  { id: 13, name: "Simulator" },
  { id: 14, name: "Sport" },
  { id: 10, name: "Racing" },
  { id: 4,  name: "Fighting" },
  { id: 9,  name: "Puzzle" },
  { id: 25, name: "Hack and slash/Beat 'em up" },
  { id: 34, name: "Visual Novel" },
  { id: 33, name: "Arcade" },
];

const SORT_OPTIONS = [
  { value: "popularity", label: "Popularity (Rating Count)" },
  { value: "release_desc", label: "Release Date (Newest)" },
  { value: "release_asc", label: "Release Date (Oldest)" },
  { value: "rating", label: "Highest Rated" },
  { value: "name", label: "Name (A–Z)" },
];

interface Platform {
  id: number;
  name: string;
  abbreviation?: string;
  generation: number;
  logoUrl?: string;
}

interface SystemsScreenProps {
  onOpenGame?: (id: number) => void;
  onOpenLog?: (igdbId: number, prefill?: Partial<Log>) => void;
}

// ─── Main Controller ──────────────────────────────────────────────────────────

export function SystemsScreen({ onOpenGame, onOpenLog }: SystemsScreenProps) {
  const { platformId } = useParams<{ platformId?: string }>();

  if (!platformId) {
    return <SystemPicker />;
  }

  return (
    <SystemDirectory
      platformId={parseInt(platformId, 10)}
      onOpenGame={onOpenGame}
      onOpenLog={onOpenLog}
    />
  );
}

// ─── System Picker View ───────────────────────────────────────────────────────

const SYSTEM_SHORT_NAMES: Record<string, string> = {
  "PlayStation": "PS1",
  "PlayStation 2": "PS2",
  "PlayStation 3": "PS3",
  "PlayStation 4": "PS4",
  "PlayStation 5": "PS5",
  "PlayStation Vita": "VITA",
  "PlayStation VR": "PSVR",
  "PlayStation VR2": "PSVR2",
  "Nintendo Switch": "SW",
  "Super Nintendo Entertainment System (SNES)": "SNES",
  "Nintendo Entertainment System (NES)": "NES",
  "Nintendo 64": "N64",
  "Nintendo GameCube": "NGC",
  "Nintendo 3DS": "3DS",
  "New Nintendo 3DS": "N3DS",
  "Game Boy Advance": "GBA",
  "Game Boy": "GB",
  "Game Boy Color": "GBC",
  "Wii": "WII",
  "Wii U": "WIIU",
  "Xbox": "XBOX",
  "Xbox 360": "X360",
  "Xbox One": "XBO",
  "Xbox Series X|S": "XSX",
  "Sega Mega Drive/Genesis": "GEN",
  "Sega Saturn": "SAT",
  "Dreamcast": "DC",
  "PC (Microsoft Windows)": "PC",
  "Mac": "MAC",
  "Linux": "LIN",
  "Playdate": "PD",
  "Meta Quest 2": "MQ2",
  "Meta Quest 3": "MQ3",
  "Oculus Quest": "OQ",
  "Oculus Rift": "RIFT",
  "Oculus Go": "OGO",
  "Oculus VR": "OVR",
  "SteamVR": "SVR",
  "Android": "AND",
  "iOS": "IOS"
};

function getShortName(p: Platform) {
  if (SYSTEM_SHORT_NAMES[p.name]) return SYSTEM_SHORT_NAMES[p.name];
  if (p.abbreviation && p.abbreviation.length <= 4) return p.abbreviation.toUpperCase();
  
  const words = p.name.split(/[\s\-]+/);
  if (words.length > 1 && words.length <= 4) {
    return words.map(w => w[0]).join('').toUpperCase();
  }
  
  return p.name.slice(0, 3).toUpperCase();
}

function SystemCard({ platform, subtitle, navigate }: { platform: Platform; subtitle?: string | null; navigate: any }) {
  const p = platform;
  const shortName = getShortName(p);
  return (
    <div
      onClick={() => navigate(`/systems/${p.id}?name=${encodeURIComponent(p.name)}`)}
      style={{
        background: "var(--apple-fill)",
        border: "0.5px solid var(--apple-separator)",
        borderRadius: "var(--radius-lg)",
        padding: "10px var(--space-3)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = "var(--apple-secondary-fill)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = "var(--apple-fill)";
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: "var(--radius-sm)",
        background: "var(--apple-tertiary-bg)", display: "flex",
        alignItems: "center", justifyContent: "center",
        flexShrink: 0, overflow: "hidden", border: "1px solid var(--apple-separator)",
        padding: p.logoUrl ? 6 : 0
      }}>
        {p.logoUrl ? (
          <img src={p.logoUrl} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} loading="lazy" />
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--apple-secondary-label)", textAlign: "center", lineHeight: 1, whiteSpace: "nowrap" }}>
            {shortName}
          </span>
        )}
      </div>
      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "var(--font-size-base)", fontWeight: 600, color: "var(--apple-label)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2 }}>
          {p.name}
        </span>
        {subtitle && (
          <span style={{ fontSize: 11, color: "var(--apple-tertiary-label)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

function EraGroup({ label, items, navigate, isYourSystems = false, userSystemCounts }: { label: string, items: Platform[], navigate: any, isYourSystems?: boolean, userSystemCounts?: Map<string, number> }) {
  const [expanded, setExpanded] = useState(false);
  
  const sorted = useMemo(() => {
    if (isYourSystems && userSystemCounts) {
      return [...items].sort((a, b) => {
        const countA = userSystemCounts.get(a.name) || (a.abbreviation ? userSystemCounts.get(a.abbreviation) : 0) || 0;
        const countB = userSystemCounts.get(b.name) || (b.abbreviation ? userSystemCounts.get(b.abbreviation) : 0) || 0;
        return countB - countA;
      });
    }
    return [...items].sort((a, b) => {
      const aMajor = isMajor(a);
      const bMajor = isMajor(b);
      if (aMajor && !bMajor) return -1;
      if (!aMajor && bMajor) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [items, isYourSystems, userSystemCounts]);
  
  const displayThreshold = 10;
  const majorItems = sorted.filter(p => isMajor(p));
  const defaultVisible = isYourSystems ? sorted.slice(0, displayThreshold) : (majorItems.length > 0 ? majorItems : sorted.slice(0, displayThreshold));
  const showExpander = !expanded && sorted.length > defaultVisible.length;
  const visibleItems = expanded ? sorted : defaultVisible;
  
  if (items.length === 0) return null;

  return (
    <div>
      <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--apple-label)", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: 8 }}>
        <span>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--apple-tertiary-label)", background: "var(--apple-fill)", padding: "2px var(--space-2)", borderRadius: "var(--radius-full)" }}>
          {items.length}
        </span>
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 12
      }}>
        {visibleItems.map(p => {
          let subtitle: string | null = null;
          if (isYourSystems && userSystemCounts) {
            const count = userSystemCounts.get(p.name) || (p.abbreviation ? userSystemCounts.get(p.abbreviation) : 0) || 0;
            subtitle = `${count} ${count === 1 ? 'game' : 'games'}`;
          } else {
            const isRedundant = p.abbreviation && p.name.toLowerCase().includes(p.abbreviation.toLowerCase());
            subtitle = p.abbreviation && !isRedundant ? p.abbreviation : null;
          }
          return <SystemCard key={p.id} platform={p} subtitle={subtitle} navigate={navigate} />;
        })}
      </div>
      {showExpander && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            marginTop: "var(--space-4)",
            background: "transparent", border: "none", color: "var(--apple-accent)",
            fontSize: "var(--font-size-base)", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
          }}
        >
          Show all {items.length} systems <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function SystemPicker() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const logs = useLiveQuery(() => db.logs.toArray()) || [];
  
  const userSystemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    logs.forEach(log => {
      if (log.platform) counts.set(log.platform, (counts.get(log.platform) || 0) + 1);
      if (log.platforms) log.platforms.forEach(p => counts.set(p, (counts.get(p) || 0) + 1));
    });
    return counts;
  }, [logs]);

  useEffect(() => {
    async function fetchPlatforms() {
      try {
        setLoading(true);
        const res = await fetch("/api/igdb/platforms");
        if (!res.ok) throw new Error("Failed to load platforms");
        const data = await res.json();
        setPlatforms(data.platforms || []);
      } catch (err: any) {
        setError(err.message || "Failed to load platforms");
      } finally {
        setLoading(false);
      }
    }
    fetchPlatforms();
  }, []);

  const filteredPlatforms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return platforms;
    return platforms.filter(
      p => p.name.toLowerCase().includes(q) || (p.abbreviation && p.abbreviation.toLowerCase().includes(q))
    );
  }, [platforms, searchQuery]);

  const { yourSystems, groupedByEra } = useMemo(() => {
    const yourSystemsList: Platform[] = [];
    const eraGroups: Record<string, Platform[]> = {};
    const seenYourSystems = new Set<number>();
    
    if (!searchQuery) {
      platforms.forEach(p => {
        const count = userSystemCounts.get(p.name) || (p.abbreviation ? userSystemCounts.get(p.abbreviation) : 0);
        if (count && count > 0) {
          yourSystemsList.push(p);
          seenYourSystems.add(p.id);
        }
      });
    }

    filteredPlatforms.forEach(p => {
      const era = getPlatformEra(p);
      if (!eraGroups[era]) eraGroups[era] = [];
      eraGroups[era].push(p);
    });

    const ERA_ORDER = ["2020s", "2010s", "2000s", "1990s", "1980s", "1970s", "Computers & Mobile", "Other Systems"];
    const sortedEras = Object.keys(eraGroups).sort((a, b) => {
      const idxA = ERA_ORDER.indexOf(a);
      const idxB = ERA_ORDER.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return {
      yourSystems: yourSystemsList,
      groupedByEra: sortedEras.map(era => ({ label: era, items: eraGroups[era] }))
    };
  }, [filteredPlatforms, platforms, userSystemCounts, searchQuery]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--apple-window-bg)" }}>
      {/* Toolbar */}
      <div style={{
        padding: "var(--space-5) 300px var(--space-5) var(--space-8)",
        borderBottom: "1px solid var(--apple-separator)",
        background: "var(--apple-toolbar-bg)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "var(--radius-xl)",
            background: "var(--apple-accent)", display: "flex",
            alignItems: "center", justifyContent: "center", color: "white",
          }}>
            <Gamepad2 size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--apple-label)" }}>Browse by System</h1>
            <p style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)", margin: "2px 0 0" }}>
              {platforms.length > 0 ? `${platforms.length} systems` : "Loading..."}
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", maxWidth: 400 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--apple-tertiary-label)" }} />
          <input
            type="text"
            placeholder="Search systems (e.g. SNES, PS2, Switch, PC)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "var(--space-2) 14px var(--space-2) 36px",
              borderRadius: 999,
              border: "1px solid var(--apple-separator)",
              background: "var(--apple-fill)",
              color: "var(--apple-label)",
              fontSize: 14,
              fontFamily: "var(--apple-font-text)",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--apple-tertiary-label)", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-6) var(--space-8) 60px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 size={28} className="animate-spin" color="var(--apple-tertiary-label)" />
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--apple-red)" }}>
            <p>{error}</p>
          </div>
        ) : groupedByEra.length === 0 && yourSystems.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--apple-secondary-label)" }}>
            <p>No systems found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
            {yourSystems.length > 0 && !searchQuery && (
              <EraGroup 
                label="Your systems" 
                items={yourSystems} 
                navigate={navigate} 
                isYourSystems={true} 
                userSystemCounts={userSystemCounts} 
              />
            )}
            
            {groupedByEra.map(({ label, items }) => (
              <EraGroup 
                key={label}
                label={label} 
                items={items} 
                navigate={navigate} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── System Directory View ────────────────────────────────────────────────────

function SystemDirectory({ platformId, onOpenGame, onOpenLog }: { platformId: number; onOpenGame?: (id: number) => void; onOpenLog?: (igdbId: number, prefill?: Partial<Log>) => void; }) {
  const [searchParams] = useSearchParams();
  const platformName = searchParams.get("name") || "System Catalog";
  const navigate = useNavigate();
  const { announce } = useLiveRegion();

  // Catalog state
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  // Filter & Sort state
  const [sort, setSort] = useState("popularity");
  const [includeAll, setIncludeAll] = useState(false);
  const [genre, setGenre] = useState<string>("");
  const [startYear, setStartYear] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("");
  const [minRating, setMinRating] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced filter state for queries
  const [debouncedFilters, setDebouncedFilters] = useState({ sort, includeAll, genre, startYear, endYear, minRating, q: searchQuery });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters({ sort, includeAll, genre, startYear, endYear, minRating, q: searchQuery });
      setOffset(0); // Reset pagination on any filter change
    }, 400);
    return () => clearTimeout(timer);
  }, [sort, includeAll, genre, startYear, endYear, minRating, searchQuery]);

  // Multi-select & Bulk Add state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkStatus, setBulkStatus] = useState<Status>("Backlog");

  // Library map to check existing games
  const libraryMap = useLiveQuery(async () => {
    const logs = await db.logs.toArray();
    return new Map(logs.map(l => [l.igdbId, l.status]));
  }) ?? new Map<number, Status>();

  // Fetch catalog games
  useEffect(() => {
    async function fetchCatalog() {
      try {
        if (offset === 0) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        const params = new URLSearchParams({
          platformId: platformId.toString(),
          limit: "50",
          offset: offset.toString(),
          sort: debouncedFilters.sort,
          includeAll: debouncedFilters.includeAll.toString(),
        });
        if (debouncedFilters.genre) params.set("genre", debouncedFilters.genre);
        if (debouncedFilters.startYear) params.set("startYear", debouncedFilters.startYear);
        if (debouncedFilters.endYear) params.set("endYear", debouncedFilters.endYear);
        if (debouncedFilters.minRating) params.set("minRating", debouncedFilters.minRating);
        if (debouncedFilters.q) params.set("q", debouncedFilters.q);

        const res = await fetch(`/api/igdb/platform-games?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load catalog");
        const data = await res.json();
        
        if (offset === 0) {
          setGames(data.games || []);
        } else {
          setGames(prev => [...prev, ...data.games]);
        }
        setHasMore(data.hasMore);
      } catch (err: any) {
        setError(err.message || "Failed to load catalog");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }
    fetchCatalog();
  }, [platformId, offset, debouncedFilters]);

  // Infinite Scroll Observer
  const observerTarget = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setOffset(prev => prev + 50);
        }
      },
      { threshold: 0.5 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  // Selection handlers
  const handleToggleSelect = useCallback((game: any, e: React.MouseEvent) => {
    if (libraryMap.has(game.igdbId)) return;
    const index = games.findIndex(g => g.igdbId === game.igdbId);
    if (index === -1) return;

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (e.shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== index) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i++) {
          if (!libraryMap.has(games[i].igdbId)) {
            next.add(games[i].igdbId);
          }
        }
      } else {
        if (next.has(game.igdbId)) next.delete(game.igdbId);
        else next.add(game.igdbId);
      }
      return next;
    });
    setLastSelectedIndex(index);
  }, [games, lastSelectedIndex, libraryMap]);

  const toggleSelectAllLoaded = () => {
    const selectableIds = games.filter(g => !libraryMap.has(g.igdbId)).map(g => g.igdbId);
    if (selectedIds.size === selectableIds.length && selectableIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const handleBulkAdd = async () => {
    if (selectedIds.size === 0) return;
    try {
      const gamesToImport = games.filter(g => selectedIds.has(g.igdbId)).map(g => ({
        igdbId: g.igdbId,
        title: g.title,
        coverUrl: g.coverUrl,
        releaseYear: g.releaseYear,
        firstReleaseDate: g.firstReleaseDate,
        genres: g.genres || [],
        platforms: [platformName],
        status: bulkStatus,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      for (const g of gamesToImport) {
        if (!libraryMap.has(g.igdbId)) {
          await db.games.put(g as any);
          await db.logs.put({
            id: crypto.randomUUID(),
            igdbId: g.igdbId,
            status: bulkStatus,
            startedAt: null,
            completedAt: null,
            rating: null,
            notes: "",
            platform: platformName,
            updatedAt: new Date().toISOString(),
          } as any);
        }
      }

      announce(`Added ${selectedIds.size} games to ${bulkStatus}`);
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (err: any) {
      console.error("Bulk import failed:", err);
      alert("Failed to add games: " + err.message);
    }
  };

  const activeFilterCount = (genre ? 1 : 0) + (startYear || endYear ? 1 : 0) + (minRating ? 1 : 0) + (includeAll ? 1 : 0);

  const clearAllFilters = () => {
    setGenre("");
    setStartYear("");
    setEndYear("");
    setMinRating("");
    setIncludeAll(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--apple-window-bg)", position: "relative" }}>
      {/* Top Header */}
      <div style={{
        padding: "var(--space-4) 300px var(--space-4) var(--space-8)",
        borderBottom: "1px solid var(--apple-separator)",
        background: "var(--apple-toolbar-bg)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        display: "flex",
        flexDirection: "column",
        gap: 14
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/systems")}
              aria-label="Back to systems"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: "var(--radius-full)",
                background: "var(--apple-fill)", border: "none", color: "var(--apple-label)", cursor: "pointer"
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--apple-label)" }}>{platformName}</h1>
          </div>

          {/* Controls Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Search Input */}
            <div style={{ position: "relative", width: 200 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--apple-tertiary-label)" }} />
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 28px 6px 30px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--apple-separator)",
                  background: "var(--apple-fill)",
                  color: "var(--apple-label)",
                  fontSize: "var(--font-size-base)",
                  outline: "none",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--apple-tertiary-label)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{
                  padding: "6px 28px 6px var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--apple-separator)",
                  background: "var(--apple-fill)",
                  color: "var(--apple-label)",
                  fontSize: "var(--font-size-base)",
                  fontWeight: 500,
                  appearance: "none",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ArrowUpDown size={14} style={{ position: "absolute", right: 10, pointerEvents: "none", color: "var(--apple-secondary-label)" }} />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px var(--space-3)", borderRadius: "var(--radius-md)",
                border: "1px solid var(--apple-separator)",
                background: showFilters || activeFilterCount > 0 ? "var(--apple-accent)" : "var(--apple-fill)",
                color: showFilters || activeFilterCount > 0 ? "white" : "var(--apple-label)",
                fontSize: "var(--font-size-base)", fontWeight: 500, cursor: "pointer"
              }}
            >
              <Filter size={14} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span style={{
                  background: showFilters ? "rgba(255,255,255,0.25)" : "var(--apple-accent)",
                  color: "white", padding: "1px 6px", borderRadius: "var(--radius-full)", fontSize: 11
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Select Mode Toggle */}
            <button
              onClick={() => {
                setSelectMode(!selectMode);
                setSelectedIds(new Set());
              }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px var(--space-3)", borderRadius: "var(--radius-md)",
                border: "1px solid var(--apple-separator)",
                background: selectMode ? "var(--apple-accent)" : "var(--apple-fill)",
                color: selectMode ? "white" : "var(--apple-label)",
                fontSize: "var(--font-size-base)", fontWeight: 500, cursor: "pointer"
              }}
            >
              <CheckSquare size={14} />
              <span>{selectMode ? "Cancel Select" : "Select"}</span>
            </button>
          </div>
        </div>

        {/* Filter Popover Panel */}
        {showFilters && (
          <div style={{
            padding: "var(--space-4)", borderRadius: "var(--radius-xl)",
            background: "var(--apple-tertiary-bg)", border: "1px solid var(--apple-separator)",
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16,
            alignItems: "end"
          }}>
            <div>
              <label style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--apple-secondary-label)", marginBottom: 6 }}>Genre</label>
              <select
                value={genre}
                onChange={e => setGenre(e.target.value)}
                style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--apple-separator)", background: "var(--apple-fill)", color: "var(--apple-label)", fontSize: "var(--font-size-base)"}}
              >
                <option value="">All Genres</option>
                {IGDB_GENRES.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--apple-secondary-label)", marginBottom: 6 }}>Release Year Range</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  placeholder="From"
                  value={startYear}
                  onChange={e => setStartYear(e.target.value)}
                  style={{ width: "100%", padding: "6px var(--space-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--apple-separator)", background: "var(--apple-fill)", color: "var(--apple-label)", fontSize: "var(--font-size-base)"}}
                />
                <input
                  type="number"
                  placeholder="To"
                  value={endYear}
                  onChange={e => setEndYear(e.target.value)}
                  style={{ width: "100%", padding: "6px var(--space-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--apple-separator)", background: "var(--apple-fill)", color: "var(--apple-label)", fontSize: "var(--font-size-base)"}}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--apple-secondary-label)", marginBottom: 6 }}>Min Rating</label>
              <input
                type="number"
                placeholder="0 - 100"
                value={minRating}
                onChange={e => setMinRating(e.target.value)}
                style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--apple-separator)", background: "var(--apple-fill)", color: "var(--apple-label)", fontSize: "var(--font-size-base)"}}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 6 }}>
              <input
                type="checkbox"
                id="includeAll"
                checked={includeAll}
                onChange={e => setIncludeAll(e.target.checked)}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <label htmlFor="includeAll" style={{ fontSize: "var(--font-size-base)", color: "var(--apple-label)", cursor: "pointer" }}>
                Include DLCs / Bundles
              </label>
            </div>

            {activeFilterCount > 0 && (
              <div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={clearAllFilters}
                  style={{ width: "100%" }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Active filters summary */}
        {activeFilterCount > 0 && !showFilters && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-secondary-label)" }}>Active filters:</span>
            {genre && (
              <span style={{ fontSize: "var(--font-size-sm)", background: "var(--apple-fill)", padding: "2px var(--space-2)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 4 }}>
                <span>Genre: {IGDB_GENRES.find(g => g.id.toString() === genre)?.name}</span>
                <X size={12} style={{ cursor: "pointer" }} onClick={() => setGenre("")} />
              </span>
            )}
            {(startYear || endYear) && (
              <span style={{ fontSize: "var(--font-size-sm)", background: "var(--apple-fill)", padding: "2px var(--space-2)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 4 }}>
                <span>Years: {startYear || "any"}–{endYear || "any"}</span>
                <X size={12} style={{ cursor: "pointer" }} onClick={() => { setStartYear(""); setEndYear(""); }} />
              </span>
            )}
            {minRating && (
              <span style={{ fontSize: "var(--font-size-sm)", background: "var(--apple-fill)", padding: "2px var(--space-2)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 4 }}>
                <span>Rating ≥ {minRating}</span>
                <X size={12} style={{ cursor: "pointer" }} onClick={() => setMinRating("")} />
              </span>
            )}
            {includeAll && (
              <span style={{ fontSize: "var(--font-size-sm)", background: "var(--apple-fill)", padding: "2px var(--space-2)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 4 }}>
                <span>Inc. DLC/Bundles</span>
                <X size={12} style={{ cursor: "pointer" }} onClick={() => setIncludeAll(false)} />
              </span>
            )}
            <button onClick={clearAllFilters} style={{ background: "none", border: "none", fontSize: "var(--font-size-sm)", color: "var(--apple-accent)", cursor: "pointer", fontWeight: 500 }}>
              Clear all
            </button>
          </div>
        )}

        {/* Select Mode Toolbar */}
        {selectMode && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: "var(--space-1)"}}>
            <button
              onClick={toggleSelectAllLoaded}
              style={{ fontSize: "var(--font-size-base)", color: "var(--apple-accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
            >
              {selectedIds.size > 0 && selectedIds.size === games.filter(g => !libraryMap.has(g.igdbId)).length
                ? "Deselect All Loaded"
                : "Select All Loaded"}
            </button>
            <span style={{ color: "var(--apple-separator)" }}>|</span>
            <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)" }}>Shift+click to select range</span>
          </div>
        )}
      </div>

      {/* Catalog Grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-6) var(--space-8) 80px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "24px 16px" }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={210} borderRadius="var(--radius-lg)" />
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--apple-red)" }}>
            <p>{error}</p>
          </div>
        ) : games.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--apple-secondary-label)" }}>
            <p>No games found for this platform with active filters.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "24px 16px"
          }}>
            {games.map(game => {
              const status = libraryMap.get(game.igdbId);
              return (
                <CoverCard
                  key={game.igdbId}
                  game={{
                    igdbId: game.igdbId,
                    title: game.title,
                    status: status,
                    coverUrl: game.coverUrl,
                    coverColor: game.coverColor,
                    platform: game.platforms?.[0],
                    releaseYear: game.releaseYear,
                    firstReleaseDate: game.firstReleaseDate,
                  }}
                  onClick={_id => onOpenGame?.(_id)}
                  onChangeStatus={(_id, s) => {
                    // Quick add / update status
                    const now = Date.now();
                    if (!status) {
                      db.games.put({
                        igdbId: game.igdbId,
                        title: game.title,
                        slug: game.slug ?? String(game.igdbId),
                        developer: game.developer ?? "Unknown",
                        coverUrl: game.coverUrl,
                        releaseYear: game.releaseYear,
                        firstReleaseDate: game.firstReleaseDate,
                        genres: game.genres || [],
                        platforms: [platformName],
                        addedAt: now,
                        updatedAt: now,
                      });
                      db.logs.put({
                        igdbId: game.igdbId,
                        status: s,
                        notes: "",
                        platform: platformName,
                        createdAt: now,
                        updatedAt: now,
                      });
                    } else {
                      db.games.update(game.igdbId, { updatedAt: now });
                      db.logs.where("igdbId").equals(game.igdbId).modify({ status: s, updatedAt: now });
                    }
                  }}
                  onRate={async (_id, rating) => {
                    const now = Date.now();
                    if (!status) {
                      db.games.put({
                        igdbId: game.igdbId,
                        title: game.title,
                        slug: game.slug ?? String(game.igdbId),
                        developer: game.developer ?? "Unknown",
                        coverUrl: game.coverUrl,
                        releaseYear: game.releaseYear,
                        firstReleaseDate: game.firstReleaseDate,
                        genres: game.genres || [],
                        platforms: [platformName],
                        addedAt: now,
                        updatedAt: now,
                      });
                      db.logs.put({
                        igdbId: game.igdbId,
                        status: "Played",
                        rating,
                        notes: "",
                        platform: platformName,
                        createdAt: now,
                        updatedAt: now,
                      });
                    } else {
                      db.logs.where("igdbId").equals(game.igdbId).modify({ rating, updatedAt: now });
                    }
                  }}
                  onLog={_id => {
                    if (!status) {
                      const now = Date.now();
                      db.games.put({
                        igdbId: game.igdbId,
                        title: game.title,
                        slug: game.slug ?? String(game.igdbId),
                        developer: game.developer ?? "Unknown",
                        coverUrl: game.coverUrl,
                        releaseYear: game.releaseYear,
                        firstReleaseDate: game.firstReleaseDate,
                        genres: game.genres || [],
                        platforms: [platformName],
                        addedAt: now,
                        updatedAt: now,
                      });
                      db.logs.put({
                        igdbId: game.igdbId,
                        status: "Backlog",
                        notes: "",
                        platform: platformName,
                        createdAt: now,
                        updatedAt: now,
                      });
                    }
                    onOpenLog?.(game.igdbId);
                  }}
                  selectable={selectMode && !status}
                  selected={selectedIds.has(game.igdbId)}
                  onToggleSelect={(_id, e) => handleToggleSelect(game, e)}
                />
              );
            })}
          </div>
        )}

        {/* Infinite Scroll Sentinel */}
        {hasMore && !loading && games.length > 0 && (
          <div ref={observerTarget} style={{ height: 50, display: "flex", justifyContent: "center", alignItems: "center", marginTop: "var(--space-6)"}}>
            {loadingMore ? <Loader2 size={20} className="animate-spin" color="var(--apple-tertiary-label)" /> : <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-tertiary-label)" }}>Scroll for more</span>}
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectMode && selectedIds.size > 0 && (
        <div style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--apple-tertiary-bg)",
          border: "1px solid var(--apple-separator)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-3) var(--space-5)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          zIndex: 50
        }}>
          <span style={{ fontSize: "var(--font-size-base)", fontWeight: 500, color: "var(--apple-label)" }}>
            {selectedIds.size} selected
          </span>
          <div style={{ height: 16, width: 1, background: "var(--apple-separator)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-secondary-label)" }}>Add to:</span>
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value as Status)}
              style={{
                padding: "var(--space-1) var(--space-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--apple-separator)",
                background: "var(--apple-fill)", color: "var(--apple-label)", fontSize: "var(--font-size-base)", fontWeight: 500, outline: "none"
              }}
            >
              <option value="Backlog">Backlog</option>
              <option value="Playing">Playing</option>
              <option value="Played">Played</option>
              <option value="Wishlist">Wishlist</option>
            </select>
          </div>
          <Button variant="primary" size="sm" onClick={handleBulkAdd}>
            <Plus size={14} />
            <span>Add {selectedIds.size} games</span>
          </Button>
        </div>
      )}
    </div>
  );
}
