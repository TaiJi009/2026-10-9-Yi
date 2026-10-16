/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pages 子路径部署 —— 改动会让线上资源 404（deploy.yml 有哨兵检查）
  base: '/2026-10-9-Yi/',
  server: {
    proxy: {
      // 本地联调：前端请求 /api 时转发到本机后端（backend/，端口 8787）
      '/api': 'http://localhost:8787',
    },
  },
  test: {
    environment: 'node', // core/ 测试是纯逻辑，无需 jsdom
  },
})
