/* ==========================================================================
   类型 —— 贯穿全项目的共享形状
   ========================================================================== */

/** 大衍筮法抽出的爻值：6 老阴 / 7 少阳 / 8 少阴 / 9 老阳 */
export type YaoValue = 6 | 7 | 8 | 9

/** 六爻的阴阳，index 0 = 初爻（最下） */
export type Bits = number[]

/** 一爻是否在动 */
export type Moves = boolean[]

/** 变法的种类 */
export type VariantKind = 'ben' | 'bian' | 'zong' | 'cuo' | 'jiao' | 'hu'

/** 高亮档位：CSS 用 data-hot 的取值着色（见 global.css 的 YAO 段） */
export type HotClass = 'hot' | 'dim' | 'kept' | 'grpA' | 'grpB'

export interface HuGeo {
  lower: number[]
  upper: number[]
  removed: number[]
}

/** 本卦 + 14 变体 = 15 格系统里的一格 */
export interface Variant {
  slot: string
  kind: VariantKind
  label: string
  bits: Bits
  /** buildVariants 的 push 统一补全，故构造期允许缺省 */
  name: string
  changedLines: number[]
  hlMode: string
  line?: number
  hu?: HuGeo
  dup?: string
}

/** STORE 的完整形状（与原型一致：values / bits / moves / variants） */
export interface YiState {
  values: YaoValue[]
  bits: Bits
  moves: Moves
  variants: Variant[]
}
