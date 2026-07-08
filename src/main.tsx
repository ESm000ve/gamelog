import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { seedIfEmpty } from "./db/seed";

// Seed prototype data on first launch (no-ops if DB already has entries)
seedIfEmpty().catch(console.error);

const root = document.getElementById("root");
if (!root) throw new Error("No #root element found.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
