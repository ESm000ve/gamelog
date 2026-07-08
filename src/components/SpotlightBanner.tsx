import { useState, useEffect } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSpotlight, type SpotlightData } from "../services/spotlight";

export function SpotlightBanner() {
  const [spotlight, setSpotlight] = useState<SpotlightData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getSpotlight().then(setSpotlight);
  }, []);

  if (!spotlight) return null;

  return (
    <div 
      onClick={() => navigate(`/game/${spotlight.game.igdbId}`)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "var(--space-5)",
        margin: "0 var(--space-8) var(--space-6)",
        background: "var(--apple-secondary-bg)",
        borderRadius: "var(--radius-2xl)",
        border: "1px solid var(--apple-separator)",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; }}
    >
      <div style={{ width: 80, height: 80, borderRadius: "var(--radius-xl)", overflow: "hidden", background: "var(--apple-tertiary-bg)", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
        {spotlight.game.coverUrl && <img src={spotlight.game.coverUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={spotlight.game.title} />}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "var(--space-1)"}}>
          <Sparkles size={14} color="var(--apple-yellow)" />
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--apple-secondary-label)" }}>Game of the Week</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--apple-label)", marginBottom: "var(--space-1)"}}>{spotlight.game.title}</h2>
        <p style={{ fontSize: "var(--font-size-base)", color: "var(--apple-tertiary-label)", lineHeight: 1.4 }}>{spotlight.reason}</p>
      </div>
      
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--apple-fill)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--apple-label)", flexShrink: 0 }}>
        <ArrowRight size={16} />
      </div>
    </div>
  );
}
