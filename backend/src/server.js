import { createApp } from './app.js'
import { config } from './config.js'

createApp().listen(config.port, () => {
  console.log(`演易后端已启动：http://localhost:${config.port}/api/health`)
})
