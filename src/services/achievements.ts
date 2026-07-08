import type { Game, Log } from "../types";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: "Collection" | "Exploration" | "Completion" | "Dedication";
  iconName: string;
  target: number;
}

export interface AchievementStatus extends Achievement {
  current: number;
  unlocked: boolean;
  percentage: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_step",
    title: "First Step",
    description: "Log your very first game in your library",
    category: "Collection",
    iconName: "Gamepad2",
    target: 1,
  },
  {
    id: "curator",
    title: "Library Curator",
    description: "Build a collection of 25 games in your tracker",
    category: "Collection",
    iconName: "Library",
    target: 25,
  },
  {
    id: "rpg_scholar",
    title: "RPG Scholar",
    description: "Play or complete 5 RPG games",
    category: "Exploration",
    iconName: "Sword",
    target: 5,
  },
  {
    id: "genre_explorer",
    title: "Genre Explorer",
    description: "Play games across 8 unique genres",
    category: "Exploration",
    iconName: "Compass",
    target: 8,
  },
  {
    id: "platform_polyglot",
    title: "Platform Polyglot",
    description: "Log games across 4 different gaming platforms",
    category: "Exploration",
    iconName: "Monitor",
    target: 4,
  },
  {
    id: "critical_eye",
    title: "Critical Eye",
    description: "Rate 10 games in your collection",
    category: "Dedication",
    iconName: "Star",
    target: 10,
  },
  {
    id: "master_reviewer",
    title: "Master Reviewer",
    description: "Rate 50 games in your collection",
    category: "Dedication",
    iconName: "Award",
    target: 50,
  },
  {
    id: "time_invested",
    title: "Time Invested",
    description: "Log 50 total hours of gameplay across all titles",
    category: "Dedication",
    iconName: "Clock",
    target: 50,
  },
  {
    id: "hundred_club",
    title: "The Hundred Club",
    description: "Log 100 total hours of gameplay",
    category: "Dedication",
    iconName: "Flame",
    target: 100,
  },
  {
    id: "backlog_conqueror",
    title: "Backlog Conqueror",
    description: "Complete 5 games to shrink your backlog",
    category: "Completion",
    iconName: "CheckCircle2",
    target: 5,
  },
  {
    id: "perfectionist",
    title: "Perfectionist",
    description: "Reach 100% completion on 3 different games",
    category: "Completion",
    iconName: "Trophy",
    target: 3,
  },
  {
    id: "on_a_roll",
    title: "On a Roll",
    description: "Log gameplay activity across 5 distinct calendar days",
    category: "Dedication",
    iconName: "Zap",
    target: 5,
  },
];

export function evaluateAchievements(games: Game[], logs: Log[]): AchievementStatus[] {
  const gameMap = new Map<number, Game>();
  games.forEach((g) => gameMap.set(g.igdbId, g));

  const totalGames = logs.length;
  
  let rpgCount = 0;
  const uniqueGenres = new Set<string>();
  const uniquePlatforms = new Set<string>();
  let ratedCount = 0;
  let totalHours = 0;
  let completedCount = 0;
  let perfectionistCount = 0;
  const activeDays = new Set<string>();

  logs.forEach((log) => {
    const game = gameMap.get(log.igdbId);
    
    // Genres & RPG check
    if (game?.genres) {
      game.genres.forEach((g) => {
        uniqueGenres.add(g);
        if (g.toLowerCase().includes("role-playing") || g.toLowerCase() === "rpg") {
          rpgCount++;
        }
      });
    }

    // Platforms
    if (log.platform) uniquePlatforms.add(log.platform);
    if (log.platforms) log.platforms.forEach((p) => uniquePlatforms.add(p));
    if (game?.platforms) game.platforms.forEach((p) => uniquePlatforms.add(p));

    // Ratings
    if (log.rating !== undefined && log.rating > 0) {
      ratedCount++;
    }

    // Playtime
    if (log.timePlayed && log.timePlayed > 0) {
      totalHours += log.timePlayed;
    }
    if (log.playSessions) {
      log.playSessions.forEach((s) => {
        if (s.durationMinutes) totalHours += s.durationMinutes / 60;
        if (s.date) activeDays.add(s.date);
      });
    }

    // Dates
    if (log.startedAt) activeDays.add(log.startedAt);
    if (log.finishedAt) activeDays.add(log.finishedAt);
    if (log.updatedAt) {
      const d = new Date(log.updatedAt);
      activeDays.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    }

    // Completion
    if (log.status === "Played") {
      completedCount++;
    }
    if ((log.completionPercentage && log.completionPercentage >= 100) || log.completion?.toLowerCase() === "completed") {
      perfectionistCount++;
    }
  });

  return ACHIEVEMENTS.map((ach) => {
    let current = 0;
    switch (ach.id) {
      case "first_step":
        current = totalGames;
        break;
      case "curator":
        current = totalGames;
        break;
      case "rpg_scholar":
        current = rpgCount;
        break;
      case "genre_explorer":
        current = uniqueGenres.size;
        break;
      case "platform_polyglot":
        current = uniquePlatforms.size;
        break;
      case "critical_eye":
        current = ratedCount;
        break;
      case "master_reviewer":
        current = ratedCount;
        break;
      case "time_invested":
        current = Math.round(totalHours);
        break;
      case "hundred_club":
        current = Math.round(totalHours);
        break;
      case "backlog_conqueror":
        current = completedCount;
        break;
      case "perfectionist":
        current = perfectionistCount;
        break;
      case "on_a_roll":
        current = activeDays.size;
        break;
      default:
        current = 0;
    }

    const percentage = Math.min(100, Math.round((current / ach.target) * 100));
    const unlocked = current >= ach.target;

    return {
      ...ach,
      current: Math.min(current, ach.target),
      unlocked,
      percentage,
    };
  });
}
