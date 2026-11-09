# 贡献指南

欢迎参与「星轨 Stellaris」。这是一套**零依赖、零构建链、三框粘贴**的博客园主题，
请先读下面几条前提，避免贡献把「拿来就能用」这个目标破坏掉。

## 前提

- **不引入任何依赖**：不加 `package.json` dependencies、不引框架、不搞 monorepo。
  `build.js` 只用 Node 内置模块，运行时（页脚脚本）是零依赖原生 JS。
- **保持三框形态**：交付物始终是「页面定制CSS代码 / 页首HTML代码 / 页脚HTML代码」三个粘贴框；
  `dist/config.paste.html` 只是配置段快照，不是第四个框。
- **不改 SimpleMemory 皮肤前提**：博客皮肤保持 SimpleMemory，勾选「禁用模板默认CSS」。
- **不改线上**：提交 PR 不操作博客园后台、不重贴线上三个框、不做任何浏览器自动化上线动作。
- **注释与语言**：代码注释一律英文（只写「为什么」和非显而易见前提，不写教学长文）；
  文档（README / docs）用中文；脚本输出/提示用英文。

## 改哪里

- 换肤：`src/tokens.css` 顶部的 `:root` 设计令牌。
- 结构/组件样式：`src/base.css` / `src/layout.css` / `src/components.css`。
- 渐进增强逻辑：`src/enhance.js`（运行时零依赖）。
- 平台 DOM 选择器：`src/adapter.js` 的 `XM_SELECTORS` 注册表（见 `docs/adapter.md`）。
- 配置字段说明：`docs/configuration.md`。
- 文档：`README.md` 与 `docs/*.md`。

`src/keep.css` 绝大部分仍是用户要求原样保留的冻结块：仅自定义光标一行已令牌化为 `*{ cursor:var(--xm-cursor, auto);}`；其余（广告隐藏 / 3D spinner / `#loading` 的 `z-index:99999999`）请勿改动。

## 构建

```bash
node build.js
```

- 只用 Node 内置模块，推荐 Node 18+。
- 产物写到 `dist/`，`dist/*.paste.*` 是给用户粘贴的版本（已去每行前导空白，重复粘贴幂等）。
- 精简版产物：`dist/stellaris.js` 由 `src/adapter.js` + `src/enhance.js` 拼接生成，供 jsDelivr 外链；
  `dist/page-end.cdn.paste.html` 是精简版页脚（配置段 + 两个条件注入器 + 该外链 `<script>`）。
  原三框整框产物 `dist/custom.paste.css` / `page-begin.paste.html` / `page-end.paste.html` 保持不变。
- 校验构建改动而不覆盖现有产物时，输出到临时目录：
  ```bash
  XM_BUILD_OUT=dist/.preview node build.js
  # 或
  node build.js --out=/tmp/xm-build
  ```
- `dist/` 是交付物，**需要提交**（用户直接取用，不要求本地构建）。

## 验收

- 语法自检：对改动过的 `.js` 跑 `node --check`。
- 回归：`node tests/run.js`（前置条件见 `tests/README.md`）。
- 部署验证：见 `docs/deployment.md`。

## 提交 PR 前

- 说明改了什么、为什么；涉及 `dist/` 产物时说明是否需要重新粘贴三个框。
- 不提交 `tests/*-result.json`（已被 `.gitignore` 忽略）。
- 在没有视觉/逻辑改动时保持 `dist/custom.paste.css` / `dist/page-end.paste.html` 字节不变，
  避免让线上用户误以为必须立刻重贴。
