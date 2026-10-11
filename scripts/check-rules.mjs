#!/usr/bin/env node
// 校验 index.html：结构冒烟 + 跑页内规则自检。
//
// 断言不是抄一份放在这里，而是从 index.html 里抽出 ?debug 那段源码直接执行——
// 页面和控制台跑的是同一份断言，改了一边另一边不可能漏。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'index.html');

let src;
try {
  src = readFileSync(file, 'utf8');
} catch (err) {
  fail(`读不到 index.html：${err.message}`);
}

/* ---------- 1. 结构冒烟 ---------- */

const problems = [];
const need = (cond, msg) => { if (!cond) problems.push(msg); };

need(/^<!doctype html>/i.test(src.trimStart()), '缺少 <!doctype html>');
need((src.match(/<\/html>/g) || []).length === 1, '</html> 不恰好出现 1 次');
need(src.includes('<script>') && src.includes('</script>'), '<script> 开闭标签不配对');
need(src.includes('<style>') && src.includes('</style>'), '<style> 开闭标签不配对');
need(src.includes('<title>'), '缺少 <title>');

// 零依赖是项目的硬约束：一旦引入外部资源，页面就不再能单文件脱离网络运行。
const ext = [
  [/<link\b[^>]*\bhref=/i, '<link href> 外部资源'],
  [/<script\b[^>]*\bsrc=/i, '<script src> 外部脚本'],
  [/@import\s/i, 'CSS @import'],
  [/\bfetch\s*\(/, 'fetch() 网络请求'],
  [/\bnew\s+Worker\s*\(/, 'new Worker()'],
].filter(([re]) => re.test(src)).map(([, name]) => name);
need(ext.length === 0, `引入了外部依赖：${ext.join('、')}`);

// 项目站点部署在 /2026-10-9-Yi/ 子路径下，绝对路径资源会 404。
const abs = src.match(/["'`]\/[A-Za-z0-9_-][^"'`\s]*\.(?:png|jpe?g|svg|gif|webp|ico|woff2?|ttf|css|js|json)["'`]/gi);
need(!abs, `存在绝对路径资源（子路径部署会 404）：${abs ? abs.slice(0, 3).join('、') : ''}`);

if (problems.length) {
  fail('index.html 结构校验未通过：\n' + problems.map(p => '  ✗ ' + p).join('\n'));
}

/* ---------- 2. 抽出 DATA + RULES 与页内自检 ---------- */

const dataStart = src.indexOf('const DATA = ');
const storeStart = src.indexOf('const STORE = ');
if (dataStart < 0 || storeStart < 0 || storeStart <= dataStart) {
  fail('在 index.html 里定位不到 `const DATA = ` / `const STORE = ` —— 模块边界被改动了？');
}
const rulesSrc = src.slice(dataStart, storeStart);

const debugStart = src.indexOf('if(location.search.indexOf(');
if (debugStart < 0) {
  fail("在 index.html 里定位不到 ?debug 自检块（找不到 `if(location.search.indexOf(`）");
}

// 从 if 开始做花括号配对，取出整块
let depth = 0, i = src.indexOf('{', debugStart), debugEnd = -1;
if (i < 0) fail('?debug 自检块的格式无法识别');
for (let j = i; j < src.length; j++) {
  if (src[j] === '{') depth++;
  else if (src[j] === '}') { depth--; if (depth === 0) { debugEnd = j + 1; break; } }
}
if (debugEnd < 0) fail('?debug 自检块的花括号不配对');
const debugSrc = src.slice(debugStart, debugEnd);

/* ---------- 3. 执行 ---------- */

const results = [];
const fakeConsole = {
  log: (...args) => {
    const line = args.join(' ');
    results.push(line);
    console.log('  ' + line);
  },
};

try {
  const body = `${rulesSrc}\n${debugSrc}\nreturn {DATA, RULES};`;
  // 页内自检只用 location.search 判断是否启用，这里伪造一个带 debug 的 search
  new Function('location', 'console', 'Math', body)(
    { search: '?debug' },
    fakeConsole,
    Math,
  );
} catch (err) {
  fail('执行自检时抛异常：' + (err && err.stack ? err.stack.split('\n')[0] : err));
}

const passed = results.filter(l => l.startsWith('✓')).length;
const failed = results.filter(l => l.startsWith('✗'));

console.log('');
if (!passed) fail('自检没有产出任何断言结果 —— 抽取逻辑可能失效了');
if (failed.length) {
  fail(`规则自检失败 ${failed.length} 项：\n` + failed.map(l => '  ' + l).join('\n'));
}

console.log(`✓ index.html 结构完整、零外部依赖`);
console.log(`✓ 规则自检 ${passed} 项全部通过`);
console.log(`  （断言直接抽自 index.html 的 ?debug 块，与页面里跑的是同一份）`);

function fail(msg) {
  console.error('\n✗ ' + msg + '\n');
  process.exit(1);
}
