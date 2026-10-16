// 兜底：未命中的路由统一返回 JSON 404，而不是 Express 默认 HTML
export function notFound(req, res) {
  res.status(404).json({ ok: false, error: 'Not Found', path: req.path })
}
