import { useState, useEffect } from "react";
import { X, Trash2, AlertCircle } from "lucide-react";
import { StarRatingInput, StarRating } from "../components/StarRating";
import { STATUS_COLORS } from "../components/StatusChip";
import { GamesRepo } from "../db/repositories/GamesRepo";
import { LogsRepo } from "../db/repositories/LogsRepo";
import { useLiveRegion } from "../hooks/useLiveRegion";
import { TagSelect } from "../components/TagSelect";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import type { Game, Log, Status, Completion, Ownership } from "../types";
import type { LogUpdate } from "../db/repositories/LogsRepo";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEditorProps {
  game:    Game;
  log:     Log;
  prefill?: Partial<Log>;
  onClose: () => void;
  onDelete?: () => void;
}

type FormState = {
  status:     Status;
  completion: Completion | undefined;
  completionPercentage: number | undefined;
  rating:     number | undefined;
  platforms:  string[];
  tagIds:     string[];
  timePlayed: string;
  startedAt:  string;
  finishedAt: string;
  ownership:  Ownership[];
  notes:      string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: Status[] = ["Wishlist", "Backlog", "Playing", "Played"];
const COMPLETIONS: Completion[] = ["Completed", "Mastered", "Abandoned", "Shelved"];
const OWNERSHIPS: Ownership[] = ["Physical", "Digital", "Subscription", "Borrowed"];

// ─── Component ────────────────────────────────────────────────────────────────

export function LogEditor({ game, log, prefill, onClose, onDelete }: LogEditorProps) {
  const { announce } = useLiveRegion();
  const [form, setForm] = useState<FormState>(() => {
    // If prefill has a single platform, ensure it maps to platforms array.
    const prefillPlatforms = prefill?.platforms || (prefill?.platform ? [prefill.platform] : undefined);
    
    return {
      status:     prefill?.status ?? log.status,
      completion: prefill?.completion ?? log.completion,
      completionPercentage: prefill?.completionPercentage ?? log.completionPercentage,
      rating:     prefill?.rating ?? log.rating,
      platforms:  prefillPlatforms ?? (log.platforms ? log.platforms : (log.platform ? [log.platform] : [])),
      tagIds:     prefill?.tagIds ?? log.tagIds ?? [],
      timePlayed: prefill?.timePlayed !== undefined ? String(prefill.timePlayed) : (log.timePlayed !== undefined ? String(log.timePlayed) : ""),
      startedAt:  prefill?.startedAt ?? log.startedAt ?? "",
      finishedAt: prefill?.finishedAt ?? log.finishedAt ?? "",
      ownership:  prefill?.ownership ?? (log.ownership ? (Array.isArray(log.ownership) ? log.ownership : [log.ownership]) : []),
      notes:      prefill?.notes ?? log.notes ?? "",
    };
  });

  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [saving, setSaving]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Clear completion if status changes away from Played
  useEffect(() => {
    if (form.status !== "Played") {
      setForm((f) => ({ ...f, completion: undefined }));
    }
  }, [form.status]);

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(currentForm: FormState): Record<string, string> {
    const errs: Record<string, string> = {};

    const tp = parseFloat(currentForm.timePlayed);
    if (currentForm.timePlayed !== "" && (isNaN(tp) || tp < 0)) {
      errs.timePlayed = "Time played must be a non-negative number.";
    }

    if (currentForm.startedAt && currentForm.finishedAt) {
      if (new Date(currentForm.finishedAt) < new Date(currentForm.startedAt)) {
        errs.finishedAt = "Finished date can't be before started date.";
      }
    }

    return errs;
  }

  // Dynamic validation
  useEffect(() => {
    setErrors(validate(form));
  }, [form]);

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    const update: LogUpdate = {
      status:     form.status,
      completion: form.status === "Played" ? form.completion : undefined,
      completionPercentage: (form.status === "Played" || form.status === "Playing") ? form.completionPercentage : undefined,
      rating:     form.rating,
      platform:   form.platforms[0] || undefined,
      platforms:  form.platforms.length > 0 ? form.platforms : undefined,
      timePlayed: form.timePlayed !== "" ? parseFloat(form.timePlayed) : undefined,
      startedAt:  form.startedAt || undefined,
      finishedAt: form.finishedAt || undefined,
      ownership:  form.ownership.length > 0 ? form.ownership : undefined,
      notes:      form.notes || undefined,
      tagIds:     form.tagIds,
    };
    await LogsRepo.save(game.igdbId, update);
    setSaving(false);
    announce("Log saved");
    onClose();
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete() {
    await GamesRepo.remove(game.igdbId);
    announce("Game removed from library");
    onDelete?.();
    onClose();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const togglePill = <T extends string>(
    current: T | undefined,
    value: T,
    setter: (v: T | undefined) => void
  ) => setter(current === value ? undefined : value);

  const toggleOwnership = (o: Ownership) => {
    setForm((f) => {
      const active = f.ownership.includes(o);
      const next = active
        ? f.ownership.filter((x) => x !== o)
        : [...f.ownership, o];
      return { ...f, ownership: next };
    });
  };

  const togglePlatform = (p: string) => {
    setForm((f) => {
      const active = f.platforms.includes(p);
      const next = active
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p];
      return { ...f, platforms: next };
    });
  };

  const hasSaveErrors = Object.keys(errors).length > 0;
  const coverThumb = game.coverUrl
    ? game.coverUrl.replace("t_cover_big", "t_cover_small")
    : undefined;

  return (
    <Modal isOpen={true} onClose={onClose} width={470}>
        <div
          style={{
            display:       "flex",
            alignItems:    "center",
            gap:           14,
            padding:       "var(--space-5) var(--space-5) var(--space-4)",
            borderBottom:  "1px solid var(--apple-separator)",
            flexShrink:    0,
          }}
        >
          {/* Cover thumb */}
          {coverThumb ? (
            <img
              src={coverThumb}
              alt={game.title}
              style={{
                width:        44,
                height:       58,
                objectFit:    "cover",
                borderRadius: "var(--radius-sm)",
                flexShrink:   0,
                boxShadow:    "0 2px 8px rgba(0,0,0,0.4)",
              }}
            />
          ) : (
            <div
              style={{
                width:          44,
                height:         58,
                borderRadius:   "var(--radius-sm)",
                background:     game.coverColor ?? "var(--apple-tertiary-bg)",
                flexShrink:     0,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--apple-label)", textAlign: "center", padding: "var(--space-1)", lineHeight: 1.3 }}>
                {game.title}
              </span>
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="log-editor-title"
              style={{
                fontFamily:    "var(--apple-font-display)",
                fontSize:      15,
                fontWeight:    600,
                color:         "var(--apple-label)",
                letterSpacing: "-0.02em",
                overflow:      "hidden",
                textOverflow:  "ellipsis",
                whiteSpace:    "nowrap",
              }}
            >
              {game.title}
            </h2>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-tertiary-label)", marginTop: 2 }}>
              {game.developer}{game.releaseYear ? ` · ${game.releaseYear}` : ""}
            </p>
          </div>

          <button
            aria-label="Close"
            onClick={onClose}
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              width:          28,
              height:         28,
              borderRadius:   "50%",
              background:     "var(--apple-fill)",
              color:          "var(--apple-secondary-label)",
              flexShrink:     0,
              transition:     "background 120ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--apple-secondary-fill)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--apple-fill)")}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-5) var(--space-5) 0" }}>

          {/* ── Status ── */}
          <Field label="Status" id="status-group">
            <div role="group" aria-labelledby="status-group-label" style={{ display: "flex", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--apple-separator)" }}>
              {STATUSES.map((s) => {
                const active = form.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => set("status", s)}
                    aria-pressed={active}
                    style={{
                      flex:          1,
                      padding:       "6px 0",
                      fontSize:      "var(--font-size-sm)",
                      fontWeight:    active ? 600 : 400,
                      background:    active ? STATUS_COLORS[s] + "25" : "transparent",
                      color:         active ? STATUS_COLORS[s] : "var(--apple-secondary-label)",
                      borderRight:   s !== "Played" ? "1px solid var(--apple-separator)" : "none",
                      transition:    "background 120ms ease, color 120ms ease",
                      textAlign:     "center",
                      cursor:        "pointer",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* ── Completion (Played only) ── */}
          {form.status === "Played" && (
            <Field label="Completion" id="completion-group">
              <div role="group" aria-labelledby="completion-group-label" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {COMPLETIONS.map((c) => (
                  <PillButton
                    key={c}
                    label={c}
                    active={form.completion === c}
                    onClick={() => togglePill(form.completion, c, (v) => set("completion", v))}
                  />
                ))}
              </div>
            </Field>
          )}

          {/* ── Completion Percentage (Playing or Played) ── */}
          {(form.status === "Playing" || form.status === "Played") && (
            <Field label="Progress" id="progress-group">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={form.completionPercentage ?? 0}
                  onChange={(e) => set("completionPercentage", parseInt(e.target.value, 10))}
                  style={{ flex: 1, accentColor: "var(--apple-accent)" }}
                />
                <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-label)", minWidth: 40, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {form.completionPercentage ?? 0}%
                </span>
              </div>
            </Field>
          )}

          {/* ── Rating ── */}
          <Field label="Rating">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <StarRatingInput
                value={form.rating ?? 0}
                onChange={(v) => set("rating", v)}
                size={24}
              />
              {form.rating !== undefined && (
                <>
                  <StarRating rating={form.rating} size={12} showValue />
                  <button
                    onClick={() => set("rating", undefined)}
                    aria-label="Clear rating"
                    style={{ fontSize: 11, color: "var(--apple-tertiary-label)", textDecoration: "underline" }}
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </Field>

          {/* ── Platforms ── */}
          {game.platforms.length > 0 && (
            <Field label="Platforms" id="platforms-group">
              <div role="group" aria-labelledby="platforms-group-label" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {game.platforms.map((p) => (
                  <PillButton
                    key={p}
                    label={p}
                    active={form.platforms.includes(p)}
                    onClick={() => togglePlatform(p)}
                  />
                ))}
              </div>
            </Field>
          )}

          {/* ── Time played ── */}
          <Field label="Time played" htmlFor="time-played-input" error={errors.timePlayed}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                id="time-played-input"
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={form.timePlayed}
                onChange={(e) => set("timePlayed", e.target.value)}
                style={{
                  width:        100,
                  padding:      "6px 10px",
                  borderRadius: "var(--radius-md)",
                  background:   "var(--apple-fill)",
                  border:       `1px solid ${errors.timePlayed ? "var(--apple-red)" : "var(--apple-separator)"}`,
                  color:        "var(--apple-label)",
                  fontSize:     "var(--font-size-base)",
                  outline:      "none",
                }}
              />
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-tertiary-label)" }}>hours</span>
            </div>
          </Field>

          {/* ── Dates ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "var(--space-4)"}}>
            <Field label="Started" htmlFor="started-input" error={undefined}>
              <input
                id="started-input"
                type="date"
                value={form.startedAt}
                onChange={(e) => set("startedAt", e.target.value)}
                style={{
                  width:        "100%",
                  padding:      "6px 10px",
                  borderRadius: "var(--radius-md)",
                  background:   "var(--apple-fill)",
                  border:       "1px solid var(--apple-separator)",
                  color:        "var(--apple-label)",
                  fontSize:     "var(--font-size-base)",
                  outline:      "none",
                  colorScheme:  "dark",
                }}
              />
            </Field>
            <Field label="Finished" htmlFor="finished-input" error={errors.finishedAt}>
              <input
                id="finished-input"
                type="date"
                value={form.finishedAt}
                onChange={(e) => set("finishedAt", e.target.value)}
                style={{
                  width:        "100%",
                  padding:      "6px 10px",
                  borderRadius: "var(--radius-md)",
                  background:   "var(--apple-fill)",
                  border:       `1px solid ${errors.finishedAt ? "var(--apple-red)" : "var(--apple-separator)"}`,
                  color:        "var(--apple-label)",
                  fontSize:     "var(--font-size-base)",
                  outline:      "none",
                  colorScheme:  "dark",
                }}
              />
            </Field>
          </div>

          {/* ── Ownership ── */}
          <Field label="Ownership" id="ownership-group">
            <div role="group" aria-labelledby="ownership-group-label" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {OWNERSHIPS.map((o) => (
                <PillButton
                  key={o}
                  label={o}
                  active={form.ownership.includes(o)}
                  onClick={() => toggleOwnership(o)}
                />
              ))}
            </div>
          </Field>

          {/* ── Tags ── */}
          <Field label="Tags" id="tags-group">
            <TagSelect value={form.tagIds} onChange={v => set("tagIds", v)} />
          </Field>

          {/* ── Notes ── */}
          <Field label="Notes" htmlFor="notes-input">
            <textarea
              id="notes-input"
              rows={3}
              placeholder="Add a note…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              style={{
                width:        "100%",
                padding:      "var(--space-2) 10px",
                borderRadius: "var(--radius-md)",
                background:   "var(--apple-fill)",
                border:       "1px solid var(--apple-separator)",
                color:        "var(--apple-label)",
                fontSize:     "var(--font-size-base)",
                resize:       "vertical",
                outline:      "none",
                minHeight:    72,
                lineHeight:   1.5,
                fontFamily:   "var(--apple-font-text)",
              }}
            />
          </Field>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display:       "flex",
            alignItems:    "center",
            justifyContent:"space-between",
            padding:       "var(--space-4) var(--space-5)",
            borderTop:     "1px solid var(--apple-separator)",
            flexShrink:    0,
            marginTop:     "var(--space-1)",
          }}
        >
          {confirmDelete ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <span style={{ fontSize: "var(--font-size-base)", fontWeight: 500, color: "var(--apple-red)" }}>Remove this game from library?</span>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                <Button variant="danger" onClick={handleDelete}>Remove</Button>
              </div>
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(true)} style={{ color: "var(--apple-red)" }}>
                <Trash2 size={14} /> Remove from library
              </Button>

              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} disabled={hasSaveErrors} loading={saving}>
                  Save
                </Button>
              </div>
            </>
          )}
        </div>
    </Modal>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  error,
  htmlFor,
  id,
  children,
}: {
  label:    string;
  error?:   string;
  htmlFor?: string;
  id?:      string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "var(--space-4)"}}>
      {htmlFor ? (
        <label
          htmlFor={htmlFor}
          style={{
            display:      "block",
            fontSize:     11,
            fontWeight:   500,
            color:        "var(--apple-tertiary-label)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      ) : (
        <span
          id={id ? `${id}-label` : undefined}
          style={{
            display:      "block",
            fontSize:     11,
            fontWeight:   500,
            color:        "var(--apple-tertiary-label)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 6,
          }}
        >
          {label}
        </span>
      )}
      {children}
      {error && (
        <div
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        4,
            marginTop:  "var(--space-1)",
            fontSize:   11,
            color:      "var(--apple-red)",
          }}
        >
          <AlertCircle size={11} />
          {error}
        </div>
      )}
    </div>
  );
}

function PillButton({
  label,
  active,
  onClick,
}: {
  label:   string;
  active:  boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding:      "6px var(--space-3)",
        borderRadius: "var(--radius-full)",
        fontSize:     "var(--font-size-sm)",
        minHeight:    44,
        fontWeight:   active ? 600 : 400,
        background:   active ? "var(--apple-accent)" : "var(--apple-fill)",
        color:        active ? "var(--apple-accent-foreground)" : "var(--apple-secondary-label)",
        border:       `1px solid ${active ? "var(--apple-accent)" : "var(--apple-separator)"}`,
        transition:   "background 120ms ease, color 120ms ease",
        textAlign:    "center",
      }}
    >
      {label}
    </button>
  );
}
