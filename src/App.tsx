import { useState } from "react";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import { Sidebar } from "./shell/Sidebar";
import { LibraryScreen } from "./screens/Library/LibraryScreen";
import { DebugStoreScreen } from "./screens/DebugStoreScreen";
import { GlobalSearch } from "./shell/GlobalSearch";
import { AddGameModal } from "./screens/Library/AddGameModal";
import { LogEditor } from "./screens/LogEditor";
import { GameDetailScreen } from "./screens/GameDetail/GameDetailScreen";
import { RelatedGamesPage } from "./screens/GameDetail/RelatedGamesPage";
import { ListsScreen } from "./screens/Lists/ListsScreen";
import { SingleListScreen } from "./screens/Lists/SingleListScreen";
import { AddToListSheet } from "./screens/Lists/AddToListSheet";
import { StatsScreen } from "./screens/Stats/StatsScreen";
import { RecommendScreen } from "./screens/Recommend/RecommendScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { ImportReviewScreen } from "./screens/ImportReviewScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { SystemsScreen } from "./screens/Systems/SystemsScreen";
import { FriendsScreen } from "./screens/Friends/FriendsScreen";
import { ActivityScreen } from "./screens/Activity/ActivityScreen";
import { CommandPalette } from "./components/CommandPalette";
import { applyTheme } from "./services/theme";
import { db } from "./db/schema";
import { GamesRepo } from "./db/repositories/GamesRepo";
import type { Game, Log } from "./types";
import "./styles/index.css";

interface LogEditorTarget { game: Game; log: Log; prefill?: Partial<Log>; }
interface AddToListTarget { igdbId: number; title: string; }

function SingleListRoute({ onOpenGame }: { onOpenGame: (igdbId: number) => void }) {
  const { listId } = useParams();
  const navigate = useNavigate();
  if (!listId) return null;
  return (
    <SingleListScreen
      listId={listId}
      onBack={() => navigate("/lists")}
      onOpenGame={onOpenGame}
    />
  );
}

function AppInner() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    applyTheme();
  }, []);

  // Run backfill for missing embeddings and dates
  useEffect(() => {
    GamesRepo.backfillEmbeddings();
    GamesRepo.backfillReleaseDates();
  }, []);

  // Mac trackpad swipe-to-navigate
  useEffect(() => {
    let lastTime = 0;
    const handleWheel = (e: WheelEvent) => {
      // Must be primarily horizontal and a significant swipe
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 40) {
        const now = Date.now();
        if (now - lastTime < 600) return; // Debounce

        // Ensure we are not scrolling a horizontal container (e.g. Related Games)
        let target = e.target as HTMLElement | null;
        let isScrollable = false;
        while (target && target !== document.body) {
          const style = window.getComputedStyle(target);
          if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
            if (target.scrollWidth > target.clientWidth) {
              // Check if we are not at the extreme edge
              if (e.deltaX < 0 && target.scrollLeft > 0) isScrollable = true;
              if (e.deltaX > 0 && target.scrollLeft + target.clientWidth < target.scrollWidth - 1) isScrollable = true;
              if (isScrollable) break;
            }
          }
          target = target.parentElement;
        }

        if (isScrollable) return;

        if (e.deltaX < -40 && window.history.length > 1) {
          // Swipe left-to-right to go BACK
          navigate(-1);
          lastTime = now;
        } else if (e.deltaX > 40) {
          // Swipe right-to-left to go FORWARD
          navigate(1);
          lastTime = now;
        }
      }
    };
    
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [navigate]);

  const [addGameOpen,     setAddGameOpen]     = useState(false);
  const [logEditorTarget, setLogEditorTarget] = useState<LogEditorTarget | null>(null);
  const [addToListTarget, setAddToListTarget] = useState<AddToListTarget | null>(null);

  useEffect(() => {
    const handleOpenAdd = () => setAddGameOpen(true);
    window.addEventListener("gamelog:open-add-game", handleOpenAdd);
    return () => window.removeEventListener("gamelog:open-add-game", handleOpenAdd);
  }, []);

  const openAddGame = () => {
    setAddGameOpen(true);
  };

  const openLogEditor = async (igdbId: number, prefill?: Partial<Log>) => {
    const [game, log] = await Promise.all([db.games.get(igdbId), db.logs.get(igdbId)]);
    if (game && log) setLogEditorTarget({ game, log, prefill });
  };

  const openAddToList = (igdbId: number, title: string) => {
    setAddToListTarget({ igdbId, title });
  };

  const openGame = (igdbId: number) => navigate(`/game/${igdbId}`);



  return (
    <div style={{ display: "flex", width: "100%", height: "100vh", overflow: "hidden", background: "var(--apple-window-bg)", fontFamily: "var(--apple-font-text)" }}>
      <Sidebar onAddGame={openAddGame} />

      <Routes>
        <Route path="/" element={<LibraryScreen onAddGame={openAddGame} onOpenLog={openLogEditor} onOpenGame={openGame} />} />
        <Route path="/search" element={<SearchScreen onOpenGame={openGame} onOpenLog={openLogEditor} />} />
        <Route path="/lists" element={<ListsScreen onOpenList={(id) => navigate(`/lists/${id}`)} />} />
        <Route path="/lists/:listId" element={<SingleListRoute onOpenGame={openGame} />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/recommend" element={<RecommendScreen />} />
        <Route path="/activity" element={<ActivityScreen />} />
        <Route path="/friends" element={<FriendsScreen />} />
        <Route path="/systems" element={<SystemsScreen onOpenGame={openGame} onOpenLog={openLogEditor} />} />
        <Route path="/systems/:platformId" element={<SystemsScreen onOpenGame={openGame} onOpenLog={openLogEditor} />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/import/steam" element={<ImportReviewScreen />} />
        <Route path="/debug" element={<DebugStoreScreen />} />
        <Route
          path="/game/:igdbId"
          element={
            <GameDetailScreen
              onOpenLog={openLogEditor}
              onOpenGame={openGame}
              onOpenAddToList={openAddToList}
            />
          }
        />
        <Route path="/game/:igdbId/related" element={<RelatedGamesPage onOpenGame={openGame} />} />
      </Routes>

      {location.pathname !== "/search" && (
        <GlobalSearch onGameAdded={(id, prefill) => openLogEditor(id, prefill)} />
      )}

      {/* Add Game modal */}
      {addGameOpen && (
        <AddGameModal
          onClose={() => setAddGameOpen(false)}
          onGameAdded={(igdbId, prefill) => {
            setAddGameOpen(false);
            openLogEditor(igdbId, prefill);
          }}
        />
      )}

      {/* Log Editor modal */}
      {logEditorTarget && (
        <LogEditor
          game={logEditorTarget.game}
          log={logEditorTarget.log}
          prefill={logEditorTarget.prefill}
          onClose={() => setLogEditorTarget(null)}
          onDelete={() => setLogEditorTarget(null)}
        />
      )}

      {/* Add to list sheet */}
      {addToListTarget && (
        <AddToListSheet
          igdbId={addToListTarget.igdbId}
          title={addToListTarget.title}
          onClose={() => setAddToListTarget(null)}
        />
      )}

      {/* ⌘K Command Palette */}
      <CommandPalette />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
