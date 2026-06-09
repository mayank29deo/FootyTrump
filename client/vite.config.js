import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
  // Force a single copy of these — the repo sits under a parent that also has a
  // node_modules, and fs.allow:['..'] can otherwise surface a duplicate React.
  resolve: { dedupe: ['react', 'react-dom', 'react-router-dom'] },
})
