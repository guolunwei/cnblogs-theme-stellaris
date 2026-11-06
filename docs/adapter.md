# 选择器适配层（src/adapter.js）

## 解决什么

`src/enhance.js` 早期把博客园平台私有选择器硬编码在逻辑里：`#cnblogs_post_body`、`#header`、
`#sideBar`、`#navList a.menu`、`#blogLogo`、`#lnkBlogLogo`、`.catListTag`、`.entrylistItem`、
`.day > .postTitle`、`table.hljs-ln`、`.cnblogs-toc-button`。这些名字来自 SimpleMemory 的 DOM 骨架，
一旦平台换骨架、换皮肤、或某些节点由脚本运行时才生成，写死的选择器就会整体失效。

适配层把这些私有名字收进一张 **`XM_SELECTORS` 注册表**，对外只暴露一个 **`pick(key)`**：
组件不再关心「节点叫什么」，只问「有没有这个组件」。

> 进度说明：第二批已完成接入 —— `enhance.js` 内所有从 `document` 出发的平台节点查询
> 均收敛到 `window.XM_ADAPTER.pick(key)` / `pickAll(key)`；组件内部的元素级查询
> （如 `pre.querySelector("code")`）与动态 id 查重仍保留原样，不属于平台私有选择器。
> 适配器只暴露单一句柄 `window.XM_ADAPTER`，注册表结构未变。

## 结构：分组 + 候选数组

注册表按「皮肤 / 骨架」分组，至少 `simplememory` 与 `fallback` 两组；**每个键是候选选择器数组**，
按特异性从高到低排列，`pick()` 返回首个命中。

```js
XM_SELECTORS = {
  simplememory: {
    postBody: ["#cnblogs_post_body", ".postCon", "#post_detail"],
    // ...
  },
  fallback: { /* 更通用、跨皮肤的候选 */ }
};
```

### 为什么必须支持「多个候选」

平台实测有三类不确定性，一个键写死一个选择器必然踩坑：

- `.catListTag`：CSS 规则存在，但线上**零匹配**（标签云实际挂在别的容器上）——需要额外候选兜底。
- 归档页有**两套结构**：月归档用 `.entrylistItem`，日归档用 `.day > .postTitle`；分别建成
  `archiveMonthItems` / `archiveDayTitles` 两个键，各自带候选。
- `table.hljs-ln`：由前端高亮脚本**运行时生成**，初始化时可能还不存在——`pick()` 每次现查，
  不缓存、不预置，脚本生成后再取即可得到节点。

## pick(key)

- 逐个候选执行 `try { document.querySelector(s) } catch (e) { continue }`，返回首个命中的节点，
  全不命中返回 `null`。
- **非法选择器**字符串（语法错误、平台不支持的伪类）被 `try/catch` 吞掉，跳过继续试下一个，
  不会抛错中断初始化。
- 默认在 `simplememory` 组查找，并自动追加 `fallback` 组同名键的候选兜底；`pick(key, group)` 可指定组。
- 是纯查询：不缓存、不写 DOM、不创建占位节点。

## 缺失节点时的降级行为

`pick()` 返回 `null` 即代表「这个组件在当前骨架上不存在」。调用方约定（参考 `enhance.js` 里
`initLogo` 的独立 `try/catch` 范式）：

```js
try {
  var node = window.XM_ADAPTER.pick("postBody");
  if (!node) return;        // 静默跳过该组件
  // ... 初始化 ...
} catch (e) { /* 单个组件失败不得阻断后续初始化 */ }
```

要求：**静默跳过、不抛错、不留空白占位、不阻断后续初始化**。宁可少一个增强功能，
也不能让整段脚本崩掉或把页面顶出空白。

## 怎么新增一个皮肤映射

方式一（改源码）：在 `XM_SELECTORS` 里加一个组对象，键名沿用现有组件键，值是该骨架的候选数组；
`pick(key, group)` 传组名即可。不需要动 `enhance.js`。

方式二（不改源码，运行时覆盖）：在页脚 `window.XM` 里提供 `selectors`，**按 key 合并覆盖**
（不是整体替换注册表）：

```js
window.XM = {
  theme: "auto",
  selectors: {
    simplememory: { postBody: [".my-skin-body", "#cnblogs_post_body"] }
  }
};
```

- 只覆盖你写出的键，未提及的键保持默认；也支持扁平写法 `{ postBody: ["..."] }`（合并进默认组）。
- 自定义候选**排在前面**优先试，内置候选自动兜底在后（回落默认）。
- 值可以是字符串数组，也可以是单个字符串。
- 值里的非法选择器字符串被 `try/catch` 校验后丢弃；若某个键的自定义值**全是非法字符串**，
  则该键**保留默认候选**，不会变成「永远查不到」。

## 全局暴露

`window.XM_ADAPTER` 提供 `SELECTORS`（注册表）、`pick()`、`pickAll()`，供 `enhance.js` 与控制台查看。
**只暴露这一个句柄**：第二个全局别名会与「按 key 合并后的注册表」脱节，故第二批删除了多余的
`window.XM_SELECTORS`。适配层是独立 IIFE、零依赖，由 `build.js` 的 `JS_ORDER` 排在
`enhance.js` **之前**拼进页脚，两者作用域互不干扰。
