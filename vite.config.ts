import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  server: {
    /** 同一區網可用 Network 網址；手機勿用 localhost，要用電腦的 IP */
    host: true,
    port: 5173,
    /** 先開首頁（若自動開分頁卡死，請改 false 後手動輸入網址） */
    open: '/',
  },
  optimizeDeps: {
    /** 開發時預編譯，避免 Three / R3F 第一次載入卡住或報錯 */
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    dedupe: ['three', 'react', 'react-dom'],
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
