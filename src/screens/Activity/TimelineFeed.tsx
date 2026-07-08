import { useMemo } from "react";
import type { Game, Log } from "../../types";
import { Play, CheckCircle2, Star, PlusCircle, Clock, Calendar, ArrowRight } from "lucide-react";

interface TimelineFeedProps {
  games: Game[];
  logs: Log[];
  selectedDate: string | null;
  onOpenGame: (igdbId: number) => void;
}

interface TimelineEvent {
  id: string;
  type: "started" | "finished" | "rated" | "session" | "added";
  title: string;
  description: string;
  dateStr: string;
  timestamp: number;
  game: Game;
  log: Log;
}

export function TimelineFeed({ games, logs, selectedDate, onOpenGame }: TimelineFeedProps) {
  const events = useMemo(() => {
    const gameMap = new Map<number, Game>();
    games.forEach((g) => gameMap.set(g.igdbId, g));

    const list: TimelineEvent[] = [];

    const formatYYYYMMDD = (ms: number) => {
      const d = new Date(ms);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    logs.forEach((log) => {
      const game = gameMap.get(log.igdbId);
      if (!game) return;

      let hasSpecificEvent = false;

      // Finished
      if (log.finishedAt) {
        hasSpecificEvent = true;
        const ts = new Date(log.finishedAt).getTime();
        list.push({
          id: `${log.igdbId}-finished-${log.finishedAt}`,
          type: "finished",
          title: "Completed Game",
          description: log.completion || "Finished the main journey",
          dateStr: log.finishedAt,
          timestamp: !isNaN(ts) ? ts : (log.updatedAt || Date.now()),
          game,
          log,
        });
      }

      // Started
      if (log.startedAt) {
        hasSpecificEvent = true;
        const ts = new Date(log.startedAt).getTime();
        list.push({
          id: `${log.igdbId}-started-${log.startedAt}`,
          type: "started",
          title: "Started Playing",
          description: "Embarked on a new playthrough",
          dateStr: log.startedAt,
          timestamp: !isNaN(ts) ? ts : (log.createdAt || Date.now()),
          game,
          log,
        });
      }

      // Play Sessions
      if (log.playSessions && log.playSessions.length > 0) {
        log.playSessions.forEach((s, idx) => {
          if (s.date) {
            hasSpecificEvent = true;
            const ts = new Date(s.date).getTime();
            list.push({
              id: `${log.igdbId}-session-${s.date}-${idx}`,
              type: "session",
              title: "Gameplay Session",
              description: s.durationMinutes ? `Logged ${Math.round(s.durationMinutes)} mins of playtime` : "Logged active gameplay",
              dateStr: s.date,
              timestamp: !isNaN(ts) ? ts : Date.now(),
              game,
              log,
            });
          }
        });
      }

      // Rated (if no session/start/finish, or if rated independently)
      if (log.rating !== undefined && log.rating > 0 && log.updatedAt) {
        const ds = formatYYYYMMDD(log.updatedAt);
        list.push({
          id: `${log.igdbId}-rated-${log.updatedAt}`,
          type: "rated",
          title: `Rated ${log.rating} ★`,
          description: `Awarded a score of ${log.rating}/10`,
          dateStr: ds,
          timestamp: log.updatedAt,
          game,
          log,
        });
      }

      // If no specific dates were logged, add a generic "Added to Library" event
      if (!hasSpecificEvent && (log.createdAt || log.updatedAt)) {
        const ms = log.createdAt || log.updatedAt || Date.now();
        const ds = formatYYYYMMDD(ms);
        list.push({
          id: `${log.igdbId}-added-${ms}`,
          type: "added",
          title: "Added to Library",
          description: `Status set to ${log.status}`,
          dateStr: ds,
          timestamp: ms,
          game,
          log,
        });
      }
    });

    // Sort descending by timestamp
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [games, logs]);

  const filteredEvents = useMemo(() => {
    if (!selectedDate) return events;
    return events.filter((e) => e.dateStr === selectedDate);
  }, [events, selectedDate]);

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "finished":
        return { Icon: CheckCircle2, color: "var(--apple-accent)", bg: "rgba(48, 209, 88, 0.15)" };
      case "started":
        return { Icon: Play, color: "var(--apple-blue)", bg: "rgba(10, 132, 255, 0.15)" };
      case "rated":
        return { Icon: Star, color: "var(--apple-yellow)", bg: "rgba(255, 214, 10, 0.15)" };
      case "session":
        return { Icon: Clock, color: "var(--apple-purple)", bg: "rgba(191, 90, 242, 0.15)" };
      case "added":
      default:
        return { Icon: PlusCircle, color: "var(--apple-secondary-label)", bg: "var(--apple-tertiary-bg)" };
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (filteredEvents.length === 0) {
    return (
      <div
        style={{
          background: "var(--apple-card-bg)",
          border: "1px solid var(--apple-separator)",
          borderRadius: 16,
          padding: 48,
          textAlign: "center",
          color: "var(--apple-secondary-label)",
        }}
      >
        <Calendar size={32} style={{ opacity: 0.4, marginBottom: "var(--space-3)"}} />
        <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--apple-label)" }}>
          {selectedDate ? `No activity logged on ${selectedDate}` : "No play journal events yet"}
        </div>
        <div style={{ fontSize: "var(--font-size-base)", marginTop: "var(--space-1)"}}>
          {selectedDate ? "Try selecting another day or clearing the filter" : "Start logging play sessions, completion dates, or ratings to build your timeline!"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--apple-label)", margin: 0 }}>
          {selectedDate ? `Events for ${formatDateLabel(selectedDate)}` : "Recent Activity Feed"}
        </h3>
        <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)" }}>
          {filteredEvents.length} {filteredEvents.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div style={{ position: "relative", paddingLeft: "var(--space-6)", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Vertical timeline bar */}
        <div
          style={{
            position: "absolute",
            left: 9,
            top: 12,
            bottom: 12,
            width: 2,
            background: "var(--apple-separator)",
            borderRadius: 1,
          }}
        />

        {filteredEvents.map((event) => {
          const { Icon, color, bg } = getEventIcon(event.type);
          const imgUrl = event.game.coverUrl;

          return (
            <div
              key={event.id}
              onClick={() => onOpenGame(event.game.igdbId)}
              role="button"
              tabIndex={0}
              style={{
                position: "relative",
                background: "var(--apple-card-bg)",
                border: "1px solid var(--apple-separator)",
                borderRadius: 14,
                padding: "var(--space-4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                cursor: "pointer",
                transition: "transform 150ms ease, border-color 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--apple-secondary-label)";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--apple-separator)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              {/* Timeline dot */}
              <div
                style={{
                  position: "absolute",
                  left: -24,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: bg,
                  border: `2px solid ${color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                }}
              >
                <Icon size={10} color={color} />
              </div>

              {/* Left content: Cover + Text */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 40,
                    height: 53,
                    borderRadius: 6,
                    overflow: "hidden",
                    background: event.game.coverColor || "var(--apple-tertiary-bg)",
                    flexShrink: 0,
                  }}
                >
                  {imgUrl ? (
                    <img src={imgUrl} alt={event.game.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : null}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "var(--font-size-base)", fontWeight: 700, color, background: bg, padding: "2px var(--space-2)", borderRadius: 10 }}>
                      {event.title}
                    </span>
                    <span style={{ fontSize: "var(--font-size-sm)", color: "var(--apple-secondary-label)" }}>
                      {formatDateLabel(event.dateStr)}
                    </span>
                  </div>
                  <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--apple-label)", margin: "var(--space-1) 0 2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {event.game.title}
                  </div>
                  <div style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)" }}>
                    {event.description}
                  </div>
                </div>
              </div>

              {/* Right action indicator */}
              <div style={{ color: "var(--apple-tertiary-label)", display: "flex", alignItems: "center" }}>
                <ArrowRight size={18} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
