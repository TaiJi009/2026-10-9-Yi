import { expect, test } from 'vitest'
import { SCAFFOLD_OK } from '../smoke'

test('脚手架冒烟：Vitest 能跑 TS 源码', () => {
  expect(SCAFFOLD_OK).toBe(true)
})
