/* ==========================================================================
   GROW —— 屏 1 生演：点击驱动的抽卡生长（移植 index.html L756–1111）

   移植原则：控制器保持命令式 —— 拿到 svg 与各图层容器(ref)后自建子树。
   React 只负责把空的 <svg> 与图层 <g> 挂出来，永不重渲染它们。
   节点模型（childBit / childSpec / makeNode）已抽到 core/grow-model.ts，
   不变量测试测的就是这里用的同一份实现。
   ========================================================================== */

import { ANIM } from '../anim/anim'
import { qsa, svg, svgGlyph, svgText } from '../anim/yao-dom'
import { DUR, EASE, GROW as G } from '../core/data'
import { childSpec, makeNode, type GrowNode } from '../core/grow-model'
import * as RULES from '../core/rules'

const geo = () => ({ w: G.GW, th: G.GT, gap: G.GGAP })
const halfH = (n: GrowNode) => (n.d === 0 ? G.TAIJI_R : RULES.glyphH(n.d) / 2)

let svgRoot: SVGSVGElement | null = null
let linksL: SVGGElement, ghostL: SVGGElement, nodesL: SVGGElement, labelsL: SVGGElement
let hintEl: HTMLElement | null = null
let epochRef = 0,
  token = 0,
  idSeq = 0
let phase: 'ready' | 'animating' | 'done' = 'ready',
  activeLayer = 0
let counts = [1, 0, 0, 0]
let nodes: GrowNode[] = [],
  byId: Record<number, GrowNode> = {}
let finished = false

/** 切屏时要重置的外部回调 */
export interface GrowDeps {
  onFinished: () => void // 原 FSM.goto('matrix')
}
let deps: GrowDeps = { onFinished: () => {} }

const clickable = (n: GrowNode) => phase === 'ready' && n.d === activeLayer && n.kids.length < 2

/* ---- 绘制 ---- */

// DOM 侧节点：g 元素与爻栈等运行时才存在，与原型的可变记录方式一致
interface LiveNode extends GrowNode {
  g?: SVGGElement
  link?: SVGLineElement
  label?: SVGTextElement
  ghostEls: SVGRectElement[]
}

function drawNode(n: LiveNode) {
  const g = svgGlyph(n.bits, RULES.growX(n.col, n.d), RULES.growY(n.d), geo())
  g.classList.add('gen-node')
  g.dataset.node = String(n.id)
  if (clickable(n)) {
    g.dataset.clickable = '1'
    g.setAttribute('tabindex', '0')
    g.setAttribute('role', 'button')
    g.setAttribute('aria-label', '点击生' + ['', '两仪', '四象', '八卦'][n.d + 1])
  }
  // 点击热区（兼作 focus 环）
  const h = RULES.glyphH(n.d) + 26,
    w = G.GW + 26
  g.append(
    svg('rect', {
      class: 'gen-hit',
      x: RULES.growX(n.col, n.d) - w / 2,
      y: RULES.growY(n.d) - h / 2,
      width: w,
      height: h,
      rx: 4,
    }),
  )
  nodesL.append(g)
  n.g = g
  return g
}

function drawTaiji(): SVGGElement {
  const cx = RULES.growX(0, 0),
    cy = RULES.growY(0),
    r = G.TAIJI_R
  const g = svg('g', {
    class: 'gen-node',
    'data-node': 0,
    tabindex: '0',
    role: 'button',
    'aria-label': '点击生两仪',
  })
  g.dataset.clickable = '1'
  g.append(svg('circle', { cx, cy, r, fill: 'none', stroke: '#ececf3', 'stroke-width': 2.4 }))
  g.append(
    svg('path', {
      d:
        'M' +
        cx +
        ',' +
        (cy - r) +
        ' A' +
        r +
        ',' +
        r +
        ' 0 0 1 ' +
        cx +
        ',' +
        (cy + r) +
        ' A' +
        r / 2 +
        ',' +
        r / 2 +
        ' 0 0 1 ' +
        cx +
        ',' +
        cy +
        ' A' +
        r / 2 +
        ',' +
        r / 2 +
        ' 0 0 0 ' +
        cx +
        ',' +
        (cy - r) +
        ' Z',
      fill: '#ececf3',
      opacity: 0.92,
    }),
  )
  g.append(
    svg('rect', {
      class: 'gen-hit',
      x: cx - r - 14,
      y: cy - r - 14,
      width: (r + 14) * 2,
      height: (r + 14) * 2,
      rx: 4,
    }),
  )
  nodesL.append(g)
  return g
}

