/* ==========================================================================
   UTIL —— 移植自 index.html L563–570。
   clamp / raf 在原型里从未被调用（死代码），不再带过来；
   qs / qsa 归入 anim/yao-dom.ts（与 DOM 操作放一起更顺手）。
   ========================================================================== */

export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined
  return function (...args: A) {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}
