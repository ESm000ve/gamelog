import { useState, useEffect, useRef } from "react";
import { Filter, X, Check } from "lucide-react";
import type { FilterSpec } from "../services/filterEngine";
import { TagsRepo } from "../db/repositories/TagsRepo";
import type { Tag, Status } from "../types";

// Predefined lists for simplicity. In a real app, these might be aggregated from the library.
const STATUSES: Status[] = ["Playing", "Backlog", "Played", "Wishlist"];
const GENRES = ["Action", "Adventure", "RPG", "Strategy", "Simulation", "Sports", "Puzzle", "Indie", "Shooter", "Platform", "Fighting", "Racing", "Arcade", "Music", "Point-and-click", "Visual Novel", "Card & Board Game", "Tactical", "Hack and slash/Beat 'em up"];
const PLATFORMS = ["PC", "PlayStation 5", "PlayStation 4", "Xbox Series X|S", "Xbox One", "Nintendo Switch", "iOS", "Android"];

interface FilterBarProps {
  spec: FilterSpec;
  onChange: (spec: FilterSpec) => void;
}

export function FilterBar({ spec, onChange }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    TagsRepo.getAll().then(setTags);
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const update = (changes: Partial<FilterSpec>) => {
    onChange({ ...spec, ...changes });
  };

  const toggleArrayItem = <K extends "status" | "genres" | "platforms" | "tagIds">(key: K, val: string) => {
    const current = (spec[key] as string[]) || [];
    if (current.includes(val)) {
      update({ [key]: current.filter(x => x !== val) });
    } else {
      update({ [key]: [...current, val] });
    }
  };

  const activeCount = 
    (spec.status?.length || 0) +
    (spec.genres?.length || 0) + 
    (spec.platforms?.length || 0) + 
    (spec.tagIds?.length || 0) + 
    (spec.releaseYear ? 1 : 0) + 
    (spec.timeToBeat ? 1 : 0) + 
    (spec.rating ? 1 : 0);

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px var(--space-3)",
          background: isOpen || activeCount > 0 ? "var(--apple-accent)" : "var(--apple-fill)",
          color: isOpen || activeCount > 0 ? "white" : "var(--apple-label)",
          border: `1px solid ${isOpen || activeCount > 0 ? "var(--apple-accent)" : "var(--apple-separator)"}`,
          borderRadius: "var(--radius-sm)",
          fontSize: "var(--font-size-base)",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.2s"
        }}
      >
        <Filter size={14} />
        Filters
        {activeCount > 0 && <span style={{ background: "white", color: "var(--apple-accent)", padding: "2px 6px", borderRadius: 10, fontSize: 11, marginLeft: "var(--space-1)"}}>{activeCount}</span>}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "var(--space-2)",
            width: 380,
            background: "var(--apple-tertiary-bg)",
            border: "1px solid var(--apple-separator)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            zIndex: 100,
            padding: "var(--space-5)",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxHeight: 500,
            overflowY: "auto"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Filter Library</h3>
            <button onClick={() => setIsOpen(false)} aria-label="Close filters" style={{ background: "transparent", border: "none", color: "var(--apple-secondary-label)", cursor: "pointer" }}><X size={16} aria-hidden="true" /></button>
          </div>

          <FacetGroup label="Status">
            {STATUSES.map(s => (
              <Checkbox key={s} label={s} checked={(spec.status || []).includes(s)} onChange={() => toggleArrayItem("status", s)} />
            ))}
          </FacetGroup>

          <FacetGroup label="Genres">
            {GENRES.map(g => (
              <Checkbox key={g} label={g} checked={(spec.genres || []).includes(g)} onChange={() => toggleArrayItem("genres", g)} />
            ))}
          </FacetGroup>

          <FacetGroup label="Platforms">
            {PLATFORMS.map(p => (
              <Checkbox key={p} label={p} checked={(spec.platforms || []).includes(p)} onChange={() => toggleArrayItem("platforms", p)} />
            ))}
          </FacetGroup>

          {tags.length > 0 && (
            <FacetGroup label="Tags">
              {tags.map(t => (
                <Checkbox key={t.id} label={t.name} checked={(spec.tagIds || []).includes(t.id)} onChange={() => toggleArrayItem("tagIds", t.id)} />
              ))}
            </FacetGroup>
          )}
          
          <RangeFacet 
            label="Release Year" 
            min={spec.releaseYear?.min} max={spec.releaseYear?.max} 
            onChange={(min, max) => update({ releaseYear: min === undefined && max === undefined ? undefined : { min, max } })} 
            placeholderMin="1990" placeholderMax="2025" 
          />
          
          <RangeFacet 
            label="Length (hours)" 
            min={spec.timeToBeat?.min} max={spec.timeToBeat?.max} 
            onChange={(min, max) => update({ timeToBeat: min === undefined && max === undefined ? undefined : { min, max } })} 
            placeholderMin="0" placeholderMax="100" 
          />
          
          <RangeFacet 
            label="Rating (stars)" 
            min={spec.rating?.min} max={spec.rating?.max} 
            onChange={(min, max) => update({ rating: min === undefined && max === undefined ? undefined : { min, max } })} 
            placeholderMin="1" placeholderMax="5" 
          />
          
        </div>
      )}
    </div>
  );
}