// 定好位之后不再动，所以每次重建（跳过补全）都会先清空这一层
// 八卦（d=3）是顶层，没有下一层，不画 ghost
function drawGhosts(n: LiveNode) {
  if (n.d >= 3 || n.ghostEls.length) return
  const d = n.d + 1
  const h = RULES.glyphH(d) + 18,
    w = G.GW + 18
  for (let k = 0; k < 2; k++) {
    const r = svg('rect', {
      class: 'gen-ghost',
      x: RULES.growX(n.col * 2 + k, d) - w / 2,
      y: RULES.growY(d) - h / 2,
      width: w,
      height: h,
      rx: 4,
    })
    ghostL.append(r)
    n.ghostEls.push(r)
  }
}

// 消费一个 ghost 槽：先取消它身上在飞的动画
// （WAAPI 的 fill:'forwards' 会盖过内联样式，只写 style.opacity 是压不住的）
function consumeGhost(el: SVGRectElement | undefined, on: boolean) {
  if (!el) return
  el.getAnimations().forEach((a) => a.cancel())
  el.style.opacity = on ? '.16' : '0'
}

// ghost 槽 = 该节点还没填的子位置。只有「轮到它点」时才显示。
function syncGhosts(n: LiveNode) {
  const show = phase === 'ready' && n.d === activeLayer
  n.ghostEls.forEach((el, k) => consumeGhost(el, show && k >= n.kids.length))
}

function drawLink(parent: LiveNode, child: LiveNode) {
  const x1 = RULES.growX(parent.col, parent.d),
    y1 = RULES.growY(parent.d) - halfH(parent) - 6
  const x2 = RULES.growX(child.col, child.d),
    y2 = RULES.growY(child.d) + halfH(child) + 6
  const l = svg('line', { class: 'gen-link', pathLength: '1', x1, y1, x2, y2 })
  linksL.append(l)
  child.link = l
  return l
}

function labelFor(n: GrowNode) {
  if (n.d === 2) return RULES.bitsToSixiang(n.bits)
  if (n.d === 3) {
    const t = RULES.bitsToTrigram(n.bits)
    return t.sym + ' ' + t.name
  }
  return ''
}

function drawLabel(n: LiveNode) {
  const txt = labelFor(n)
  if (!txt) return
  const y = RULES.growY(n.d) + halfH(n) + 26
  const t = svgText({ class: 'gen-label', x: RULES.growX(n.col, n.d), y }, txt)
  t.style.opacity = '0'
  labelsL.append(t)
  n.label = t
}

/* ---- 单次抽爻：蓄 → 抽/裂变 → 落/显 ---- */

async function beat(parent: LiveNode, child: LiveNode, ghostEl: SVGRectElement | undefined, onUnlock?: () => void) {
  const my = token
  const cg = RULES.growX(child.col, child.d),
    cyy = RULES.growY(child.d)

  /* 蓄 —— 此段结束前不解锁 */
  ANIM.play(
    parent.g!,
    [{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }, { transform: 'scale(1)' }],
    { duration: DUR.genCharge, easing: EASE.charge, fill: 'none' },
  )

  const px = RULES.growX(parent.col, parent.d),
    py = RULES.growY(parent.d) - halfH(parent)
  const seed = svg('g', { class: 'gen-seed' })
  seed.append(svg('circle', { cx: px, cy: py, r: 8, fill: '#fff' }))
  seed.style.opacity = '0'
  nodesL.append(seed)
  ANIM.play(seed, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 0.95 }], {
    duration: DUR.genCharge * 0.7,
    easing: EASE.charge,
    fill: 'forwards',
  })
  if (ghostEl)
    ANIM.play(ghostEl, [{ opacity: 0 }, { opacity: 0.16 }], {
      duration: DUR.genCharge * 0.8,
      fill: 'forwards',
    })

  await ANIM.sleep(DUR.genCharge)
  if (my !== token || !ANIM.alive(epochRef)) {
    seed.remove()
    return
  }

  /* 抽 / 裂变 */
  drawLink(parent, child)
  const g = drawNode(child)
  drawGhosts(child) // 新节点自己也要有两个待填的子槽
  g.style.opacity = '.55'
  const lines = qsa<SVGGElement>('.gen-line', g)
  const newIdx = child.bits.length - 1

  // 种子光点升到子节点位置
  ANIM.play(
    seed,
    [
      { transform: 'translate(0px,0px) scale(1)' },
      { transform: 'translate(' + (cg - px) + 'px,' + (cyy - py) + 'px) scale(1.9)' },
    ],
    { duration: DUR.genDraw, easing: EASE.drop, fill: 'forwards' },
  )

  if (child.link)
    ANIM.play(child.link, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: DUR.genDraw,
      fill: 'forwards',
    })

  // 新爻：从中间向外抽出
  ANIM.play(lines[newIdx], [{ transform: 'scaleX(0)', opacity: 0 }, { transform: 'scaleX(1)', opacity: 1 }], {
    duration: 380,
    delay: 110,
    easing: EASE.drop,
    fill: 'none',
  })

  await ANIM.sleep(DUR.genDraw)
  if (my !== token || !ANIM.alive(epochRef)) {
    seed.remove()
    return
  }

  /* 抽完即解锁：把感知间隔压到约 1.1s，第 3 段作为尾巴与下次点击并行 */
  if (onUnlock) onUnlock()

  /* 落 / 显 */
  ANIM.play(
    g,
    [
      { opacity: 0.55, transform: 'translateY(-10px) scale(.92)' },
      { opacity: 1, transform: 'translateY(0px) scale(1)' },
    ],
    { duration: DUR.genSettle, easing: EASE.settle, fill: 'none' },
  )
  drawLabel(child)
  if (child.label)
    ANIM.play(
      child.label,
      [
        { opacity: 0, transform: 'translateY(6px)' },
        { opacity: 1, transform: 'translateY(0px)' },
      ],
      { duration: DUR.genSettle, delay: 120, fill: 'none' },
    )

  await ANIM.sleep(DUR.genSettle)
  seed.remove()
}

