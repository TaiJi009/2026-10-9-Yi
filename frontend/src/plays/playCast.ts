/* ==========================================================================
   屏 3 · 起卦（逐字移植 PLAYS.cast L1563–1635）

   ★ 与原型的结构差异：爻槽不再由本函数创建，而是 React 已经挂好的 6 个 .slot（refs.slots）。
   ★ 时序差异：三段的时长与拍间留白全部取自 `DUR.cast*`（2026-10-28 起整体 ×0.8），
     本函数内不再出现裸毫秒数——调节奏只改 data.ts，三段比例与次序由 cast-rhythm.test.ts 钉住。
     写 STORE 的时机、counter 更新、epoch 取消检查，全照旧。
   ========================================================================== */

import { ANIM } from '../anim/anim'
import { DUR, EASE, LINE_CN, VAL_NAME } from '../core/data'
import type { YaoValue } from '../core/types'
import * as RULES from '../core/rules'
import { STORE } from '../state/store'

export interface CastRefs {
  slots: HTMLElement[] // 6 个 .slot，index 0 = 初爻
  yaos: HTMLElement[] // 对应的 .yao
  vals: HTMLElement[] // 对应的 .val
  counter: HTMLElement // #cast-n
}

export interface CastDeps {
  onDone: () => void // 原 FSM.goto('settle')
}

export async function playCast(refs: CastRefs, deps: CastDeps) {
  const epoch = ANIM.cur()
  const { slots, yaos, vals, counter } = refs
  const values: YaoValue[] = [],
    bits: number[] = [],
    moves: boolean[] = []

  // 复位：重进本屏时爻槽回到 ghost 空槽态
  yaos.forEach((y, i) => {
    y.dataset.yang = '0'
    y.dataset.ghost = '1'
    delete y.dataset.moving
    y.style.opacity = ''
    y.getAnimations().forEach((a) => a.cancel())
    vals[i].classList.remove('live')
    vals[i].textContent = LINE_CN[i] + '爻'
  })
  counter.textContent = '0'

  for (let i = 0; i < 6; i++) {
    const slot = slots[i],
      yao = yaos[i],
      val = vals[i]
    const v = RULES.drawValue()
    const bit = v === 7 || v === 9 ? 1 : 0
    const moving = RULES.isMovingVal(v)

    // 蓄：抖动 + 占位由暗转亮
    const shake = ANIM.play(
      slot,
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-2.5px)' },
        { transform: 'translateX(2.5px)' },
        { transform: 'translateX(-1.5px)' },
        { transform: 'translateX(1.5px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: DUR.castCharge, easing: EASE.charge, fill: 'none' },
    )
    ANIM.play(yao, [{ opacity: 0.1 }, { opacity: 0.4 }], { duration: DUR.castCharge, easing: EASE.charge, fill: 'none' })
    await ANIM.await_(shake)
    if (!ANIM.alive(epoch)) return

    // 落：爻线归位
    delete yao.dataset.ghost
    yao.dataset.yang = bit ? '1' : '0'
    if (moving) yao.dataset.moving = '1'
    const drop = ANIM.play(yao, [
      { opacity: 0, transform: 'translateY(-46px) scale(.68)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ], { duration: DUR.castDrop, easing: EASE.drop })
    await ANIM.await_(drop)
    if (!ANIM.alive(epoch)) return

    // 显：动爻持续呼吸
    if (moving) {
      ANIM.play(yao.querySelector('.glow')!, [{ opacity: 0 }, { opacity: 0.95 }, { opacity: 0.5 }], {
        duration: DUR.castGlow,
        easing: EASE.settle,
        fill: 'none',
      })
      val.classList.add('live')
    }
    val.textContent = LINE_CN[i] + '爻 · ' + v + ' ' + VAL_NAME[v] + (moving ? ' · 动' : '')

    values.push(v)
    bits.push(bit)
    moves.push(moving)
    counter.textContent = String(i + 1)
    STORE.set({ values: values.slice(), bits: bits.slice(), moves: moves.slice() })

    await ANIM.sleep(i < 5 ? DUR.castGap : DUR.castGapLast)
    if (!ANIM.alive(epoch)) return
  }

  deps.onDone()
}

// 跳过：直接落定，不做逐爻动画
export function castInstant(deps: CastDeps) {
  const values: YaoValue[] = []
  for (let i = 0; i < 6; i++) values.push(RULES.drawValue())
  STORE.set({ values, bits: RULES.bitsOfValues(values), moves: RULES.movingOfValues(values) })
  deps.onDone()
}
