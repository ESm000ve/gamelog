import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import { igdbBackend } from './server/igdb.ts'
import { aiBackend } from './server/ai.ts'
import { steamBackend } from './server/steam.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    igdbBackend(),
    aiBackend(),
    steamBackend(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: 'electron/preload.ts',
      },
      renderer: {}
    })
  ],
})
