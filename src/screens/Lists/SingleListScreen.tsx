import { useState, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, MoreHorizontal, Trophy, X, Search, GripVertical, Plus, Trash2, Share2 } from "lucide-react";
import { db } from "../../db/schema";
import { ListsRepo } from "../../db/repositories/ListsRepo";
import { ShareListModal } from "../../components/ShareListModal";
import { Button } from "../../components/ui/Button";
import type { Game } from "../../types";

interface SingleListScreenProps {
  listId:     string;
  onBack:     () => void;
  onOpenGame: (igdbId: number) => void;
}

export function SingleListScreen({ listId, onBack, onOpenGame }: SingleListScreenProps) {
  const list = useLiveQuery(() => db.lists.get(listId), [listId]);

  const games = useLiveQuery(async () => {
    if (!list || list.gameIds.length === 0) return [];
    const all = await db.games.where("igdbId").anyOf(list.gameIds).toArray();
    return list.gameIds.map((id) => all.find((g) => g.igdbId === id)).filter(Boolean) as Game[];
  }, [listId, list?.gameIds.join(",")]);

  const [renaming, setRenaming]       = useState(false);
  const [nameInput, setNameInput]     = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [shareOpen, setShareOpen]     = useState(false);
  const [search, setSearch]           = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [dragOver, setDragOver]       = useState<number | null>(null);
  const dragIdx                       = useRef<number | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Library search results (exclude games already in list)
  const searchResults = useLiveQuery(async () => {
    if (!searchDebounced.trim() || !list) return [];
    const all = await db.games.toArray();
    const q = searchDebounced.toLowerCase();
    return all
      .filter((g) => g.title.toLowerCase().includes(q) && !list.gameIds.includes(g.igdbId))
      .slice(0, 8);
  }, [searchDebounced, listId, list?.gameIds.join(",")]);

  if (!list) {
    return (
      <ScreenShell title="List" onBack={onBack}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)"}}>Loading…</p>
        </div>
      </ScreenShell>
    );
  }

  // ── Rename ──────────────────────────────────────────────────────────────────
  const startRename = () => { setNameInput(list.name); setRenaming(true); setMenuOpen(false); };
  const commitRename = async () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== list.name) await ListsRepo.update(listId, { name: trimmed });
    setRenaming(false);
  };

  // ── Toggle ranked ───────────────────────────────────────────────────────────
  const toggleRanked = () => ListsRepo.update(listId, { isRanked: !list.isRanked });

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => { await ListsRepo.delete(listId); onBack(); };

  // ── Remove game ─────────────────────────────────────────────────────────────
  const removeGame = (igdbId: number) => ListsRepo.removeGame(listId, igdbId);

  // ── Add game from search ─────────────────────────────────────────────────────
  const addGame = async (igdbId: number) => {
    await ListsRepo.addGame(listId, igdbId);
    setSearch("");
  };

  // ── Drag-to-reorder ─────────────────────────────────────────────────────────
  const handleDragStart = (idx: number) => { dragIdx.current = idx; };
  const handleDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOver(idx); };
  const handleDrop = async (targetIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === targetIdx) { setDragOver(null); return; }
    const newOrder = [...list.gameIds];
    const [moved] = newOrder.splice(dragIdx.current, 1);
    newOrder.splice(targetIdx, 0, moved);
    await ListsRepo.update(listId, { gameIds: newOrder });
    dragIdx.current = null;
    setDragOver(null);
  };

  // Keyboard reorder: move item up/down with Alt+Arrow
  const keyboardMove = async (idx: number, dir: "up" | "down") => {
    const newOrder = [...list.gameIds];
    const targetIdx = dir === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];
    await ListsRepo.update(listId, { gameIds: newOrder });
  };

  const gamesList = games ?? [];

  return (
    <ScreenShell
      title={renaming ? "" : list.name}
      onBack={onBack}
      titleNode={renaming ? (
        <input
          autoFocus
          aria-label="List name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(false); }}
          style={{
            fontFamily:    "var(--apple-font-display)",
            fontSize:      14,
            fontWeight:    600,
            color:         "var(--apple-label)",
            background:    "var(--apple-fill)",
            borderRadius:  "var(--radius-sm)",
            padding:       "2px var(--space-2)",
            border:        "1px solid var(--apple-accent)",
            outline:       "none",
            minWidth:      120,
          }}
        />
      ) : undefined}
      controls={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Ranked toggle */}
          <button
            onClick={toggleRanked}
            title={list.isRanked ? "Switch to unranked" : "Switch to ranked"}
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          5,
              padding:      "var(--space-1) 10px",
              borderRadius: "var(--radius-full)",
              background:   list.isRanked ? "var(--apple-yellow)20" : "var(--apple-fill)",
              border:       `1px solid ${list.isRanked ? "var(--apple-yellow)40" : "var(--apple-separator)"}`,
              color:        list.isRanked ? "var(--apple-yellow)" : "var(--apple-secondary-label)",
              fontSize:     "var(--font-size-sm)",
              fontWeight:   list.isRanked ? 600 : 400,
              textAlign:    "center",
            }}
          >
            <Trophy size={12} />
            {list.isRanked ? "Ranked" : "Unranked"}
          </button>

          {/* Share button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            title="Share & Export List"
            style={{ borderRadius: "var(--radius-full)", padding: "var(--space-1) 10px", fontSize: "var(--font-size-sm)", fontWeight: 500 }}
          >
            <Share2 size={13} color="var(--apple-accent)" />
            Share
          </Button>

          {/* Overflow menu */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "var(--apple-fill)", color: "var(--apple-secondary-label)", textAlign: "center" }}
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
                <div role="menu" aria-label="List actions" style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 50, background: "var(--apple-tertiary-bg)", border: "1px solid var(--apple-separator)", borderRadius: "var(--radius-xl)", minWidth: 140, padding: "var(--space-1) 0", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                  <MenuBtn label="Rename" onClick={startRename} />
                  {confirmDelete ? (
                    <div style={{ padding: "var(--space-2) var(--space-3)", display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 11, color: "var(--apple-red)" }}>Delete this list?</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button variant="danger" size="sm" onClick={handleDelete} style={{ flex: 1, padding: "6px 0", borderRadius: "var(--radius-sm)", fontSize: 11 }}>Delete</Button>
                        <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: "6px 0", borderRadius: "var(--radius-sm)", fontSize: 11 }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <MenuBtn label="Delete" onClick={() => setConfirmDelete(true)} danger />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      }
    >
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-5) var(--space-8) var(--space-8)" }}>
        {list && (
          <ShareListModal
            isOpen={shareOpen}
            onClose={() => setShareOpen(false)}
            title={list.name}
            entries={gamesList.map((g) => ({ game: g }))}
          />
        )}
        
        {/* Hidden drag instructions for screen readers */}
        <div id="drag-instructions" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          Press Alt plus Up or Down arrow to reorder items.
        </div>

        {/* Search to add */}
        <div style={{ position: "relative", marginBottom: "var(--space-5)"}}>
          <Search size={13} color="var(--apple-tertiary-label)" aria-hidden="true" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            type="text"
            aria-label="Search library to add a game"
            placeholder="Search library to add a game…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width:        "100%",
              paddingLeft:  "var(--space-8)",
              paddingRight: search ? "var(--space-8)" : 12,
              paddingTop:   7,
              paddingBottom:7,
              borderRadius: "var(--radius-lg)",
              background:   "var(--apple-fill)",
              border:       "1px solid var(--apple-separator)",
              color:        "var(--apple-label)",
              fontSize:     "var(--font-size-base)",
              outline:      "none",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--apple-tertiary-label)", display: "flex" }}>
              <X size={13} />
            </button>
          )}

          {/* Search dropdown */}
          {search && (searchResults?.length ?? 0) > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 40,
              background: "var(--apple-tertiary-bg)", border: "1px solid var(--apple-separator)",
              borderRadius: "var(--radius-xl)", padding: "var(--space-1) 0",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            }}>
              {(searchResults ?? []).map((g) => (
                <button
                  key={g.igdbId}
                  onClick={() => addGame(g.igdbId)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "var(--space-2) var(--space-3)",
                    background: "transparent", color: "var(--apple-label)",
                    fontSize: "var(--font-size-base)", textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--apple-fill)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {g.coverUrl && (
                    <img src={g.coverUrl} alt={g.title} style={{ width: 28, height: 36, objectFit: "cover", borderRadius: "var(--radius-xs, 4px)", flexShrink: 0 }} />
                  )}
                  <div>
                    <p style={{ fontWeight: 500 }}>{g.title}</p>
                    <p style={{ fontSize: 11, color: "var(--apple-tertiary-label)" }}>{g.releaseYear}</p>
                  </div>
                  <Plus size={14} style={{ marginLeft: "auto", color: "var(--apple-accent)", flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}

          {search && searchDebounced && (searchResults?.length ?? 0) === 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 40, background: "var(--apple-tertiary-bg)", border: "1px solid var(--apple-separator)", borderRadius: "var(--radius-xl)", padding: "var(--space-3)", boxShadow: "0 8px 24px rgba(0,0,0,0.35)", fontSize: "var(--font-size-sm)", color: "var(--apple-tertiary-label)", textAlign: "center" }}>
              No games found in your library.
            </div>
          )}
        </div>

        {/* List count */}
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-tertiary-label)", marginBottom: "var(--space-4)"}}>
          {list.gameIds.length} {list.gameIds.length === 1 ? "game" : "games"}
          {list.isRanked && " · Drag or use Alt+↑/↓ to reorder"}
        </p>

        {/* Empty state */}
        {gamesList.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "var(--radius-xl)", background: "var(--apple-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Search size={20} color="var(--apple-tertiary-label)" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <p style={{ color: "var(--apple-label)", fontSize: "var(--font-size-base)", fontWeight: 500 }}>This list is empty</p>
              <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-sm)"}}>Search above to add games.</p>
            </div>
          </div>
        )}

        {/* Ranked: vertical numbered list */}
        {list.isRanked && gamesList.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {gamesList.map((game, idx) => (
              <div
                key={game.igdbId}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(idx)}
                onKeyDown={(e) => {
                  if (e.altKey && e.key === "ArrowUp")   { e.preventDefault(); keyboardMove(idx, "up"); }
                  if (e.altKey && e.key === "ArrowDown") { e.preventDefault(); keyboardMove(idx, "down"); }
                }}
                tabIndex={0}
                aria-label={`${idx + 1}. ${game.title}. Alt+Arrow to reorder.`}
                aria-describedby="drag-instructions"
                style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          12,
                  padding:      "6px var(--space-3)",
                  borderRadius: "var(--radius-lg)",
                  background:   dragOver === idx ? "var(--apple-fill)" : "var(--apple-tertiary-bg)",
                  border:       `1px solid ${dragOver === idx ? "var(--apple-accent)" : "var(--apple-separator)"}`,
                  cursor:       "grab",
                  transition:   "background 120ms ease, border-color 120ms ease",
                  outline:      "none",
                }}
              >
                {/* Rank number */}
                <span style={{ fontFamily: "var(--apple-font-display)", fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--apple-tertiary-label)", minWidth: 28, textAlign: "right" }}>
                  {idx + 1}
                </span>

                {/* Drag handle */}
                <GripVertical size={14} color="var(--apple-tertiary-label)" style={{ flexShrink: 0 }} />

                {/* Cover */}
                <div style={{ width: 36, height: 48, borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0, background: "var(--apple-tertiary-bg)" }}>
                  {game.coverUrl ? (
                    <img src={game.coverUrl} alt={game.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
                  ) : null}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    onClick={() => onOpenGame(game.igdbId)}
                    style={{ fontSize: "var(--font-size-base)", fontWeight: 600, color: "var(--apple-label)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--apple-accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--apple-label)")}
                  >
                    {game.title}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--apple-tertiary-label)", marginTop: 2 }}>
                    {game.developer}{game.releaseYear ? ` · ${game.releaseYear}` : ""}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeGame(game.igdbId)}
                  title="Remove from list"
                  aria-label={`Remove ${game.title} from list`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "transparent", color: "var(--apple-tertiary-label)", flexShrink: 0, textAlign: "center" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,59,48,0.12)"; e.currentTarget.style.color = "var(--apple-red)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--apple-tertiary-label)"; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Unranked: cover grid */}
        {!list.isRanked && gamesList.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "20px 14px" }}>
            {gamesList.map((game) => (
              <UnrankedCard key={game.igdbId} game={game} onOpen={() => onOpenGame(game.igdbId)} onRemove={() => removeGame(game.igdbId)} />
            ))}
          </div>
        )}
      </div>
    </ScreenShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UnrankedCard({ game, onOpen, onRemove }: { game: Game; onOpen: () => void; onRemove: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          position:    "relative",
          width:       "100%",
          aspectRatio: "3/4",
          borderRadius:"var(--radius-xl)",
          overflow:    "hidden",
          background:  "var(--apple-tertiary-bg)",
          cursor:      "pointer",
          boxShadow:   hovered ? "0 8px 24px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.3)",
          transform:   hovered ? "translateY(-2px)" : "none",
          transition:  "box-shadow 180ms ease, transform 180ms ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onOpen}
      >
        {game.coverUrl ? (
          <img src={game.coverUrl} alt={game.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
            <span style={{ color: "var(--apple-label)", fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>{game.title}</span>
          </div>
        )}

        {/* Hover: remove button */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", opacity: hovered ? 1 : 0, pointerEvents: hovered ? "auto" : "none", transition: "opacity 160ms ease" }}>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{ padding: "5px var(--space-3)", borderRadius: "var(--radius-md)", background: "rgba(255,59,48,0.9)", fontSize: "var(--font-size-sm)"}}
          >
            <Trash2 size={12} /> Remove
          </Button>
        </div>
      </div>
      <p style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--apple-label)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{game.title}</p>
    </div>
  );
}

function ScreenShell({ title, titleNode, controls, onBack, children }: {
  title:      string;
  titleNode?: React.ReactNode;
  controls?:  React.ReactNode;
  onBack:     () => void;
  children:   React.ReactNode;
}) {
  return (
    <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "var(--space-3) 300px var(--space-3) var(--space-5)", background: "var(--apple-toolbar-bg)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderBottom: "1px solid var(--apple-separator)" }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "var(--space-1) var(--space-2)", minHeight: 44, borderRadius: "var(--radius-md)", background: "transparent", color: "var(--apple-accent)", fontSize: 14, fontWeight: 500, textAlign: "center" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--apple-fill)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <ChevronLeft size={16} /> Lists
        </button>

        <div style={{ flex: 1 }}>
          {titleNode ?? (
            <h1 style={{ fontFamily: "var(--apple-font-display)", fontSize: 14, fontWeight: 600, color: "var(--apple-label)", letterSpacing: "-0.015em" }}>
              {title}
            </h1>
          )}
        </div>

        {controls}
      </div>
      {children}
    </main>
  );
}

function MenuBtn({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      style={{ display: "block", width: "100%", padding: "7px 14px", minHeight: 44, fontSize: "var(--font-size-base)", color: danger ? "var(--apple-red)" : "var(--apple-label)", background: "transparent", textAlign: "left" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--apple-fill)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {label}
    </button>
  );
}
