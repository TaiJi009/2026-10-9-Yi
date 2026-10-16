import { Router } from 'express'
import { healthRouter } from './health.js'

// 所有 /api 路由在此聚合。
// 未来功能挂载点（尚未实现）：
//   app.use('/api/hexagrams', hexagramRouter)  —— 六十四卦数据 API
//   app.use('/api/records', recordRouter)      —— 用户占卜记录
export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
