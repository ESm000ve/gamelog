import { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, X, Check, Loader2 } from "lucide-react";
import { db } from "../../db/schema";
import { ListsRepo } from "../../db/repositories/ListsRepo";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useLiveRegion } from "../../hooks/useLiveRegion";
import { Button } from "../../components/ui/Button";

interface AddToListSheetProps {
  igdbId:  number;
  title:   string;
  onClose: () => void;
}

export function AddToListSheet({ igdbId, title, onClose }: AddToListSheetProps) {
  const lists = useLiveQuery(() => db.lists.orderBy("createdAt").reverse().toArray());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { announce } = useLiveRegion();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);

  // Which lists already contain this game
  const memberIds = new Set(
    (lists ?? []).filter((l) => l.gameIds.includes(igdbId)).map((l) => l.id)
  );

  const toggle = async (listId: string) => {
    setLoadingId(listId);
    if (memberIds.has(listId)) {
      await ListsRepo.removeGame(listId, igdbId);
      announce(`Removed from list`);
    } else {
      await ListsRepo.addGame(listId, igdbId);
      announce(`Added to list`);
    }
    setLoadingId(null);
  };

  const createAndAdd = async () => {
    const name = newName.trim() || `${title} list`;
    const id = await ListsRepo.create(name);
    await ListsRepo.addGame(id, igdbId);
    setCreating(false);
    setNewName("");
    announce(`Created list ${name} and added game`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-list-title"
      ref={dialogRef}
      style={{
        position:             "fixed",
        inset:                0,
        zIndex:               70,
        display:              "flex",
        alignItems:           "center",
        justifyContent:       "center",
        background:           "rgba(0,0,0,0.55)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        style={{
          width:         380,
          maxWidth:      "calc(100vw - 32px)",
          maxHeight:     "70vh",
          display:       "flex",
          flexDirection: "column",
          background:    "var(--apple-secondary-bg)",
          border:        "1px solid var(--apple-separator)",
          borderRadius:  "var(--radius-2xl)",
          boxShadow:     "0 32px 80px rgba(0,0,0,0.6)",
          overflow:      "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--apple-separator)", flexShrink: 0 }}>
          <div>
            <h2 id="add-list-title" style={{ fontFamily: "var(--apple-font-display)", fontSize: 14, fontWeight: 600, color: "var(--apple-label)" }}>Add to list</h2>
            <p style={{ fontSize: 11, color: "var(--apple-tertiary-label)", marginTop: 2 }}>{title}</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%", background: "var(--apple-fill)", color: "var(--apple-secondary-label)", textAlign: "center" }}>
            <X size={13} aria-hidden="true" />
          </button>
        </div>

        {/* Lists */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {lists === undefined && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-6)"}}>
              <Loader2 size={16} color="var(--apple-tertiary-label)" />
            </div>
          )}

          {lists?.length === 0 && !creating && (
            <p style={{ padding: "var(--space-4) var(--space-5)", fontSize: "var(--font-size-base)", color: "var(--apple-tertiary-label)", textAlign: "center" }}>
              No lists yet. Create one below.
            </p>
          )}

          {(lists ?? []).map((list) => {
            const inList = memberIds.has(list.id);
            const loading = loadingId === list.id;
            return (
              <button
                key={list.id}
                onClick={() => toggle(list.id)}
                aria-pressed={inList}
                style={{
                  display:       "flex",
                  alignItems:    "center",
                  gap:           12,
                  width:         "100%",
                  padding:       "10px var(--space-5)",
                  background:    "transparent",
                  color:         "var(--apple-label)",
                  fontSize:      "var(--font-size-base)",
                  textAlign:     "left",
                  borderBottom:  "1px solid var(--apple-separator)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--apple-fill)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Checkbox */}
                <div style={{
                  width:        18,
                  height:       18,
                  borderRadius: "var(--radius-sm)",
                  background:   inList ? "var(--apple-accent)" : "var(--apple-fill)",
                  border:       `1px solid ${inList ? "var(--apple-accent)" : "var(--apple-separator)"}`,
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent:"center",
                  flexShrink:   0,
                  transition:   "background 120ms ease",
                }}>
                  {loading ? <Loader2 size={10} color="var(--apple-accent-foreground)" aria-hidden="true" /> : inList ? <Check size={11} color="var(--apple-accent-foreground)" aria-hidden="true" /> : null}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{list.name}</p>
                  <p style={{ fontSize: 11, color: "var(--apple-tertiary-label)", marginTop: 1 }}>
                    {list.gameIds.length} {list.gameIds.length === 1 ? "game" : "games"}
                  </p>
                </div>
              </button>
            );
          })}

          {/* New list inline form */}
          {creating ? (
            <div style={{ padding: "10px var(--space-5)", display: "flex", gap: 8, borderBottom: "1px solid var(--apple-separator)" }}>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createAndAdd(); if (e.key === "Escape") setCreating(false); }}
                placeholder="List name…"
                aria-label="New list name"
                style={{
                  flex:         1,
                  padding:      "5px 10px",
                  borderRadius: "var(--radius-md)",
                  background:   "var(--apple-fill)",
                  border:       "1px solid var(--apple-accent)",
                  color:        "var(--apple-label)",
                  fontSize:     "var(--font-size-base)",
                  outline:      "none",
                }}
              />
              <Button variant="primary" size="sm" onClick={createAndAdd} style={{ padding: "5px var(--space-3)", borderRadius: "var(--radius-md)", fontSize: "var(--font-size-sm)"}}>Create</Button>
              <button onClick={() => setCreating(false)} aria-label="Cancel new list" style={{ padding: "5px var(--space-2)", minHeight: 44, borderRadius: "var(--radius-md)", background: "var(--apple-fill)", color: "var(--apple-secondary-label)", textAlign: "center" }}><X size={12} aria-hidden="true" /></button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px var(--space-5)", minHeight: 44, background: "transparent", color: "var(--apple-accent)", fontSize: "var(--font-size-base)", fontWeight: 500, textAlign: "left" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--apple-fill)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Plus size={14} aria-hidden="true" /> New list
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "var(--space-3) var(--space-5)", borderTop: "1px solid var(--apple-separator)", flexShrink: 0 }}>
          <Button
            variant="secondary"
            onClick={onClose}
            style={{ width: "100%", padding: "7px 0", borderRadius: "var(--radius-lg)", fontSize: "var(--font-size-base)"}}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
