#!/usr/bin/env python3
"""紫家族新色哨兵（Ban list 硬化：明度管语义、紫罗兰只承载交互态）。

判据：B>R>G 且 B-G≥12 为紫家族；全仓仅许三个规范值（--accent 系单点定义）。
CI 与本地用法相同：python3 scripts/check-violet.py
"""
import re
import sys
import pathlib

CANON = {'c9a6ff', 'd8c9f2', '8f89a3'}
SRC = pathlib.Path(__file__).resolve().parent.parent / 'frontend' / 'src'


def is_violet(r: int, g: int, b: int) -> bool:
    return b > r > g and (b - g) >= 12


def main() -> int:
    offenders = []
    for p in SRC.rglob('*'):
        if p.suffix not in {'.css', '.ts', '.tsx', '.svg'}:
            continue
        for m in re.finditer(r'#[0-9a-fA-F]{6}\b', p.read_text(encoding='utf-8', errors='ignore')):
            h = m.group()[1:].lower()
            r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
            if is_violet(r, g, b) and h not in CANON:
                offenders.append(f'{p.relative_to(SRC.parent)}: #{h}')
    if offenders:
        print('错误：出现规范紫（#c9a6ff/#d8c9f2/#8f89a3）之外的新紫 hex：')
        print('\n'.join(offenders))
        print('交互态请用 var(--accent) 系变量；语义层（爻/文字/背景）禁止一切紫。')
        return 1
    print('✓ 紫家族哨兵：无新紫')
    return 0


if __name__ == '__main__':
    sys.exit(main())
