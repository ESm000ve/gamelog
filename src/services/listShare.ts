import type { Game, Log } from "../types";

export function generateMarkdownList(title: string, entries: { game: Game; log?: Log }[]): string {
  const lines: string[] = [
    `# 🎮 ${title}`,
    `*Generated via Build Library Screen • ${entries.length} games*`,
    "",
  ];

  for (const { game, log } of entries) {
    const isCompleted = log?.status === "Played";
    const checkbox = isCompleted ? "[x]" : "[ ]";
    const ratingStr = log?.rating && log.rating > 0 ? ` ⭐ **${log.rating}/10**` : "";
    const statusStr = log?.status || "Unlogged";
    const timeStr = log?.timePlayed && log.timePlayed > 0 ? ` • ⏱️ ${log.timePlayed}h` : "";
    const platStr = log?.platform || game.platforms?.[0] ? ` • 🖥️ ${log?.platform || game.platforms?.[0]}` : "";

    lines.push(`- ${checkbox} **${game.title}**${ratingStr} *(${statusStr}${timeStr}${platStr})*`);
  }

  lines.push("", "---", "*Shared from my personal Gamelog collection*");
  return lines.join("\n");
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

export async function generateShareCardCanvas(
  title: string,
  entries: { game: Game; log?: Log }[]
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 520;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d context");

  // Draw background gradient
  const grad = ctx.createLinearGradient(0, 0, 800, 520);
  grad.addColorStop(0, "#1e1e1e");
  grad.addColorStop(1, "#121214");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 520);

  // Draw accent top border
  ctx.fillStyle = "#5e5ce6";
  ctx.fillRect(0, 0, 800, 6);

  // Draw Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`🎮 ${title}`, 40, 60);

  // Draw Subtitle / Stats
  const totalGames = entries.length;
  const playedGames = entries.filter((e) => e.log?.status === "Played").length;
  const ratedGames = entries.filter((e) => e.log?.rating && e.log.rating > 0);
  const avgRating = ratedGames.length > 0
    ? (ratedGames.reduce((acc, e) => acc + (e.log?.rating || 0), 0) / ratedGames.length).toFixed(1)
    : "N/A";

  ctx.fillStyle = "rgba(235, 235, 245, 0.7)";
  ctx.font = "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(
    `Total Games: ${totalGames}   •   Completed: ${playedGames}   •   Avg Rating: ⭐ ${avgRating}`,
    40,
    94
  );

  // Draw divider
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(40, 116, 720, 1);

  // Draw game covers grid (up to 5 games)
  const topGames = entries.slice(0, 5);
  const startX = 40;
  const startY = 144;
  const cardW = 132;
  const cardH = 176;
  const gap = 15;

  for (let i = 0; i < topGames.length; i++) {
    const { game, log } = topGames[i];
    const x = startX + i * (cardW + gap);
    const y = startY;

    // Card background placeholder
    ctx.fillStyle = game.coverColor || "#3a3a3c";
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, cardH, 8);
    ctx.fill();

    // Try loading cover image
    const imgUrl = game.coverUrl;
    if (imgUrl) {
      try {
        const img = await loadImage(imgUrl);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 8);
        ctx.clip();
        ctx.drawImage(img, x, y, cardW, cardH);
        ctx.restore();
      } catch (err) {
        // Fallback title on cover
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px sans-serif";
        ctx.fillText(game.title.slice(0, 16), x + 8, y + cardH / 2);
      }
    }

    // Draw game title below cover
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const titleText = game.title.length > 16 ? game.title.slice(0, 15) + "…" : game.title;
    ctx.fillText(titleText, x, y + cardH + 24);

    // Draw status / rating below title
    ctx.fillStyle = "rgba(235, 235, 245, 0.6)";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const subText = log?.rating ? `⭐ ${log.rating}/10` : log?.status || "Library";
    ctx.fillText(subText, x, y + cardH + 42);
  }

  // Footer
  ctx.fillStyle = "rgba(235, 235, 245, 0.4)";
  ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("✨ Built with Build Library Screen • Personal Gaming Collection", 40, 480);

  return canvas;
}

export function downloadCanvasImage(canvas: HTMLCanvasElement, filename: string = "my-game-list.png"): void {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function copyCanvasImageToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  try {
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          resolve(true);
        } catch (err) {
          resolve(false);
        }
      });
    });
  } catch (err) {
    return false;
  }
}
