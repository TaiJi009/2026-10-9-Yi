/* ==========================================================================
   STORE —— 单一状态（逐字移植 index.html L548–558 的单例语义）

   ★ 为什么不是 useReducer/context：
     写 STORE 的是动画控制器（PLAYS.cast 逐爻落定时写入），不是 React 事件。
     控制器在 await 链里写状态，React 组件从不订阅 —— 各屏内容也由控制器
     命令式填充。把这里换成 hook 只会制造「绕回 React 再出来」的假洁癖。
     将来若出现真正需要响应式的 UI（如用户记录面板），再在此之上包一层
     useSyncExternalStore 即可，接口已经预留（subscribe）。
   ========================================================================== */

import type { YiState } from '../core/types'

const subs: Array<(s: YiState) => void> = []

export const STORE = {
  state: { values: [], bits: [], moves: [], variants: [] } as YiState,
  set(patch: Partial<YiState>) {
    Object.assign(STORE.state, patch)
    subs.forEach((f) => f(STORE.state))
  },
  subscribe(f: (s: YiState) => void) {
    subs.push(f)
  },
  reset() {
    STORE.set({ values: [], bits: [], moves: [], variants: [] })
  },
}
