import { useState, useEffect, useRef } from "react";
import { Share2, Copy, Download, Check, Calendar, FileText, Image as ImageIcon, Loader2, X } from "lucide-react";
import type { Game, Log } from "../types";
import { generateMarkdownList, generateShareCardCanvas, downloadCanvasImage, copyCanvasImageToClipboard } from "../services/listShare";
import { downloadCalendarICS } from "../services/calendarSync";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { Button } from "./ui/Button";

interface ShareListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entries: { game: Game; log?: Log }[];
}

export function ShareListModal({ isOpen, onClose, title, entries }: ShareListModalProps) {
  const [tab, setTab] = useState<"markdown" | "image" | "calendar">("markdown");
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedImg, setCopiedImg] = useState(false);
  const [imgPreviewUrl, setImgPreviewUrl] = useState<string | null>(null);
  const [generatingImg, setGeneratingImg] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(isOpen ? dialogRef : { current: null });

  const markdownText = generateMarkdownList(title, entries);

  useEffect(() => {
    if (isOpen && tab === "image" && !imgPreviewUrl && !generatingImg) {
      setGeneratingImg(true);
      generateShareCardCanvas(title, entries)
        .then((canvas) => {
          canvasRef.current = canvas;
          setImgPreviewUrl(canvas.toDataURL("image/png"));
        })
        .catch((err) => console.error("Error generating share canvas:", err))
        .finally(() => setGeneratingImg(false));
    }
  }, [isOpen, tab, title, entries, imgPreviewUrl, generatingImg]);

  if (!isOpen) return null;

  const handleCopyMd = () => {
    navigator.clipboard.writeText(markdownText);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyImg = async () => {
    if (!canvasRef.current) return;
    const success = await copyCanvasImageToClipboard(canvasRef.current);
    if (success) {
      setCopiedImg(true);
      setTimeout(() => setCopiedImg(false), 2000);
    } else {
      alert("Clipboard image copy not supported by your browser. Please use Download PNG instead.");
    }
  };

  const handleDownloadImg = () => {
    if (!canvasRef.current) return;
    const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".png";
    downloadCanvasImage(canvasRef.current, filename);
  };

  const handleDownloadIcs = () => {
    const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".ics";
    downloadCalendarICS(entries, filename, title);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-list-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-5)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        style={{
          width: "100%",
          maxWidth: 600,
          background: "var(--apple-window-bg)",
          border: "1px solid var(--apple-separator)",
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.7)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "85vh",
          outline: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px var(--space-6)",
            borderBottom: "1px solid var(--apple-separator)",
            background: "var(--apple-secondary-bg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Share2 size={20} color="var(--apple-accent)" />
            <h2 id="share-list-modal-title" style={{ fontSize: 18, fontWeight: 700, color: "var(--apple-label)", margin: 0 }}>
              Share & Export: {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "var(--apple-tertiary-bg)",
              border: "1px solid var(--apple-separator)",
              borderRadius: "50%",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--apple-secondary-label)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--apple-separator)", background: "var(--apple-fill)", padding: "var(--space-2) var(--space-4)", gap: 8 }}>
          <button
            type="button"
            onClick={() => setTab("markdown")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "var(--space-2) var(--space-4)",
              borderRadius: 10,
              background: tab === "markdown" ? "var(--apple-accent)" : "transparent",
              color: tab === "markdown" ? "var(--apple-white)" : "var(--apple-label)",
              border: "none",
              fontWeight: 600,
              fontSize: "var(--font-size-base)",
              cursor: "pointer",
            }}
          >
            <FileText size={15} /> Markdown Text
          </button>
          <button
            type="button"
            onClick={() => setTab("image")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "var(--space-2) var(--space-4)",
              borderRadius: 10,
              background: tab === "image" ? "var(--apple-accent)" : "transparent",
              color: tab === "image" ? "var(--apple-white)" : "var(--apple-label)",
              border: "none",
              fontWeight: 600,
              fontSize: "var(--font-size-base)",
              cursor: "pointer",
            }}
          >
            <ImageIcon size={15} /> Visual Card
          </button>
          <button
            type="button"
            onClick={() => setTab("calendar")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "var(--space-2) var(--space-4)",
              borderRadius: 10,
              background: tab === "calendar" ? "var(--apple-accent)" : "transparent",
              color: tab === "calendar" ? "var(--apple-white)" : "var(--apple-label)",
              border: "none",
              fontWeight: 600,
              fontSize: "var(--font-size-base)",
              cursor: "pointer",
            }}
          >
            <Calendar size={15} /> Calendar (.ics)
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "var(--space-6)", overflowY: "auto", flex: 1 }}>
          {tab === "markdown" && (
            <div>
              <p style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)", marginBottom: "var(--space-3)", lineHeight: 1.5 }}>
                Copy formatted Markdown checklist with star ratings and completion status ready to paste into Reddit, Discord, or GitHub.
              </p>
              <textarea
                readOnly
                value={markdownText}
                rows={10}
                style={{
                  width: "100%",
                  padding: "var(--space-3) 14px",
                  borderRadius: 10,
                  border: "1px solid var(--apple-separator)",
                  background: "var(--apple-tertiary-bg)",
                  color: "var(--apple-label)",
                  fontFamily: "var(--apple-font-mono)",
                  fontSize: "var(--font-size-sm)",
                  marginBottom: "var(--space-4)",
                  resize: "none",
                }}
              />
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleCopyMd}
                style={{
                  width: "100%",
                  background: copiedMd ? "var(--apple-green)" : undefined,
                }}
              >
                {copiedMd ? <Check size={18} /> : <Copy size={18} />}
                {copiedMd ? "Copied Markdown to Clipboard!" : "Copy Markdown Text"}
              </Button>
            </div>
          )}

          {tab === "image" && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)", marginBottom: "var(--space-4)", lineHeight: 1.5, textAlign: "left" }}>
                Generate a styled visual collage card featuring your top game covers and statistics.
              </p>

              {generatingImg && (
                <div style={{ padding: "var(--space-10) 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <Loader2 size={28} className="animate-spin" color="var(--apple-accent)" />
                  <span style={{ fontSize: 14, color: "var(--apple-secondary-label)" }}>Generating collage card…</span>
                </div>
              )}

              {imgPreviewUrl && !generatingImg && (
                <div style={{ marginBottom: "var(--space-5)"}}>
                  <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--apple-separator)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                    <img src={imgPreviewUrl} alt="Share card preview" style={{ width: "100%", height: "auto", display: "block" }} />
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleCopyImg}
                  disabled={!imgPreviewUrl}
                  style={{
                    flex: 1,
                    background: copiedImg ? "var(--apple-green)" : undefined,
                  }}
                >
                  {copiedImg ? <Check size={18} /> : <Copy size={18} />}
                  {copiedImg ? "Copied Image!" : "Copy Image"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleDownloadImg}
                  disabled={!imgPreviewUrl}
                  style={{ flex: 1 }}
                >
                  <Download size={18} /> Download PNG
                </Button>
              </div>
            </div>
          )}

          {tab === "calendar" && (
            <div>
              <p style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)", marginBottom: "var(--space-5)", lineHeight: 1.5 }}>
                Export an Apple Calendar, Google Calendar, or Outlook compatible <strong>iCalendar (.ics)</strong> file containing release years and target dates for all games in this view.
              </p>

              <div style={{ padding: "var(--space-5)", background: "var(--apple-tertiary-bg)", borderRadius: 12, border: "1px solid var(--apple-separator)", marginBottom: "var(--space-6)", display: "flex", alignItems: "center", gap: 16 }}>
                <Calendar size={32} color="var(--apple-accent)" />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--apple-label)" }}>
                    {title}.ics
                  </div>
                  <div style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)", marginTop: 2 }}>
                    Includes {entries.length} calendar events with game covers & status notes
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleDownloadIcs}
                style={{ width: "100%" }}
              >
                <Download size={18} /> Download Calendar (.ics)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
