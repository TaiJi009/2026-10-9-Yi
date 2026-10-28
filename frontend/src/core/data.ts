/* ==========================================================================
   DATA —— 纯查表与常量（逐字移植自 index.html L389–453）
   ========================================================================== */

import type { YaoValue } from './types'

export interface Trigram {
  v: number
  name: string
  sym: string
  bits: number[]
}

// 三爻卦：值 = b0 + b1*2 + b2*4（b0 为初爻 / 最下）
export const TRIGRAM: Trigram[] = [
  { v: 0, name: '坤', sym: '☷', bits: [0, 0, 0] },
  { v: 1, name: '震', sym: '☳', bits: [1, 0, 0] },
  { v: 2, name: '坎', sym: '☵', bits: [0, 1, 0] },
  { v: 3, name: '兑', sym: '☱', bits: [1, 1, 0] },
  { v: 4, name: '艮', sym: '☶', bits: [0, 0, 1] },
  { v: 5, name: '离', sym: '☲', bits: [1, 0, 1] },
  { v: 6, name: '巽', sym: '☴', bits: [0, 1, 1] },
  { v: 7, name: '乾', sym: '☰', bits: [1, 1, 1] },
]

// 64 卦全名：下标 = 下卦(内)值 + 上卦(外)值 * 8；行 = 上卦，列 = 下卦
export const HEX: string[] = [
  //   下坤     下震     下坎     下兑     下艮     下离     下巽     下乾
  '坤为地', '地雷复', '地水师', '地泽临', '地山谦', '地火明夷', '地风升', '地天泰', // 上坤
  '雷地豫', '震为雷', '雷水解', '雷泽归妹', '雷山小过', '雷火丰', '雷风恒', '雷天大壮', // 上震
  '水地比', '水雷屯', '坎为水', '水泽节', '水山蹇', '水火既济', '水风井', '水天需', // 上坎
  '泽地萃', '泽雷随', '泽水困', '兑为泽', '泽山咸', '泽火革', '泽风大过', '泽天夬', // 上兑
  '山地剥', '山雷颐', '山水蒙', '山泽损', '艮为山', '山火贲', '山风蛊', '山天大畜', // 上艮
  '火地晋', '火雷噬嗑', '火水未济', '火泽睽', '火山旅', '离为火', '火风鼎', '火天大有', // 上离
  '风地观', '风雷益', '风水涣', '风泽中孚', '风山渐', '风火家人', '巽为风', '风天小畜', // 上巽
  '天地否', '天雷无妄', '天水讼', '天泽履', '天山遯', '天火同人', '天风姤', '乾为天', // 上乾
]

export const SIXIANG = ['太阳', '少阴', '少阳', '太阴']
export const LINE_CN = ['初', '二', '三', '四', '五', '上']

// 大衍筮法：老阴 6 / 少阳 7 / 少阴 8 / 老阳 9
export const LINE_PROB: Record<YaoValue, number> = { 6: 1 / 16, 7: 5 / 16, 8: 7 / 16, 9: 3 / 16 }
export const VAL_NAME: Record<YaoValue, string> = { 6: '老阴', 7: '少阳', 8: '少阴', 9: '老阳' }

// 互卦五种变法
export interface HuMode {
  key: string
  label: string
  removed: number[]
  lower: number[]
  upper: number[]
}

export const HU_MODES: HuMode[] = [
  { key: 'chu', label: '去初', removed: [0], lower: [1, 2, 3], upper: [3, 4, 5] },
  { key: 'shang', label: '去上', removed: [5], lower: [0, 1, 2], upper: [2, 3, 4] },
  { key: 'chushang', label: '去初上', removed: [0, 5], lower: [1, 2, 3], upper: [2, 3, 4] },
  { key: 'chuer', label: '去初二', removed: [0, 1], lower: [2, 3, 4], upper: [3, 4, 5] },
  { key: 'wushang', label: '去五上', removed: [4, 5], lower: [0, 1, 2], upper: [1, 2, 3] },
]

// 生演树几何（公式预算，不测量）
//   层 y：太极在底、八卦在顶 → y(d) = Y0 - d*RH
//   层内 x：x(col,d) = (col+.5)/2^d * W
//   宽度校验：8*GW + 7*(W/8 - GW) = 8*84 + 7*41 = 959 <= 1000（留 20px 余量）
export const GROW = { W: 1000, Y0: 620, RH: 180, TAIJI_R: 34, GW: 84, GT: 6, GGAP: 11 }

// 64 矩阵几何：行 = 上卦、列 = 下卦，行列都是先天生成序
export const MATRIX = { X0: 90, Y0: 80, CW: 125, CH: 100, GW: 84, GT: 6, GGAP: 11 }

export const DUR = {
  // 起卦（屏 3）一拍 = 蓄 + 落 + 显 = castCharge + castDrop + castGap。
  // 2026-10-28 整体调快 20%：五个常量一律 ×0.8 后取整到 10ms（原 520/250/300/480/440）。
  // 同比缩放（而不是只削蓄段）让三段时长比例一位不动——比例就是「蓄—落—显」的叙事本身。
  // 常量一拍 860ms（原 1070，−19.6%）；dev 构建实测一拍 950ms、六爻全程 5.46s
  // （原 1166ms / 6.69s，各 −18.5% / −18.3%）。常量与实测差的约 90ms 是 WAAPI 帧调度的固定开销
  // （await finished + 下一段 play），不在这些常量里——别为它再削常量，会把三段比例削歪。
  // ★ 不变量（cast-rhythm.test.ts 兜底）：castCharge 恒为三段最长——再调也同比缩放，别只动一个。
  castCharge: 420, castDrop: 200, castGap: 240, castGapLast: 380, castGlow: 350,
  flip: 340, rotate: 620,                                         // 通用翻转 / 旋转
  genCharge: 720, genDraw: 560, genSettle: 520,                  // 生演抽爻三段
  travel: 620, clearShow: 260, reveal: 480, fission: 600,         // 错综演算
}
export const EASE = {
  charge: 'cubic-bezier(.5,0,.8,.2)',
  drop: 'cubic-bezier(.2,.9,.25,1.15)',
  settle: 'cubic-bezier(.4,0,.2,1)',
}
