import { useState, useEffect, useRef } from "react";
import { X, Play, RefreshCw, Sparkles } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/schema";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { Button } from "../../components/ui/Button";

interface RouletteModalProps {
  onClose: () => void;
  onStartPlaying: (igdbId: number) => void;
}

export function RouletteModal({ onClose, onStartPlaying }: RouletteModalProps) {
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const backlog = useLiveQuery(async () => {
    const logs = await db.logs.toArray();
    const backlogLogs = logs.filter(l => l.status === "Backlog");
    if (backlogLogs.length === 0) return [];
    const gameIds = backlogLogs.map(l => l.igdbId);
    const games = await db.games.where("igdbId").anyOf(gameIds).toArray();
    const gameMap = new Map(games.map(g => [g.igdbId, g]));
    return backlogLogs.map(l => ({ game: gameMap.get(l.igdbId)!, log: l })).filter(x => x.game);
  }) ?? [];

  const timerRef = useRef<number | null>(null);

  const startSpin = () => {
    if (backlog.length === 0) return;
    setSpinning(true);
    setFinished(false);
    
    // Pick a winner
    const winnerIndex = Math.floor(Math.random() * backlog.length);
    
    let currentSpeed = 50;
    let iterations = 0;
    const maxIterations = 40 + Math.floor(Math.random() * 20); // 40-60 spins
    
    const tick = () => {
      iterations++;
      setCurrentIndex(prev => (prev + 1) % backlog.length);
      
      if (iterations < maxIterations) {
        // Slow down linearly towards the end
        if (iterations > maxIterations * 0.6) {
          currentSpeed += 15;
        }
        timerRef.current = window.setTimeout(tick, currentSpeed);
      } else {
        // Force the final index to be the winner
        setCurrentIndex(winnerIndex);
        setSpinning(false);
        setFinished(true);
      }
    };
    
    tick();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (backlog.length === 0) {
    return (
      <Overlay onClose={onClose}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--apple-label)", fontSize: 15, fontWeight: 500 }}>Your backlog is empty!</p>
          <Button variant="secondary" onClick={onClose} style={{ marginTop: "var(--space-4)"}}>Close</Button>
        </div>
      </Overlay>
    );
  }

  const activeEntry = backlog[currentIndex];
  const activeGame = activeEntry?.game;

  return (
    <Overlay onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 320 }}>
        
        {/* Title */}
        <h2 style={{ fontFamily: "var(--apple-font-display)", fontSize: 24, fontWeight: 700, color: "var(--apple-label)", marginBottom: "var(--space-8)", display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={20} color="var(--apple-accent)" />
          Backlog Roulette
        </h2>

        {/* Roulette Window */}
        <div 
          style={{
            width: 220,
            aspectRatio: "3/4",
            borderRadius: "var(--radius-xl)",
            background: "var(--apple-tertiary-bg)",
            boxShadow: finished ? "0 0 0 4px var(--apple-accent), 0 16px 48px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.3)",
            overflow: "hidden",
            position: "relative",
            transition: "all 0.3s ease",
            transform: finished ? "scale(1.05)" : "scale(1)",
            marginBottom: "var(--space-6)"}}
        >
          {activeGame?.coverUrl ? (
            <img src={activeGame.coverUrl} alt={activeGame.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "var(--space-4)"}}>
              <span style={{ color: "var(--apple-label)", fontSize: "var(--font-size-lg)", fontWeight: 600, textAlign: "center" }}>{activeGame?.title}</span>
            </div>
          )}
          
          {/* Scanline effect while spinning */}
          {spinning && (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)", backgroundSize: "100% 200%", animation: "scan 0.8s linear infinite" }} />
          )}
        </div>

        {/* Game Title */}
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--apple-label)", textAlign: "center", minHeight: 28, marginBottom: "var(--space-8)", opacity: finished ? 1 : (spinning ? 0.5 : 0) }}>
          {activeGame?.title}
        </h3>

        {/* Controls */}
        <div style={{ display: "flex", gap: 12 }}>
          {finished ? (
            <>
              <Button
                variant="primary"
                onClick={() => onStartPlaying(activeGame!.igdbId)}
                style={{ borderRadius: "var(--radius-full)", padding: "var(--space-3) var(--space-6)", fontSize: 15, boxShadow: "0 4px 12px rgba(10,132,255,0.3)" }}
              >
                <Play size={16} /> Play Now
              </Button>
              <button
                onClick={startSpin}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: "50%", background: "var(--apple-fill)", color: "var(--apple-label)", border: "none", cursor: "pointer" }}
                aria-label="Spin again"
              >
                <RefreshCw size={18} />
              </button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={startSpin}
              disabled={spinning}
              style={{
                borderRadius: "var(--radius-full)",
                padding: "var(--space-3) var(--space-8)",
                fontSize: 15,
                background: spinning ? "var(--apple-fill)" : "var(--apple-label)",
                color: spinning ? "var(--apple-tertiary-label)" : "var(--apple-bg)",
              }}
            >
              <RefreshCw size={16} className={spinning ? "animate-spin" : ""} />
              {spinning ? "Spinning..." : "SPIN"}
            </Button>
          )}
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Backlog Roulette"
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        style={{ position: "relative", padding: "var(--space-10)", background: "var(--apple-window-bg)", borderRadius: "var(--radius-2xl)", border: "1px solid var(--apple-separator)", boxShadow: "0 24px 48px rgba(0,0,0,0.5)", outline: "none" }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: "absolute", top: 16, right: 16, background: "var(--apple-fill)", color: "var(--apple-label)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <X size={16} />
        </button>
        {children}
      </div>
      <style>
        {`
          @keyframes scan {
            0% { background-position: 0 -100%; }
            100% { background-position: 0 200%; }
          }
        `}
      </style>
    </div>
  );
}
