import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve, dirname } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Plugin to transform manifest.json for Chrome (converts scripts to service_worker)
function chromeManifestPlugin() {
  return {
    name: 'chrome-manifest-transform',
    writeBundle() {
      // Skip transformation if building for Firefox
      if (process.env.BROWSER === 'firefox') {
        return
      }
      
      const manifestPath = resolve(__dirname, 'dist/manifest.json')
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
        
        // Transform for Chrome: use service_worker instead of scripts
        if (manifest.background?.scripts) {
          manifest.background = {
            service_worker: manifest.background.scripts[0],
            type: manifest.background.type || 'module'
          }
        }
        
        // Remove Firefox-specific settings for Chrome dev build
        delete manifest.browser_specific_settings
        
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
      } catch (e) {
        // Manifest might not exist yet during first build
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), chromeManifestPlugin()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        options: resolve(__dirname, 'index.html'),
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})
