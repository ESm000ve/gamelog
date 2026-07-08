import React, { useRef } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number | string;
}

export function Modal({ isOpen, onClose, title, children, width = 470 }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // Use existing focus trap hook
  useFocusTrap(isOpen ? dialogRef : { current: null });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      style={{
        position:             "fixed",
        inset:                0,
        zIndex:               "var(--z-modal)",
        display:              "flex",
        alignItems:           "center",
        justifyContent:       "center",
        background:           "rgba(0,0,0,0.60)",
        outline:              "none",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        style={{
          width,
          maxWidth:      "calc(100vw - var(--space-8))",
          maxHeight:     "92vh",
          display:       "flex",
          flexDirection: "column",
          background:    "var(--apple-secondary-bg)",
          border:        "1px solid var(--apple-separator)",
          borderRadius:  "var(--radius-2xl)",
          boxShadow:     "var(--shadow-xl), 0 0 0 0.5px var(--apple-separator)",
          overflow:      "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div
            style={{
              display:       "flex",
              alignItems:    "center",
              justifyContent: "space-between",
              padding:       "var(--space-5) var(--space-5) var(--space-4)",
              borderBottom:  "1px solid var(--apple-separator)",
              flexShrink:    0,
            }}
          >
            <h2 id="modal-title" style={{ margin: 0, fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--apple-label)", letterSpacing: "-0.02em" }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--apple-fill)", color: "var(--apple-secondary-label)",
                border: "none", cursor: "pointer", transition: "background 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--apple-tertiary-fill)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--apple-fill)")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        {/* Body */}
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
