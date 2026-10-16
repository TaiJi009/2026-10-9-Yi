/* ==========================================================================
   STAGE —— 屏 5 错综演算：三栏对照 + 展示位（移植 index.html L1126–1465）

   ★ 硬约束：本卦框与展示位框同行、等几何、固定 gap。
     由此 dx/dy、交卦错身量 ±3*STEP、互卦的「源爻↔目标爻」映射全是常数。
     一旦让两框几何不同，这三个公式全部失效。

   ★ 展示位一定是「复制」本卦，不是移动本卦：
     本卦必须原地可见且不变（用户还要继续点别的卡），移动会留空框、也没法连点。

   ★ 连点绝不可用 ANIM.cancelAll()（那是切屏解药，会杀掉卡片入场尾帧）。
     只用局部 SHOW.seq + cancelGuest()。
   ========================================================================== */

import { ANIM } from '../anim/anim'
import { clearHot, fillStack, flipYao, qsa, setBracket, setHot, stackEl } from '../anim/yao-dom'
import { DUR, EASE } from '../core/data'
import * as RULES from '../core/rules'
import type { Bits, Variant } from '../core/types'
import { STORE } from '../state/store'
import { debounce } from '../util/util'

const S = {
  seq: 0,
  state: 'idle' as 'idle' | 'leaving' | 'traveling' | 'mutating' | 'shown',
  bits: null as Bits | null,
  name: '',
  cap: '',
  guest: null as HTMLElement | null,
  guestAnims: [] as Animation[],
}

let ben: Bits = [],
  moves: boolean[] = []
let benStack: HTMLElement, showStack: HTMLElement, benName: HTMLElement, showName: HTMLElement
let showCap: HTMLElement, brL: HTMLElement, brR: HTMLElement
let DX = 0,
  DY = 0,
  STEP = 0
let lastClickAt = 0
let boardRoot: ParentNode = document

/* ---- 度量：只在初始化与 resize 时各做一次（不是逐帧） ---- */

function measure() {
  const b = benStack.getBoundingClientRect()
  const z = showStack.getBoundingClientRect()
  DX = z.left - b.left
  DY = z.top - b.top
  const firstYao = benStack.querySelector<HTMLElement>('.yao')
  STEP = firstYao ? firstYao.offsetHeight + (parseFloat(getComputedStyle(benStack).rowGap) || 12) : 26
}

/* ---- 原语 ---- */

function resetBase() {
  clearHot(benStack)
  brL.classList.remove('on')
  brR.classList.remove('on')
  qsa<HTMLElement>('.yao', benStack).forEach((y) => {
    y.style.transform = ''
  })
  qsa<HTMLElement>('.card', boardRoot).forEach((c) => {
    delete c.dataset.active
  })
}

async function clearShow(my: number) {
  if (S.state === 'idle') return
  ANIM.play(showStack, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.96)' }], {
    duration: DUR.clearShow,
    fill: 'none',
  })
  ANIM.play(showName, [{ opacity: 1 }, { opacity: 0 }], { duration: DUR.clearShow, fill: 'none' })
  await ANIM.sleep(DUR.clearShow)
  if (my !== S.seq) return
  showStack.style.opacity = ''
  showName.textContent = ''
  S.bits = null
  S.state = 'idle'
}

// 复制一份本卦爻栈，绝对定位盖在本卦框（#ben-stack）上
function spawnGuest(bits: Bits) {
  const g = stackEl(bits, { moves })
  g.classList.add('f-stack', 'guest')
  g.dataset.phase = 'settled'
  const b = benStack.getBoundingClientRect()
  const frame = benStack.closest('.frame')!
  const f = frame.getBoundingClientRect()
  g.style.left = b.left - f.left + 'px'
  g.style.top = b.top - f.top + 'px'
  g.style.width = b.width + 'px'
  frame.append(g)
  S.guest = g
  S.guestAnims = []
  return g
}

