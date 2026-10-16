import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createApp } from '../src/app.js'

// 起一个随机端口的真实服务（listen(0)），用全局 fetch 打真实 HTTP —— 不引 supertest。
function withServer(t) {
  return new Promise((resolve) => {
    const server = createApp().listen(0, () => {
      const base = `http://127.0.0.1:${server.address().port}`
      t.after(() => server.close())
      resolve(base)
    })
  })
}

test('GET /api/health 返回 200 与 ok:true', async (t) => {
  const base = await withServer(t)
  const res = await fetch(`${base}/api/health`)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.ok, true)
  assert.equal(typeof body.uptime, 'number')
})

test('CORS：允许清单内的 Origin 会拿到响应头', async (t) => {
  const base = await withServer(t)
  const res = await fetch(`${base}/api/health`, {
    headers: { Origin: 'http://localhost:5173' },
  })
  assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173')
})

test('CORS：清单外的 Origin 拿不到响应头', async (t) => {
  const base = await withServer(t)
  const res = await fetch(`${base}/api/health`, {
    headers: { Origin: 'https://evil.example.com' },
  })
  assert.equal(res.headers.get('access-control-allow-origin'), null)
})

test('未命中路由返回 JSON 404', async (t) => {
  const base = await withServer(t)
  const res = await fetch(`${base}/api/nope`)
  assert.equal(res.status, 404)
  assert.equal((await res.json()).ok, false)
})
