import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Upload, AlertTriangle, CheckCircle2, Loader2, Database, Trash2, Gamepad2, PlayCircle, Palette, Sun, Moon, Monitor, Check } from "lucide-react";
import { exportData, importData } from "../services/backup";
import { ACCENT_OPTIONS, getStoredThemeMode, setStoredThemeMode, getStoredAccentColor, setStoredAccentColor, type ThemeMode, type AccentColor } from "../services/theme";
import { parsePlatformList, matchPlatformGames, importMatchedPlatformGames, type PlatformType } from "../services/platformImport";
import type { MatchedImportGame } from "../services/importSource";
import { Button } from "../components/ui/Button";

export function SettingsScreen() {
  const navigate = useNavigate();
  const [steamId, setSteamId] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmFile, setConfirmFile] = useState<File | null>(null);

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getStoredThemeMode());
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => getStoredAccentColor());

  // Platform Import States
  const [platformTab, setPlatformTab] = useState<"Steam" | PlatformType>("Steam");
  const [platformText, setPlatformText] = useState("");
  const [platformImporting, setPlatformImporting] = useState(false);
  const [platformProgress, setPlatformProgress] = useState(0);
  const [platformStatus, setPlatformStatus] = useState("");
  const [platformMatches, setPlatformMatches] = useState<MatchedImportGame[]>([]);
  const [platformSelectedIds, setPlatformSelectedIds] = useState<Set<string>>(new Set());
  const [platformSuccessMsg, setPlatformSuccessMsg] = useState("");

  const handleRunPlatformMatch = async () => {
    if (!platformText.trim() || platformTab === "Steam") return;
    setPlatformImporting(true);
    setPlatformStatus("Parsing titles...");
    setPlatformProgress(10);
    setPlatformMatches([]);
    setPlatformSuccessMsg("");

    try {
      const parsed = parsePlatformList(platformText, platformTab as PlatformType);
      if (parsed.length === 0) {
        alert("No valid game titles found. Please check your list format.");
        setPlatformImporting(false);
        return;
      }
      const matched = await matchPlatformGames(parsed, (pct, msg) => {
        setPlatformProgress(pct);
        setPlatformStatus(msg);
      });
      setPlatformMatches(matched);
      // Auto-select all high/low confidence matches
      const initialSelected = new Set<string>();
      matched.forEach((m) => {
        if (m.igdbGame) initialSelected.add(m.imported.sourceId);
      });
      setPlatformSelectedIds(initialSelected);
    } catch (err: any) {
      alert("Error matching games: " + err.message);
    } finally {
      setPlatformImporting(false);
    }
  };

  const handleConfirmPlatformImport = async () => {
    if (platformSelectedIds.size === 0 || platformTab === "Steam") return;
    setPlatformImporting(true);
    setPlatformStatus("Saving to database...");
    try {
      const toImport = platformMatches.filter((m) => platformSelectedIds.has(m.imported.sourceId));
      const count = await importMatchedPlatformGames(toImport, "Backlog", true, platformTab as PlatformType);
      setPlatformSuccessMsg(`Successfully imported ${count} games from ${platformTab}!`);
      setPlatformMatches([]);
      setPlatformText("");
    } catch (err: any) {
      alert("Import failed: " + err.message);
    } finally {
      setPlatformImporting(false);
    }
  };

  const handleThemeModeChange = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setStoredThemeMode(mode);
  };

  const handleAccentColorChange = (color: AccentColor) => {
    setAccentColorState(color);
    setStoredAccentColor(color);
  };

  useEffect(() => {
    const saved = localStorage.getItem("steamId");
    if (saved) setSteamId(saved);
  }, []);

  const handleSteamIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSteamId(e.target.value);
    localStorage.setItem("steamId", e.target.value);
  };

  const handleExport = async () => {
    try {
      await exportData();
    } catch (err: any) {
      setError(err.message || "Export failed");
    }
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setConfirmFile(file);
    // Reset file input so same file can be selected again if cancelled
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async (mode: "merge" | "replace") => {
    if (!confirmFile) return;
    setImporting(true);
    setProgress(0);
    setError("");
    setSuccess(false);

    try {
      const text = await confirmFile.text();
      await importData(text, mode, (pct, msg) => {
        setProgress(pct);
        setStatusMsg(msg);
      });
      setSuccess(true);
      setStatusMsg("Import completed successfully!");
      setConfirmFile(null);
    } catch (err: any) {
      setError(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      style={{
        padding: "var(--space-10) 60px",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--apple-font-display)",
          fontSize: "var(--font-size-3xl)",
          fontWeight: 700,
          marginBottom: "var(--space-10)",
        }}
      >
        Settings
      </h1>

      {/* ── Appearance & Customization Section ───────────────────────────────────── */}
      <section
        style={{
          background: "var(--apple-fill)",
          borderRadius: "var(--radius-xl)",
          padding: 30,
          border: "1px solid var(--apple-separator)",
          marginBottom: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--space-4)"}}>
          <Palette size={24} color="var(--apple-accent)" />
          <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 600 }}>Appearance & Customization</h2>
        </div>

        <p style={{ color: "var(--apple-secondary-label)", marginBottom: "var(--space-6)", lineHeight: 1.5 }}>
          Personalize your library&apos;s look and feel by choosing an accent color and selecting your preferred color theme.
        </p>

        {/* Accent Color Swatches */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: "var(--font-size-base)", fontWeight: 600, color: "var(--apple-label)", marginBottom: "var(--space-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Accent Color
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {ACCENT_OPTIONS.map((opt) => {
              const isSelected = accentColor === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAccentColorChange(opt.id)}
                  aria-label={`Select ${opt.name} accent`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "var(--space-2) 14px",
                    borderRadius: 20,
                    background: isSelected ? `${opt.hex}22` : "var(--apple-tertiary-bg)",
                    border: isSelected ? `2px solid ${opt.hex}` : "1px solid var(--apple-separator)",
                    color: isSelected ? opt.hex : "var(--apple-label)",
                    fontSize: "var(--font-size-base)",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    boxShadow: isSelected ? `0 0 12px ${opt.hex}44` : "none",
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: opt.hex,
                      display: "inline-block",
                    }}
                  />
                  {opt.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Mode Toggle */}
        <div>
          <div style={{ fontSize: "var(--font-size-base)", fontWeight: 600, color: "var(--apple-label)", marginBottom: "var(--space-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Color Theme
          </div>
          <div style={{ display: "inline-flex", background: "var(--apple-tertiary-bg)", padding: "var(--space-1)", borderRadius: 12, border: "1px solid var(--apple-separator)", gap: 4 }}>
            <button
              type="button"
              onClick={() => handleThemeModeChange("dark")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "var(--space-2) var(--space-4)",
                borderRadius: 8,
                background: themeMode === "dark" ? "var(--apple-accent)" : "transparent",
                color: themeMode === "dark" ? "var(--apple-white)" : "var(--apple-label)",
                border: "none",
                fontSize: "var(--font-size-base)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              <Moon size={16} /> Dark
            </button>
            <button
              type="button"
              onClick={() => handleThemeModeChange("light")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "var(--space-2) var(--space-4)",
                borderRadius: 8,
                background: themeMode === "light" ? "var(--apple-accent)" : "transparent",
                color: themeMode === "light" ? "var(--apple-white)" : "var(--apple-label)",
                border: "none",
                fontSize: "var(--font-size-base)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              <Sun size={16} /> Light
            </button>
            <button
              type="button"
              onClick={() => handleThemeModeChange("system")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "var(--space-2) var(--space-4)",
                borderRadius: 8,
                background: themeMode === "system" ? "var(--apple-accent)" : "transparent",
                color: themeMode === "system" ? "var(--apple-white)" : "var(--apple-label)",
                border: "none",
                fontSize: "var(--font-size-base)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              <Monitor size={16} /> System
            </button>
          </div>
        </div>
      </section>

      <section
        style={{
          background: "var(--apple-fill)",
          borderRadius: "var(--radius-xl)",
          padding: 30,
          border: "1px solid var(--apple-separator)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--space-4)"}}>
          <Database size={24} color="var(--apple-accent)" />
          <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 600 }}>Data Backup & Restore</h2>
        </div>

        <p style={{ color: "var(--apple-secondary-label)", marginBottom: 30, lineHeight: 1.5 }}>
          Your data is stored locally in your browser's IndexedDB. You can export your library, logs, and lists to a portable JSON file. The export excludes heavy catalog data (like game summaries and covers) because they will be automatically re-fetched during import, keeping your backup file small and safe.
        </p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={handleExport}>
            <Download size={18} />
            Export Backup
          </Button>

          <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} />
            Import Backup...
          </Button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={onFileSelected}
            style={{ display: "none" }}
          />
        </div>

        {/* Import Confirmation Dialog */}
        {confirmFile && !importing && (
          <div
            style={{
              marginTop: 30,
              padding: "var(--space-5)",
              background: "rgba(255, 150, 0, 0.1)",
              border: "1px solid rgba(255, 150, 0, 0.3)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--apple-orange)", marginBottom: "var(--space-3)"}}>
              <AlertTriangle size={20} />
              <strong style={{ fontSize: "var(--font-size-lg)"}}>Import Confirmation</strong>
            </div>
            <p style={{ color: "var(--apple-secondary-label)", marginBottom: "var(--space-5)", fontSize: 14 }}>
              You selected <strong>{confirmFile.name}</strong>. How would you like to apply this data?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <Button variant="secondary" onClick={() => handleImport("merge")}>
                Merge (Add & Update)
              </Button>
              <Button variant="danger" onClick={() => handleImport("replace")}>
                <Trash2 size={16} />
                Wipe & Replace
              </Button>
              <Button variant="ghost" onClick={() => setConfirmFile(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Progress UI */}
        {importing && (
          <div style={{ marginTop: 30 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)", fontSize: 14, color: "var(--apple-secondary-label)" }}>
              <span>{statusMsg}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 6, background: "var(--apple-separator)", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  background: "var(--apple-accent)",
                  width: `${progress}%`,
                  transition: "width 0.2s ease-out",
                }}
              />
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div style={{ marginTop: "var(--space-5)", padding: "var(--space-3)", background: "rgba(255,50,50,0.1)", color: "var(--apple-red)", borderRadius: "var(--radius-md)", display: "flex", gap: 8, alignItems: "center" }}>
            <AlertTriangle size={18} />
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginTop: "var(--space-5)", padding: "var(--space-3)", background: "rgba(50,200,50,0.1)", color: "var(--apple-green)", borderRadius: "var(--radius-md)", display: "flex", gap: 8, alignItems: "center" }}>
            <CheckCircle2 size={18} />
            {statusMsg}
          </div>
        )}
      </section>

      {/* ── Platform Integrations & Library Imports ─────────────────────────────── */}
      <section
        style={{
          marginTop: "var(--space-10)",
          background: "var(--apple-fill)",
          borderRadius: "var(--radius-xl)",
          padding: 30,
          border: "1px solid var(--apple-separator)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--space-4)"}}>
          <Gamepad2 size={24} color="var(--apple-accent)" />
          <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 600 }}>Platform Integrations & Library Imports</h2>
        </div>

        <p style={{ color: "var(--apple-secondary-label)", marginBottom: "var(--space-5)", lineHeight: 1.5 }}>
          Import your game library and playtimes from major gaming platforms and launchers.
        </p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: "var(--space-6)", borderBottom: "1px solid var(--apple-separator)", paddingBottom: "var(--space-3)", overflowX: "auto" }}>
          {(["Steam", "PSN", "Xbox", "GOG"] as const).map((tab) => {
            const isSelected = platformTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setPlatformTab(tab);
                  setPlatformMatches([]);
                  setPlatformSuccessMsg("");
                }}
                style={{
                  padding: "var(--space-2) 18px",
                  borderRadius: 20,
                  background: isSelected ? "var(--apple-accent)" : "var(--apple-tertiary-bg)",
                  color: isSelected ? "var(--apple-white)" : "var(--apple-label)",
                  border: isSelected ? "none" : "1px solid var(--apple-separator)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                {tab === "PSN" ? "PlayStation (PSN)" : tab === "Xbox" ? "Xbox Live" : tab === "GOG" ? "GOG Galaxy" : "Steam"}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Steam */}
        {platformTab === "Steam" && (
          <div>
            <p style={{ color: "var(--apple-secondary-label)", marginBottom: "var(--space-5)", lineHeight: 1.5, fontSize: 14 }}>
              Connect your public Steam profile to automatically import all owned games and playtimes.
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="SteamID64 (e.g. 7656119...)"
                value={steamId}
                onChange={handleSteamIdChange}
                style={{
                  padding: "10px var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--apple-separator)",
                  background: "var(--apple-window-bg)",
                  color: "var(--apple-label)",
                  fontSize: 15,
                  width: 260,
                }}
              />
              <Button
                variant="primary"
                onClick={() => navigate("/import/steam")}
                disabled={!steamId.trim()}
              >
                <PlayCircle size={18} />
                Fetch from Steam
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2/3/4: PSN, Xbox, GOG */}
        {platformTab !== "Steam" && (
          <div>
            <p style={{ color: "var(--apple-secondary-label)", marginBottom: "var(--space-4)", lineHeight: 1.5, fontSize: 14 }}>
              Paste your exported list, CSV, or titles from <strong>{platformTab === "PSN" ? "PlayStation / PSNProfiles" : platformTab === "Xbox" ? "Xbox / TrueAchievements" : "GOG Galaxy"}</strong> (one title per line, or Title, Hours).
            </p>

            <textarea
              placeholder={`Example:\nThe Witcher 3: Wild Hunt, 120h\nCyberpunk 2077, 65h\nGod of War Ragnarök`}
              value={platformText}
              onChange={(e) => setPlatformText(e.target.value)}
              rows={5}
              style={{
                width: "100%",
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--apple-separator)",
                background: "var(--apple-window-bg)",
                color: "var(--apple-label)",
                fontSize: 14,
                fontFamily: "var(--apple-font-mono)",
                marginBottom: "var(--space-4)",
                resize: "vertical",
              }}
            />

            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: "var(--space-5)"}}>
              <Button
                variant="primary"
                onClick={handleRunPlatformMatch}
                disabled={!platformText.trim() || platformImporting}
              >
                {platformImporting ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                Match & Preview {platformTab} List
              </Button>
            </div>

            {platformImporting && (
              <div style={{ padding: "var(--space-3)", background: "var(--apple-tertiary-bg)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, marginBottom: "var(--space-4)"}}>
                <Loader2 size={18} color="var(--apple-accent)" />
                <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-label)" }}>{platformStatus || "Processing..."}</span>
                <span style={{ fontSize: "var(--font-size-base)", color: "var(--apple-secondary-label)", marginLeft: "auto" }}>{platformProgress}%</span>
              </div>
            )}

            {platformSuccessMsg && (
              <div style={{ padding: 14, background: "rgba(50, 200, 50, 0.15)", border: "1px solid var(--apple-green)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, marginBottom: "var(--space-5)", color: "var(--apple-green)" }}>
                <CheckCircle2 size={18} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{platformSuccessMsg}</span>
              </div>
            )}

            {/* Matches Preview Table */}
            {platformMatches.length > 0 && (
              <div style={{ background: "var(--apple-window-bg)", border: "1px solid var(--apple-separator)", borderRadius: 14, padding: "var(--space-4)"}}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid var(--apple-separator)" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--apple-label)" }}>
                    Matched Games ({platformSelectedIds.size} of {platformMatches.length} selected)
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmPlatformImport}
                    disabled={platformSelectedIds.size === 0 || platformImporting}
                    style={{ background: "var(--apple-green)" }}
                  >
                    <Check size={16} /> Import Selected to Backlog
                  </Button>
                </div>

                <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {platformMatches.map((match) => {
                    const id = match.imported.sourceId;
                    const isChecked = platformSelectedIds.has(id);
                    const imgUrl = match.igdbGame?.coverUrl;

                    return (
                      <label
                        key={id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "var(--space-2) var(--space-3)",
                          borderRadius: 8,
                          background: isChecked ? "var(--apple-tertiary-bg)" : "transparent",
                          border: "1px solid var(--apple-separator)",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!match.igdbGame}
                          onChange={(e) => {
                            const next = new Set(platformSelectedIds);
                            if (e.target.checked) next.add(id);
                            else next.delete(id);
                            setPlatformSelectedIds(next);
                          }}
                          style={{ width: 16, height: 16, accentColor: "var(--apple-accent)" }}
                        />

                        <div style={{ width: 28, height: 36, borderRadius: 4, overflow: "hidden", background: "var(--apple-fill)", flexShrink: 0 }}>
                          {imgUrl && <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "var(--font-size-base)", fontWeight: 600, color: "var(--apple-label)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {match.igdbGame ? match.igdbGame.title : match.imported.sourceName}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--apple-secondary-label)" }}>
                            {match.igdbGame ? `Matched IGDB Catalog (${match.igdbGame.releaseYear || "Year?"})` : "No match found in catalog"}
                            {match.imported.timePlayedHours ? ` • ${match.imported.timePlayedHours}h played` : ""}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px var(--space-2)",
                            borderRadius: 6,
                            background: match.confidence === "high" ? "rgba(50, 215, 75, 0.2)" : match.confidence === "low" ? "rgba(255, 159, 10, 0.2)" : "rgba(255, 69, 58, 0.2)",
                            color: match.confidence === "high" ? "var(--apple-green)" : match.confidence === "low" ? "var(--apple-orange)" : "var(--apple-red)",
                          }}
                        >
                          {match.confidence === "high" ? "Exact Match" : match.confidence === "low" ? "Fuzzy Match" : "Unmatched"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
