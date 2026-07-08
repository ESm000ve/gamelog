import { useState, useEffect, useRef } from "react";
import { Plus, X, Tag as TagIcon } from "lucide-react";
import { TagsRepo } from "../db/repositories/TagsRepo";
import type { Tag } from "../types";

interface TagSelectProps {
  value: string[]; // array of Tag IDs
  onChange: (ids: string[]) => void;
}

export function TagSelect({ value, onChange }: TagSelectProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    TagsRepo.getAll().then(setAllTags);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdd = async (name: string) => {
    if (!name.trim()) return;
    try {
      const tag = await TagsRepo.getOrCreate(name);
      if (!allTags.find(t => t.id === tag.id)) {
        setAllTags([...allTags, tag]);
      }
      if (!value.includes(tag.id)) {
        onChange([...value, tag.id]);
      }
      setInputValue("");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = (id: string) => {
    onChange(value.filter(v => v !== id));
  };

  const activeTags = value.map(id => allTags.find(t => t.id === id)).filter(Boolean) as Tag[];
  
  const suggestedTags = allTags.filter(t => 
    !value.includes(t.id) && t.name.toLowerCase().includes(inputValue.toLowerCase())
  );
  
  const exactMatchExists = allTags.some(t => t.name.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Selected Tags Display */}
      <div 
        style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: 6, 
          padding: "6px",
          minHeight: 44,
          background: "var(--apple-fill)",
          border: "1px solid var(--apple-separator)",
          borderRadius: "var(--radius-md)",
          alignItems: "center"
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <TagIcon size={14} color="var(--apple-tertiary-label)" style={{ marginLeft: 6 }} />
        {activeTags.map(t => (
          <div 
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "var(--space-1) var(--space-2)",
              background: "var(--apple-accent)",
              color: "white",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 500
            }}
          >
            {t.name}
            <button 
              onClick={(e) => { e.stopPropagation(); handleRemove(t.id); }}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                opacity: 0.7,
                cursor: "pointer",
                padding: 0,
                display: "flex"
              }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        
        <input 
          ref={inputRef}
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={e => {
            if (e.key === "Enter" && inputValue.trim()) {
              e.preventDefault();
              handleAdd(inputValue);
            } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
              handleRemove(value[value.length - 1]);
            }
          }}
          placeholder={activeTags.length === 0 ? "Add tags..." : ""}
          style={{
            flex: 1,
            minWidth: 80,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--apple-label)",
            fontSize: "var(--font-size-base)",
            padding: "var(--space-1)"
          }}
        />
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (inputValue.trim() || suggestedTags.length > 0) && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "var(--space-1)",
          background: "var(--apple-window-bg)",
          border: "1px solid var(--apple-separator)",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          zIndex: 50,
          maxHeight: 200,
          overflowY: "auto",
          padding: "var(--space-1) 0"
        }}>
          {suggestedTags.map(t => (
            <div 
              key={t.id}
              onClick={() => handleAdd(t.name)}
              style={{
                padding: "var(--space-2) var(--space-3)",
                fontSize: "var(--font-size-base)",
                color: "var(--apple-label)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--apple-fill)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <TagIcon size={14} color="var(--apple-tertiary-label)" />
              {t.name}
            </div>
          ))}

          {inputValue.trim() && !exactMatchExists && (
            <div 
              onClick={() => handleAdd(inputValue)}
              style={{
                padding: "var(--space-2) var(--space-3)",
                fontSize: "var(--font-size-base)",
                color: "var(--apple-accent)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderTop: suggestedTags.length > 0 ? "1px solid var(--apple-separator)" : "none"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--apple-fill)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Plus size={14} />
              Create "{inputValue.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