/* ---- 状态推进 ---- */

async function click(id: number) {
  const n = byId[id] as LiveNode | undefined
  if (!n || !n.g || !clickable(n)) return
  phase = 'animating'
  refreshClickable()

  const k = n.kids.length
  const spec = childSpec(n, k)
  const child = makeNode(idSeq++, spec, n.id) as LiveNode
  child.ghostEls = []
  nodes.push(child)
  byId[child.id] = child
  const ghostEl = n.ghostEls[k]
  n.kids.push(child) // 先登记，避免连点重复
  consumeGhost(ghostEl, false)

  let unlocked = false
  const unlock = () => {
    // 抽完即放行，下一抽可立刻开始
    if (unlocked) return
    unlocked = true
    counts[child.d]++
    if (activeLayer < 3 && counts[activeLayer + 1] === 1 << (activeLayer + 1)) activeLayer++
    phase = 'ready'
    refreshClickable()
    updateHint()
  }

  const my = token
  await beat(n, child, ghostEl, unlock)
  if (my !== token || !ANIM.alive(epochRef)) return
  unlock() // 兜底（被中途打断时）

  if(!finished && counts[3] === 8){ await finish() }
}

function refreshClickable() {
  nodes.forEach((nn) => {
    const n = nn as LiveNode
    if (!n.g) return
    if (clickable(n)) {
      n.g.dataset.clickable = '1'
      n.g.setAttribute('tabindex', '0')
    } else {
      delete n.g.dataset.clickable
      n.g.removeAttribute('tabindex')
    }
    syncGhosts(n)
  })
}

function updateHint() {
  if (!hintEl) return
  const t = ['', '两仪', '四象', '八卦'][activeLayer + 1]
  const who = ['太极', '任一仪', '任一象'][activeLayer]
  hintEl.innerHTML = '点击' + who + ' · <b>生' + t + '</b>'
}

/* ---- 跳过：一步补全到终态 ---- */