function trackGuest(a: Animation) {
  if (a) S.guestAnims.push(a)
  return a
}

function cancelGuest() {
  if (!S.guest) return
  S.guestAnims.forEach((a) => {
    try {
      a.cancel()
    } catch {
      /* 已结束 */
    }
  })
  S.guest.remove()
  S.guest = null
  S.guestAnims = []
}

async function travel(guest: HTMLElement, my: number, arcUp: boolean) {
  const bow = arcUp ? 16 : -16
  trackGuest(
    ANIM.play(
      guest,
      [
        { transform: 'translate(0px,0px)' },
        { transform: 'translate(' + DX * 0.5 + 'px,' + (DY * 0.5 + bow) + 'px)' },
        { transform: 'translate(' + DX + 'px,' + DY + 'px)' },
      ],
      { duration: DUR.travel, easing: EASE.drop, fill: 'forwards' },
    ),
  )
  await ANIM.sleep(DUR.travel)
  return my === S.seq
}

async function flipLines(guest: HTMLElement, idx: number[], my: number) {
  const yao = qsa<HTMLElement>('.yao', guest)
  for (let j = 0; j < idx.length; j++) {
    if (my !== S.seq) return false
    await flipYao(yao[idx[j]], DUR.flip, 0)
  }
  return my === S.seq
}

async function rotateGuest(guest: HTMLElement, my: number) {
  S.guestAnims.forEach((a) => {
    try {
      a.cancel()
    } catch {
      /* 已结束 */
    }
  })
  S.guestAnims = []
  trackGuest(
    ANIM.play(
      guest,
      [
        { transform: 'translate(' + DX + 'px,' + DY + 'px) rotate(0deg)' },
        { transform: 'translate(' + DX + 'px,' + DY + 'px) rotate(180deg)' },
      ],
      { duration: DUR.rotate, easing: EASE.settle, fill: 'forwards' },
    ),
  )
  await ANIM.sleep(DUR.rotate)
  return my === S.seq
}

// 交卦：下卦去展示位的上卦位、上卦去展示位的下卦位
// ★ column-reverse 下 yao[0..2] 是下卦（初二三）、yao[3..5] 是上卦 —— 极易取反
async function swapTrigramTravel(guest: HTMLElement, my: number) {
  const yao = qsa<HTMLElement>('.yao', guest)
  const up = -3 * STEP,
    dn = 3 * STEP
  yao.slice(0, 3).forEach((y, i) => {
    // 下卦 → 上方
    y.style.zIndex = '1'
    ANIM.play(
      y,
      [
        { transform: 'translate(0px,0px)' },
        { transform: 'translate(' + DX * 0.5 + 'px,' + (up * 0.5 - 12) + 'px)' },
        { transform: 'translate(' + DX + 'px,' + up + 'px)' },
      ],
      { duration: DUR.travel, delay: i * 24, easing: EASE.drop, fill: 'forwards' },
    )
  })
  yao.slice(3, 6).forEach((y, i) => {
    // 上卦 → 下方
    y.style.zIndex = '2'
    ANIM.play(
      y,
      [
        { transform: 'translate(0px,0px)' },
        { transform: 'translate(' + DX * 0.5 + 'px,' + (dn * 0.5 + 12) + 'px)' },
        { transform: 'translate(' + DX + 'px,' + dn + 'px)' },
      ],
      { duration: DUR.travel, delay: i * 24, easing: EASE.drop, fill: 'forwards' },
    )
  })
  await ANIM.sleep(DUR.travel + 2 * 24)
  return my === S.seq
}

// 互卦：本卦上框选 + 去爻变暗 / 留爻变亮
function bracketKept(hu: { lower: number[]; upper: number[]; removed: number[] }) {
  setHot(benStack, hu.removed, 'dim')
  setHot(benStack, hu.lower.concat(hu.upper), 'kept')
  setBracket(brL, hu.lower, true)
  setBracket(brR, hu.upper, true)
}

