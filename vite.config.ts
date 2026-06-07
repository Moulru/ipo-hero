import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 프로젝트 사이트는 base가 '/<repo>/' 여야 함 → 배포 워크플로에서 VITE_BASE 주입.
// 로컬/Cloudflare/모바일은 기본 '/'.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
