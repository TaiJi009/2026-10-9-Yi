# 2026-10-9-Yi · 变易

一个以《易经》六十四卦为主题的互动网页项目。目标形态：从太极生演到六十四卦，
起卦后展开本卦的「错综复杂」关系网（15 格变体系统），整个过程以抽卡式的动效呈现。

视觉约束：**仅黑白灰，靠明度多层次区分（tone ramp）**；交互形式：单文件 HTML，零依赖。

## 在线演示

https://taiji009.github.io/2026-10-9-Yi/

> 路径段 `2026-10-9-Yi` 的 `Y` 区分大小写，写成小写会 404。

## 当前状态

`index.html` 已完成首版实现：单文件、约 1300 行，内联 CSS + 原生 JS，零依赖。
覆盖太极生演（屏 0–1）、逐爻起卦（屏 2）、成卦落定（屏 3）、15 卦关系网（屏 4），
起卦用大衍筮法的非均匀概率，视觉走黑白灰明度分层。

## 开发环境

无构建、无依赖。直接用浏览器打开 `index.html` 即可，或起一个静态服务：

```bash
python3 -m http.server 8777
```

## 部署

推送到 `main` 分支时，GitHub Actions 自动把 `index.html` 发布到 GitHub Pages
（工作流：`.github/workflows/deploy.yml`）。该工作流**只发布 `index.html`**，
`docs/`、`README.md`、`.claude/` 都不会进入站点。

首次启用需一次性配置：仓库 **Settings → Pages → Source** 选 **GitHub Actions**
（不要选 "Deploy from a branch"，否则部署会以 `Get Pages site failed` 失败）。
也可在 **Actions** 页选「部署到 GitHub Pages」→ **Run workflow** 手动触发一次。
