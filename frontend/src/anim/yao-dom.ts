/* ==========================================================================
   RENDER 的命令式半边 —— 元素进、元素出（逐字移植 L621–741 的 DOM 操作部分）

   ★ 这些函数只操作调用方递进来的元素，自己不查询全局 DOM、不碰 React 树。
     动画子树由控制器建好后 append 进 ref 指向的空容器 —— React 永不重渲染
     那些容器，否则 WAAPI 的 fill:forwards 会被 reconciler 抹掉。
   ========================================================================== */

import { ANIM } from './anim'
import { DUR } from '../core/data'
import type { Bits, HotClass } from '../core/types'

export const SVGNS = 'http://www.w3.org/2000/svg'

export interface YaoOpts {
  moving?: boolean
  ghost?: boolean
  mark?: string
}

export function yaoEl(bit: number, opts: YaoOpts = {}): HTMLElement {
  const el = document.createElement('div')
  el.className = 'yao'
  el.dataset.yang = bit ? '1' : '0'
  if (opts.moving) el.dataset.moving = '1'
  if (opts.ghost) el.dataset.ghost = '1'

  const glow = document.createElement('i')
  glow.className = 'glow'
  const l = document.createElement('i')
  l.className = 'seg seg-l'
  const r = document.createElement('i')
  r.className = 'seg seg-r'
  el.append(glow, l, r)

  if (opts.mark) {
    const m = document.createElement('b')
    m.className = 'mark'
    m.textContent = opts.mark
    el.append(m)
  }
  return el
}

export interface StackOpts {
  moves?: boolean[]
}

// 爻栈：index 0（初爻）在最下
export function stackEl(bits: Bits, opts: StackOpts = {}): HTMLElement {
  const s = document.createElement('div')
  s.className = 'yao-stack stack'
  fillStack(s, bits, opts)
  return s
}

export function fillStack(s: HTMLElement, bits: Bits, opts: StackOpts = {}) {
  s.innerHTML = ''
  bits.forEach((b, i) =>
    s.append(
      yaoEl(b, {
        moving: opts.moves ? opts.moves[i] : false,
        // 动爻标记：只标「动」，不再用 ○/× 区分阴阳
        mark: opts.moves && opts.moves[i] ? '动' : '',
      }),
    ),
  )
  return s
}

export function miniEl(bits: Bits): HTMLElement {
  const s = document.createElement('div')
  s.className = 'mini'
  bits.forEach((b) => s.append(yaoEl(b)))
  return s
}

// 逐爻翻转（阴阳互换）：只 morph 两段的 scaleX，转完提交数据并撤掉动画
export async function flipYao(yao: HTMLElement, duration?: number, delay?: number) {
  const y1 = yao.dataset.yang === '1'
  const from = y1 ? 1 : 0.88,
    to = y1 ? 0.88 : 1
  const segs = qsa<HTMLElement>('.seg', yao)
  const anims = segs.map((s) =>
    ANIM.play(
      s,
      [{ transform: 'scaleX(' + from + ')' }, { transform: 'scaleX(' + to + ')' }],
      { duration: duration || DUR.flip, delay: delay || 0, fill: 'forwards' },
    ),
  )
  await Promise.all(anims.map((a) => ANIM.await_(a)))
  yao.dataset.yang = to === 1 ? '1' : '0'
  anims.forEach((a) => a.cancel())
}

// 一次性落定多组高亮：map = { 爻序号: 类名 }
export function hotMap(hexEl: HTMLElement, map: Record<number, HotClass>) {
  qsa<HTMLElement>('.yao', hexEl).forEach((y, i) => {
    const cls = map[i]
    if (cls) y.dataset.hot = cls
    else delete y.dataset.hot
  })
}

export function setHot(hexEl: HTMLElement, indices: number[], cls: HotClass) {
  qsa<HTMLElement>('.yao', hexEl).forEach((y, i) => {
    delete y.dataset.hot
    if (indices.indexOf(i) >= 0) y.dataset.hot = cls
  })
}

export function clearHot(hexEl: HTMLElement) {
  qsa<HTMLElement>('.yao', hexEl).forEach((y) => {
    delete y.dataset.hot
  })
}

// 互卦抽取括号（列在下方的初爻 index 0）
export function setBracket(el: HTMLElement, range: number[], on: boolean) {
  if (!on || !range.length) {
    el.classList.remove('on')
    return
  }
  const a = Math.min.apply(null, range),
    b = Math.max.apply(null, range)
  el.style.top = ((5 - b) / 6) * 100 + '%'
  el.style.height = ((b - a + 1) / 6) * 100 + '%'
  el.classList.add('on')
}

/* ---------- SVG 构造 ---------- */

export type SvgAttrs = Record<string, string | number>

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: SvgAttrs = {},
): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVGNS, tag) as SVGElementTagNameMap[K]
  for (const k in attrs) e.setAttribute(k, String(attrs[k]))
  return e
}

export function svgText(attrs: SvgAttrs, text: string): SVGTextElement {
  const t = svg('text', attrs)
  t.textContent = text
  return t
}

export interface GlyphGeo {
  w: number
  th: number
  gap: number
}

// 竖排爻线：bits index 0（初爻）在最下。
// 每爻包一层 <g class="gen-line">，才能对单爻做 scaleX 抽出 / 翻转。
export function svgGlyph(bits: Bits, cx: number, cy: number, geo: GlyphGeo): SVGGElement {
  const w = geo.w,
    th = geo.th,
    gap = geo.gap
  const n = bits.length
  const h = n * th + (n - 1) * gap
  const g = svg('g', { class: 'gen-glyph' })
  bits.forEach((b, i) => {
    const y = cy - h / 2 + (n - 1 - i) * (th + gap)
    const line = svg('g', { class: 'gen-line' })
    if (b) {
      line.append(svg('rect', { x: cx - w / 2, y, width: w, height: th, rx: 1, fill: 'currentColor' }))
    } else {
      const seg = w * 0.44
      line.append(
        svg('rect', { x: cx - w / 2, y, width: seg, height: th, rx: 1, fill: 'currentColor' }),
        svg('rect', { x: cx + w / 2 - seg, y, width: seg, height: th, rx: 1, fill: 'currentColor' }),
      )
    }
    g.append(line)
  })
  return g
}

/* ---------- 局部查询 ---------- */

export function qs<T extends Element = HTMLElement>(sel: string, root: ParentNode = document) {
  return root.querySelector(sel) as T | null
}

export function qsa<T extends Element>(sel: string, root: ParentNode = document): T[] {
  return Array.prototype.slice.call(root.querySelectorAll(sel)) as T[]
}