// 互卦：展示位「从无到有」淡显被框选的爻（位于源槽），再裂变到目标槽
//   ★ 目标第 j 爻的源下标 src = j<3 ? lower[j] : upper[j]
//     lower/upper 各 3 项 ⇒ 目标恒 6 槽；源只有 4 或 5 个不同下标（会重叠）。
//     重叠的源同时供两个目标 ⇒ 必裂成两条。对 5 种模式统一生效。
async function mutualBurst(v: Variant, my: number) {
  const hu = v.hu!
  const src = (j: number) => (j < 3 ? hu.lower[j] : hu.upper[j])

  bracketKept(hu)
  ANIM.play(benStack, [{ opacity: 1 }, { opacity: 0.82 }, { opacity: 1 }], { duration: DUR.reveal, fill: 'none' })
  await ANIM.sleep(520)
  if (my !== S.seq) return false

  const yao = qsa<HTMLElement>('.yao', showStack)
  yao.forEach((y, j) => {
    const s = src(j)
    y.dataset.yang = ben[s] ? '1' : '0'
    y.style.transform = 'translateY(' + ((j - s) * STEP) + 'px)'
    ANIM.play(y, [{ opacity: 0 }, { opacity: 1 }], { duration: DUR.reveal, delay: j * 30, fill: 'none' })
  })
  showStack.style.opacity = '1'
  await ANIM.sleep(DUR.reveal + 5 * 30)
  if (my !== S.seq) return false

  yao.forEach((y, j) => {
    ANIM.play(
      y,
      [
        { transform: 'translateY(' + ((j - src(j)) * STEP) + 'px)' },
        { transform: 'translateY(0px)' },
      ],
      { duration: DUR.fission, delay: j * 40, easing: EASE.drop, fill: 'forwards' },
    )
  })
  await ANIM.sleep(DUR.fission + 5 * 40)
  yao.forEach((y) => {
    y.style.transform = ''
  })
  return my === S.seq
}

function commit(bits: Bits, name: string, cap: string) {
  fillStack(showStack, bits, {})
  showStack.style.opacity = ''
  showName.textContent = name
  ANIM.play(showName, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, fill: 'none' })
  showCap.textContent = cap
  S.bits = bits.slice()
  S.name = name
  S.cap = cap
  S.state = 'shown'
}

/* ---- 五种变法的编配 ---- */

const RECIPES: Record<string, (v: Variant, my: number) => Promise<void>> = {
  // 变卦：本卦平移到展示位 → 对应那一爻变动
  async bian(v, my) {
    const g = spawnGuest(ben)
    if (!(await travel(g, my, true))) return
    if (!(await flipLines(g, [v.line!], my))) return
  },
  // 错卦：本卦平移到展示位 → 六爻同时阴阳翻转
  async cuo(_v, my) {
    const g = spawnGuest(ben)
    if (!(await travel(g, my, true))) return
    const yao = qsa<HTMLElement>('.yao', g)
    const anims = yao.map((y, i) => flipYao(y, DUR.flip, i * 55))
    await Promise.all(anims)
    await ANIM.sleep(120)
  },
  // 综卦：本卦平移到展示位 → 整卦旋转 180°
  async zong(_v, my) {
    const g = spawnGuest(ben)
    if (!(await travel(g, my, true))) return
    await rotateGuest(g, my)
  },
  // 交卦：下卦与上卦对调位置
  async jiao(_v, my) {
    const g = spawnGuest(ben)
    await swapTrigramTravel(g, my)
  },
  // 互卦：本卦框选 → 展示位淡显留爻 → 裂变成上下卦叠加
  async hu(v, my) {
    fillStack(showStack, [0, 0, 0, 0, 0, 0], {})
    showStack.style.opacity = '0'
    if (!(await mutualBurst(v, my))) return
  },
  // 本卦自身（不变化）
  async ben(_v, my) {
    const g = spawnGuest(ben)
    if (!(await travel(g, my, true))) return
    await ANIM.sleep(140)
  },
}

