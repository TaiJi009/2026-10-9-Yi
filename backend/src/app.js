import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFound } from './middleware/not-found.js'

// 导出工厂而非实例：测试可以 createApp() 起临时端口，不干扰真实进程。
export function createApp() {
  const app = express()

  app.use(express.json())
  app.use(
    cors({
      origin: (origin, cb) => {
        // 无 Origin：同源请求、curl、服务器端调用 —— 放行
        if (!origin) return cb(null, true)
        if (config.corsOrigins.includes(origin)) return cb(null, true)
        return cb(null, false) // 不在允许清单：不加 CORS 头，浏览器会拦
      },
      methods: ['GET', 'POST'],
    }),
  )

  app.use('/api', apiRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