interface ActiveFilterBadgesProps {
  spec: FilterSpec;
  onChange: (spec: FilterSpec) => void;
}

export function ActiveFilterBadges({ spec, onChange }: ActiveFilterBadgesProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  
  useEffect(() => {
    TagsRepo.getAll().then(setTags);
  }, [spec.tagIds]);

  const update = (changes: Partial<FilterSpec>) => {
    onChange({ ...spec, ...changes });
  };

  const toggleArrayItem = <K extends "status" | "genres" | "platforms" | "tagIds">(key: K, val: string) => {
    const current = (spec[key] as string[]) || [];
    if (current.includes(val)) {
      update({ [key]: current.filter(x => x !== val) });
    } else {
      update({ [key]: [...current, val] });
    }
  };

  const clearAll = () => {
    onChange({}); 
  };

  const activeCount = 
    (spec.status?.length || 0) +
    (spec.genres?.length || 0) + 
    (spec.platforms?.length || 0) + 
    (spec.tagIds?.length || 0) + 
    (spec.releaseYear ? 1 : 0) + 
    (spec.timeToBeat ? 1 : 0) + 
    (spec.rating ? 1 : 0);

  if (activeCount === 0) return null;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {spec.status?.map(s => (
        <Badge key={s} label={`Status: ${s}`} onRemove={() => toggleArrayItem("status", s)} />
      ))}
      {spec.genres?.map(g => (
        <Badge key={g} label={`Genre: ${g}`} onRemove={() => toggleArrayItem("genres", g)} />
      ))}
      {spec.platforms?.map(p => (
        <Badge key={p} label={`Platform: ${p}`} onRemove={() => toggleArrayItem("platforms", p)} />
      ))}
      {spec.tagIds?.map(tid => {
        const t = tags.find(x => x.id === tid);
        return <Badge key={tid} label={`Tag: ${t?.name || tid}`} onRemove={() => toggleArrayItem("tagIds", tid)} />;
      })}
      {spec.releaseYear && <Badge label={`Year: ${spec.releaseYear.min || "Any"}-${spec.releaseYear.max || "Any"}`} onRemove={() => update({ releaseYear: undefined })} />}
      {spec.timeToBeat && <Badge label={`Length: ${spec.timeToBeat.min || 0}h - ${spec.timeToBeat.max || "Any"}h`} onRemove={() => update({ timeToBeat: undefined })} />}
      {spec.rating && <Badge label={`Rating: ${spec.rating.min || 0} - ${spec.rating.max || 5}`} onRemove={() => update({ rating: undefined })} />}
      
      <button onClick={clearAll} style={{ background: "transparent", border: "none", color: "var(--apple-secondary-label)", fontSize: "var(--font-size-sm)", cursor: "pointer", textDecoration: "underline", whiteSpace: "nowrap" }}>
        Clear all
      </button>
    </div>
  );
}

function Badge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, padding: "var(--space-1) var(--space-2)", 
      background: "var(--apple-fill)", border: "1px solid var(--apple-separator)",
      borderRadius: "var(--radius-sm)", fontSize: "var(--font-size-sm)", color: "var(--apple-label)", whiteSpace: "nowrap"
    }}>
      {label}
      <button onClick={onRemove} aria-label={`Remove filter ${label}`} style={{ background: "transparent", border: "none", color: "var(--apple-secondary-label)", cursor: "pointer", display: "flex", padding: 0 }}><X size={12} aria-hidden="true" /></button>
    </div>
  );
}

function FacetGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--apple-secondary-label)", marginBottom: "var(--space-2)"}}>{label}</h4>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      display: "flex", alignItems: "center", gap: 6, fontSize: "var(--font-size-base)",
      padding: "var(--space-1) var(--space-2)", background: checked ? "var(--apple-accent)" : "var(--apple-fill)",
      color: checked ? "white" : "var(--apple-label)", borderRadius: "var(--radius-sm)", cursor: "pointer",
      border: `1px solid ${checked ? "var(--apple-accent)" : "var(--apple-separator)"}`
    }}>
      {checked && <Check size={14} aria-hidden="true" />}
      {label}
    </div>
  );
}

function RangeFacet({ label, min, max, onChange, placeholderMin, placeholderMax }: { label: string, min?: number, max?: number, onChange: (min?: number, max?: number) => void, placeholderMin: string, placeholderMax: string }) {
  return (
    <div>
      <h4 style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--apple-secondary-label)", marginBottom: "var(--space-2)"}}>{label}</h4>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number" placeholder={placeholderMin} value={min || ""}
          aria-label={`${label} minimum`}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined, max)}
          style={{ width: 80, padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--apple-separator)", background: "var(--apple-window-bg)", color: "var(--apple-label)" }}
        />
        <span style={{ color: "var(--apple-secondary-label)" }}>to</span>
        <input
          type="number" placeholder={placeholderMax} value={max || ""}
          aria-label={`${label} maximum`}
          onChange={e => onChange(min, e.target.value ? Number(e.target.value) : undefined)}
          style={{ width: 80, padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--apple-separator)", background: "var(--apple-window-bg)", color: "var(--apple-label)" }}
        />
      </div>
    </div>
  );
}