async function select(v: Variant) {
  // 120ms 输入去抖：暴击连点只保留最后一发
  const now = Date.now()
  if (now - lastClickAt < 120) return
  lastClickAt = now

  const my = ++S.seq
  cancelGuest() // 只杀在飞的复制体
  resetBase()
  await clearShow(my) // 5.6：旧卦先淡化消失
  if (my !== S.seq) return

  S.state = 'traveling'
  qsa<HTMLElement>('.card', boardRoot).forEach((c) => {
    if (c.dataset.slot === v.slot) c.dataset.active = '1'
  })

  const recipe = RECIPES[v.kind] || RECIPES.ben
  await recipe(v, my)
  if (my !== S.seq) return

  commit(v.bits, v.name, v.label)
  cancelGuest() // 撤掉复制体，露出已定稿的展示位
}

/* ---- 构建（卡片 DOM 由 React 渲染，这里只做测量与入场） ---- */

export interface StageRefs {
  root: HTMLElement // #network 屏
  benStack: HTMLElement
  showStack: HTMLElement
  benName: HTMLElement
  showName: HTMLElement
  showCap: HTMLElement
  brL: HTMLElement
  brR: HTMLElement
}

function init(epoch: number, refs: StageRefs) {
  void epoch // 保留参数：屏间一致性由 FSM 的 cancelAll 保证（与原型一致）
  boardRoot = refs.root
  const st = STORE.state
  ben = st.bits.slice()
  moves = st.moves.slice()

  benStack = refs.benStack
  showStack = refs.showStack
  benName = refs.benName
  showName = refs.showName
  showCap = refs.showCap
  brL = refs.brL
  brR = refs.brR

  // 本卦框
  fillStack(benStack, ben, { moves })
  benStack.dataset.phase = 'settled'
  benName.textContent = RULES.bitsToName(ben)
  ANIM.play(benName, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, fill: 'none' })

  // 展示位：先摆 6 个空槽（互卦演化要用），默认态由下面的 hasMove 分支决定
  fillStack(showStack, [0, 0, 0, 0, 0, 0], {})

  measure()

  // 默认态（5.0）：展示位 = 之卦（所有动爻一起变）；无动爻则留空
  const hasMove = moves.some(Boolean)
  if (hasMove) {
    const zb = RULES.zhiBits(ben, moves)
    S.bits = zb.slice()
    S.name = RULES.bitsToName(zb)
    S.cap = '之卦'
    S.state = 'shown'
    fillStack(showStack, zb, {})
    showName.textContent = S.name
    showCap.textContent = '之卦'
    showStack.style.opacity = '0'
    showName.style.opacity = '0'
    ANIM.play(showStack, [{ opacity: 0 }, { opacity: 1 }], { duration: 520, delay: 200, fill: 'none' })
    ANIM.play(showName, [{ opacity: 0 }, { opacity: 1 }], { duration: 520, delay: 260, fill: 'none' })
  } else {
    S.bits = null
    S.state = 'idle'
    showName.textContent = ''
    showCap.textContent = '无动爻'
  }

  // 卡片入场
  qsa<HTMLElement>('.card', boardRoot).forEach((el, i) => {
    ANIM.play(
      el,
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0px)' },
      ],
      { duration: 380, delay: i * 36, easing: EASE.settle, fill: 'none' },
    )
  })
}

/** 原 EVENTS.bindNetwork 的 resize 部分（FSM.current 由 App 传入） */
const bindResize = (isNetwork: () => boolean) => {
  const onResize = debounce(() => {
    if (isNetwork()) measure()
  }, 140)
  window.addEventListener('resize', onResize)
  return () => window.removeEventListener('resize', onResize)
}

export const STAGE = { init, select, measure, bindResize, get SHOW() { return S } }
