/* ==========================================================================
   大衍筮法概率 —— 移植自 ?debug 自检（L1852–1857）

   N 与容差原样保留：16 万次抽样在 Node 里约 50ms，没有任何理由跳过或降规模。
   ========================================================================== */

import { expect, it } from 'vitest'
import { drawValue } from '../rules'

it('大衍筮法 16 万样本符合 1:5:7:3', () => {
  const counts: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0 }
  const N = 160000
  for (let i = 0; i < N; i++) counts[drawValue()]++
  expect(Math.abs(counts[6] / N - 0.0625)).toBeLessThan(0.005)
  expect(Math.abs(counts[7] / N - 0.3125)).toBeLessThan(0.006)
  expect(Math.abs(counts[8] / N - 0.4375)).toBeLessThan(0.006)
  expect(Math.abs(counts[9] / N - 0.1875)).toBeLessThan(0.005)
})
