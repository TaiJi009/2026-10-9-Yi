/* ==========================================================================
   ANIM —— WAAPI 封装 + 全局注册表 + epoch 取消（逐字移植 L575–611）

   ★ 这个文件是整套移植里唯一「一个字都不改逻辑」的部分。
     epoch / cancelAll / alive 的语义是屏间切换正确性的地基，
     任何「顺手优化」都会让在飞的动画泄漏到下一屏。
   ========================================================================== */

import { EASE } from '../core/data'

const anims = new Set<Animation>()
let epoch = 0
const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
let mul = mq.matches ? 0.15 : 1
if (mq.addEventListener)
  mq.addEventListener('change', (e) => {
    mul = e.matches ? 0.15 : 1
  })

const d = (ms: number) => Math.max(16, Math.round(ms * mul))

function reg(a: Animation) {
  anims.add(a)
  a.finished
    .catch(() => {})
    .then(() => anims.delete(a))
  return a
}

// 切屏解药：取消一切在飞动画。★ 错综页连点绝不可用它（见 STAGE）。
function cancelAll() {
  epoch++
  anims.forEach((a) => {
    try {
      a.cancel()
    } catch {
      /* 已结束的动画 cancel 会抛，忽略 */
    }
  })
  anims.clear()
}

const cur = () => epoch
const alive = (e: number) => e === epoch

export interface PlayOpts {
  duration?: number
  delay?: number
  easing?: string
  fill?: FillMode
}

function play(el: Animatable, kf: Keyframe[], opt: PlayOpts = {}) {
  return reg(
    el.animate(kf as Keyframe[], {
      duration: d(opt.duration != null ? opt.duration : 300),
      delay: d(opt.delay || 0),
      easing: opt.easing || EASE.settle,
      fill: opt.fill || 'both',
    }),
  )
}

const await_ = (a: Animation) => a.finished.catch(() => {})
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, d(ms)))

/**
 * 淡入并把终态「提交」到内联样式。
 *
 * ★ 为什么不能直接用 fill:'forwards'：
 *   切屏会调 cancelAll()，在飞动画被取消时 forwards 的效果一并消失，
 *   元素弹回 CSS 基态 —— 而 .hex-name / .hex-sub 这类元素的基态就是 opacity:0，
 *   于是「入场动画跑完 → 又看不见」。
 * ★ 为什么跑完要 cancel()：
 *   留着 forwards 会长期压住内联与类规则，后续想把它淡出（如 clearShow）会被顶。
 *   所以：完成 → 写内联 → 撤动画。内联压过类规则，cancelAll 也冲不掉。
 * ★ 被取消时（await 抛错）故意不提交：半途夭折的入场不该留下半亮状态。
 */
async function reveal(el: HTMLElement | null, kf: Keyframe[], opt: PlayOpts = {}) {
  if (!el) return
  const a = play(el, kf, { ...opt, fill: 'forwards' })
  try {
    await a.finished
  } catch {
    return // 被取消：交回基态
  }
  el.style.opacity = '1'
  try {
    a.cancel()
  } catch {
    /* 已结束 */
  }
}

export const ANIM = {
  reg,
  cancelAll,
  cur,
  alive,
  play,
  await_,
  sleep,
  d,
  reveal,
  reduced: () => mq.matches,
}
