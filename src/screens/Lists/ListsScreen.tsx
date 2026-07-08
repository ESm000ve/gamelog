import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trophy } from "lucide-react";
import { db } from "../../db/schema";
import { ListsRepo } from "../../db/repositories/ListsRepo";
import { useLiveRegion } from "../../hooks/useLiveRegion";
import { useEffect } from "react";
import type { UserList } from "../../types";
import { Button } from "../../components/ui/Button";

interface ListsScreenProps {
  onOpenList: (listId: string) => void;
}

export function ListsScreen({ onOpenList }: ListsScreenProps) {
  const lists = useLiveQuery(() => db.lists.orderBy("createdAt").reverse().toArray());
  const [creating, setCreating] = useState(false);
  const { announce } = useLiveRegion();

  useEffect(() => {
    if (lists !== undefined) {
      announce(`Showing ${lists.length} lists`);
    }
  }, [lists?.length, announce]);

  const handleNewList = async () => {
    if (creating) return;
    setCreating(true);
    const id = await ListsRepo.create("New List");
    setCreating(false);
    onOpenList(id);
  };

  return (
    <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      {/* Toolbar */}
      <div
        style={{
          flexShrink:           0,
          display:              "flex",
          alignItems:           "center",
          justifyContent:       "space-between",
          padding:              "var(--space-3) 308px var(--space-3) var(--space-8)",
          background:           "var(--apple-toolbar-bg)",
          backdropFilter:       "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom:         "1px solid var(--apple-separator)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <h1 style={{ fontFamily: "var(--apple-font-display)", fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--apple-label)", letterSpacing: "-0.015em" }}>
            Lists
          </h1>
          <span style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)"}}>
            {lists?.length ?? 0} {lists?.length === 1 ? "list" : "lists"}
          </span>
        </div>

        <Button
          onClick={handleNewList}
          disabled={creating}
          variant="primary"
          size="sm"
          style={{ width: "max-content", flexShrink: 0 }}
        >
          <Plus size={14} style={{ marginRight: 6 }} /> New list
        </Button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-5) var(--space-8) var(--space-8)" }}>
        {lists === undefined && (
          <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-base)"}}>Loading…</p>
        )}

        {lists !== undefined && lists.length === 0 && (
          <EmptyState onNewList={handleNewList} />
        )}

        {lists !== undefined && lists.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {lists.map((list) => (
              <ListCard key={list.id} list={list} onClick={() => onOpenList(list.id)} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── List card ────────────────────────────────────────────────────────────────

function ListCard({ list, onClick }: { list: UserList; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  // Load the first 4 game covers
  const games = useLiveQuery(async () => {
    if (list.gameIds.length === 0) return [];
    const ids = list.gameIds.slice(0, 4);
    const results = await db.games.where("igdbId").anyOf(ids).toArray();
    // preserve order
    return ids.map((id) => results.find((g) => g.igdbId === id)).filter(Boolean);
  }, [list.id, list.gameIds.join(",")]);

  const covers = games ?? [];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${list.name}, ${list.gameIds.length} ${list.gameIds.length === 1 ? "game" : "games"}${list.isRanked ? ', Ranked' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:       "flex",
        flexDirection: "column",
        borderRadius:  "var(--radius-2xl)",
        overflow:      "hidden",
        background:    "var(--apple-secondary-bg)",
        border:        "1px solid var(--apple-separator)",
        cursor:        "pointer",
        transform:     hovered ? "translateY(-2px)" : "none",
        boxShadow:     hovered ? "0 8px 24px rgba(0,0,0,0.35)" : "0 2px 8px rgba(0,0,0,0.15)",
        transition:    "transform 160ms ease, box-shadow 160ms ease",
      }}
    >
      {/* 4-cover collage */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", aspectRatio: "16/9", overflow: "hidden", background: "var(--apple-tertiary-bg)" }}>
        {[0, 1, 2, 3].map((i) => {
          const game = covers[i] as any;
          return (
            <div key={i} style={{ overflow: "hidden", background: "var(--apple-fill)" }}>
              {game?.coverUrl ? (
                <img src={game.coverUrl} alt={game.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
              ) : (
                <div style={{
                  width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: [
                    "var(--apple-fill)",
                    "var(--apple-secondary-fill)",
                    "var(--apple-tertiary-fill)",
                    "var(--apple-quaternary-fill)",
                  ][i % 4],
                }}>
                  {game?.title && (
                    <span style={{ fontSize: 9, color: "var(--apple-secondary-label)", textAlign: "center", padding: "var(--space-1)", lineHeight: 1.3 }}>
                      {game.title}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Metadata */}
      <div style={{ padding: "10px 14px var(--space-3)", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <p style={{
            fontSize:     "var(--font-size-base)",
            fontWeight:   600,
            color:        "var(--apple-label)",
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
          }}>
            {list.name}
          </p>
          {list.isRanked && (
            <span style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:          3,
              padding:      "2px 7px",
              borderRadius: "var(--radius-full)",
              background:   "var(--apple-yellow)20",
              border:       "1px solid var(--apple-yellow)40",
              fontSize:     "var(--font-size-xs)",
              fontWeight:   600,
              color:        "var(--apple-yellow)",
              flexShrink:   0,
            }}>
              <Trophy size={10} aria-hidden="true" /> Ranked
            </span>
          )}
        </div>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-tertiary-label)" }}>
          {list.gameIds.length} {list.gameIds.length === 1 ? "game" : "games"}
        </p>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNewList }: { onNewList: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--radius-xl)", background: "var(--apple-fill)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Trophy size={20} color="var(--apple-tertiary-label)" aria-hidden="true" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <p style={{ color: "var(--apple-label)", fontSize: "var(--font-size-base)", fontWeight: 500 }}>No lists yet</p>
        <p style={{ color: "var(--apple-tertiary-label)", fontSize: "var(--font-size-sm)"}}>Create a list to organize your games.</p>
      </div>
      <Button
        onClick={onNewList}
        variant="primary"
        size="lg"
        style={{ marginTop: "var(--space-2)"}}
      >
        <Plus size={13} aria-hidden="true" /> New list
      </Button>
    </div>
  );
}
