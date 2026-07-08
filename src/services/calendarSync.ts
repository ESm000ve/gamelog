import type { Game, Log } from "../types";

export function generateCalendarICS(
  entries: { game: Game; log?: Log }[],
  calendarName: string = "Game Library Releases & Targets"
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Build Library Screen//${calendarName.replace(/[^a-zA-Z0-9 ]/g, "")}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calendarName}`,
  ];

  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  for (const { game, log } of entries) {
    let year = game.releaseYear;
    if (!year || isNaN(year)) year = new Date().getFullYear();

    // Create an all-day event for July 1 of the release year or started date
    let month = "07";
    let day = "01";

    if (log?.startedAt) {
      const d = new Date(log.startedAt);
      year = d.getFullYear();
      month = String(d.getMonth() + 1).padStart(2, "0");
      day = String(d.getDate()).padStart(2, "0");
    }

    const dtStart = `${year}${month}${day}`;
    // Next day for all-day event end
    const endDate = new Date(year, parseInt(month, 10) - 1, parseInt(day, 10) + 1);
    const dtEnd = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, "0")}${String(endDate.getDate()).padStart(2, "0")}`;

    const uid = `game-${game.igdbId}-${year}@buildlibraryscreen.local`;
    const summary = `🎮 ${game.title} (${log?.status || "Library"})`;
    const description = `Game: ${game.title}\\nStatus: ${log?.status || "Unlogged"}\\nRating: ${log?.rating ? `${log.rating}/10` : "Unrated"}\\nPlatform: ${log?.platform || game.platforms?.[0] || "Any"}`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadCalendarICS(
  entries: { game: Game; log?: Log }[],
  filename: string = "game-library.ics",
  calendarName?: string
): void {
  const content = generateCalendarICS(entries, calendarName);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
