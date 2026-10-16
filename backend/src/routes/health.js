import { Router } from 'express'

export const healthRouter = Router()

// 健康检查：部署与联调时用来确认后端活着
healthRouter.get('/', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: Date.now() })
})
