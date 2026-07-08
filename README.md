# Gamelog

A personal game library tracker with a beautiful macOS-inspired interface.

## Running It

**Minimum Requirements:** Node.js version 18 or higher.

To start the app, simply double-click the `start.command` script in the root of the project. 
This will automatically verify your Node version, install any missing dependencies, and launch the development server.

Alternatively, you can run `./run.sh` from the terminal, or manually start it using:
```bash
npm install
npm run dev
```

## Where My Data Lives

All of your data (library entries, logs, and lists) is securely stored locally on your machine using IndexedDB, built into your browser. Here is where the data is physically located on disk depending on your default browser (macOS):

- **Safari:** `~/Library/Safari/Databases/` or `~/Library/Containers/com.apple.Safari/Data/Library/WebKit/Databases/`
- **Chrome / Brave:** `~/Library/Application Support/Google/Chrome/Default/IndexedDB/`
- **Firefox:** `~/Library/Application Support/Firefox/Profiles/<profile-folder>/storage/default/`

Your data never leaves your device unless you explicitly export it.

## Packaging Assessment (Tauri vs. Electron)

If you'd like to bundle Gamelog into a standalone, double-clickable `.app` for macOS in the future without needing a terminal, here are the two main options:

1. **Tauri:**
   - **Tradeoffs:** Results in an extremely small app size (often under 10MB) and very low memory usage because it uses the system's native WebView (WebKit on macOS) rather than bundling a whole browser. 
   - **Requirements:** Requires installing Rust on your machine to compile the native wrapper.
2. **Electron:**
   - **Tradeoffs:** Much larger app size (typically 100MB+) and higher RAM usage because it bundles a full Chromium browser. However, it guarantees cross-platform consistency since you control the browser engine, and it uses pure JavaScript/TypeScript for both the UI and backend logic.