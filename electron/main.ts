import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { attachIgdbRoutes } from '../server/igdb.ts';
import { attachAiRoutes } from '../server/ai.ts';
import { attachSteamRoutes } from '../server/steam.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let win: BrowserWindow | null = null;

async function startExpressServer(): Promise<number> {
  return new Promise((resolve) => {
    const serverApp = express();
    serverApp.use(cors());
    serverApp.use(express.json());
    
    // Attach API routes
    attachIgdbRoutes(serverApp);
    attachAiRoutes(serverApp);
    attachSteamRoutes(serverApp);
    
    // Serve static files from the dist directory in production
    const distPath = path.join(__dirname, '../dist');
    serverApp.use(express.static(distPath));
    
    // Fallback for React Router
    serverApp.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    const listener = serverApp.listen(0, '127.0.0.1', () => {
      const port = (listener.address() as any).port;
      console.log(`Express API server running on port ${port}`);
      resolve(port);
    });
  });
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'), // vite-plugin-electron produces .mjs by default
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    // Development mode
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // Production mode
    const port = await startExpressServer();
    win.loadURL(`http://127.0.0.1:${port}`);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
