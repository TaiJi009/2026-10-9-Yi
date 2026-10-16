// 运行时配置：全部来自环境变量，带可用默认值。
export const config = {
  port: Number(process.env.PORT ?? 8787),
  // 空字符串会被 filter(Boolean) 清掉，所以默认值写在split之后
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .concat([
      'http://localhost:5173', // Vite 开发服务器
      'https://taiji009.github.io', // GitHub Pages 线上站点
    ]),
}
