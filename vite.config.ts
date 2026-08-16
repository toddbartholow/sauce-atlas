import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build` emits dist/index.html as one self-contained file.
// Drop the singlefile plugin if you would rather deploy normal chunked assets.
export default defineConfig({
  // Editors and sync tools drop locked .~tmp files next to sauce-atlas.jpg;
  // watching one kills the dev server with EBUSY on Windows.
  server: { host: true, watch: { ignored: ['**/*.~tmp'] } },
  plugins: [vue(), viteSingleFile()],
  build: { assetsInlineLimit: 100000000, cssCodeSplit: false }
})
