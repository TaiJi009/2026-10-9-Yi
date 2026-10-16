// 兜底：任何路由抛错都在这里收口，避免把堆栈泄漏给客户端
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)
  const status = err.status ?? err.statusCode ?? 500
  if (status >= 500) console.error(err)
  res.status(status).json({ ok: false, error: status >= 500 ? 'Internal Server Error' : err.message })
}