async function instant() {
  if (phase === 'done') {
    deps.onFinished()
    return
  }
  token++ // 让在飞的 beat 静默退出
  phase = 'done'

  // 打断收尾：在飞的 beat 已把子节点登记进 nodes/kids，但还没绘制（它在
  // 「蓄」段之后才 drawNode）。先把它瞬间画出来，否则 finish 会摸到 null.g
  // 抛异常卡在本屏 —— 2.0 单文件版同款缺陷，这次一并修掉。
  nodes.forEach((nn) => {
    const n = nn as LiveNode
    if (n.d === 0 || n.g) return
    const p = byId[n.parent!] as LiveNode
    drawLink(p, n)
    const g = drawNode(n)
    g.style.opacity = '1'
    n.link!.style.opacity = '1'
    drawGhosts(n)
    drawLabel(n)
    if (n.label) n.label.style.opacity = '1'
  })

  for (let d = activeLayer; d <= 2; d++) {
    nodes
      .filter((n) => n.d === d)
      .forEach((pn) => {
        const p = pn as LiveNode
        while (p.kids.length < 2) {
          const k = p.kids.length
          const spec = childSpec(p, k)
          const child = makeNode(idSeq++, spec, p.id) as LiveNode
          child.ghostEls = []
          nodes.push(child)
          byId[child.id] = child
          p.kids.push(child)
          drawLink(p, child)
          child.link!.style.opacity = '1'
          const g = drawNode(child)
          drawGhosts(child)
          drawLabel(child)
          if (child.label) child.label.style.opacity = '1'
          ANIM.play(g, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'none' })
        }
      })
  }
  nodes.forEach((n) => syncGhosts(n as LiveNode))
  counts = [
    1,
    nodes.filter((n) => n.d === 1).length,
    nodes.filter((n) => n.d === 2).length,
    nodes.filter((n) => n.d === 3).length,
  ]
  refreshClickable()
  await ANIM.sleep(320)
  if (!ANIM.alive(epochRef)) return
  await finish()
}

/* ---- 收束：只留八卦行，然后进矩阵页 ---- */

async function finish() {
  if (finished) return
  finished = true
  const my = token
  nodes.forEach((nn) => {
    const n = nn as LiveNode
    if (!n.g) return // 防御：未绘制的节点（理论上 instant 已补全）
    if (n.d < 3) {
      ANIM.play(n.g!, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: 'forwards' })
      if (n.label) ANIM.play(n.label, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: 'forwards' })
    }
    if (n.link) ANIM.play(n.link, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: 'forwards' })
    syncGhosts(n)
  })
  const top = nodes.filter((n) => n.d === 3) as LiveNode[]
  top.forEach((n, i) =>
    ANIM.play(
      n.g!,
      [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
      { duration: 560, delay: i * 45, easing: EASE.settle, fill: 'none' },
    ),
  )
  await ANIM.sleep(1000)
  if (my !== token || !ANIM.alive(epochRef)) return
  deps.onFinished()
}

/* ---- 入口 ---- */

function start(root: SVGSVGElement, hint: HTMLElement | null, epoch: number, d: GrowDeps) {
  deps = d
  epochRef = epoch
  token = 0
  idSeq = 1 // id 0 = 太极根节点，与 drawTaiji 的 data-node:0 对应
  phase = 'ready'
  activeLayer = 0
  counts = [1, 0, 0, 0]
  nodes = []
  byId = {}
  finished = false

  svgRoot = root
  hintEl = hint
  svgRoot.innerHTML = ''

  linksL = svg('g', { class: 'gen-layer-links' })
  ghostL = svg('g', { class: 'gen-layer-ghosts' })
  nodesL = svg('g', { class: 'gen-layer-nodes' })
  labelsL = svg('g', { class: 'gen-layer-labels' })
  svgRoot.append(linksL, ghostL, nodesL, labelsL)

  // 层标签
  ;['八卦', '四象', '两仪', '太极'].forEach((t, i) => {
    const d = 3 - i
    layerLabel(t, RULES.growY(d))
  })

  const root0 = makeNode(0, { d: 0, col: 0, bits: [], bit: 0 }, null) as LiveNode
  root0.bit = null
  root0.ghostEls = []
  nodes.push(root0)
  byId[0] = root0
  root0.g = drawTaiji()
  drawGhosts(root0)
  refreshClickable()
  updateHint()
}

// 左边缘的层名（视觉参照，不可点）
function layerLabel(t: string, y: number) {
  const el = svgText({ class: 'gen-label dim', x: 14, y: y + 6 }, t)
  el.setAttribute('fill', 'var(--t5)')
  labelsL.append(el)
}

/* ---- 事件绑定（原 EVENTS.bindGrow：委托到带 data-node 的 <g>） ---- */

function nodeOf(target: EventTarget | null): SVGGElement | null {
  const el = target as Element | null
  return (el?.closest?.('[data-node]') as SVGGElement | null) ?? null
}

function onClick(e: { target: EventTarget | null }) {
  const g = nodeOf(e.target)
  if (!g) return
  click(+g.dataset.node!)
}

function onKeyDown(e: { key: string; target: EventTarget | null; preventDefault(): void }) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  const g = nodeOf(e.target)
  if (!g) return
  e.preventDefault()
  click(+g.dataset.node!)
}

export const GROW = {
  start,
  onClick,
  onKeyDown,
  get instant() {
    return instant
  },
}
