# 部署踩坑与排查手册

> 本文从早期 README 的「部署经验」完整迁出，一条未删。主题通过博客园后台三个输入框生效，
> 任何一环出问题都会表现为「样式没生效」，按下面顺序排查。

## 三个输入框与对应文件

博客园后台 →「设置」→ 页面定制CSS代码 / 页首HTML代码 / 页脚HTML代码。皮肤保持 **SimpleMemory**，
并勾选 **「禁用模板默认CSS」**；页脚含 `<script>`，需先向博客园**申请 JS 权限**。

| 后台输入框 | 粘贴文件 |
|---|---|
| 页面定制CSS代码 | `dist/custom.paste.css` |
| 页首HTML代码 | `dist/page-begin.paste.html` |
| 页脚HTML代码 | `dist/page-end.paste.html` |

## ① 必须用 dist/*.paste.*，不要手工往框末尾追加补丁

`*.paste.*` 版本已去掉每行前导空白：后台 CodeMirror 开着自动缩进，直接贴带缩进的文本会逐行累积
（实测出现过每行 200+ 个 `\t`），改一次贴一次就往里嵌一层。用 `.paste.*` 可保证「重复粘贴幂等」——
每次清空重贴结果稳定。

改样式/改脚本时，**重新完整粘贴对应文件覆盖**，不要在框里原有内容末尾手工追加补丁片段；
追加会破坏幂等，也容易把配置块、脚本块撕成两截。也不要用 `dist/custom.min.css`
（单行压缩版会让 CodeMirror 渲染卡死），用 `custom.paste.css`。

## ② CodeMirror 隐藏 textarea 陷阱（最容易漏）

后台三个框都是 CodeMirror，它下面藏了一个真实 `<textarea>`，表单提交时读的是**那个 textarea 的值**。
直接粘贴后若不重新全选，保存下来的可能只是选区片段，表现为「只贴进去一小截 / 改动没生效」。

每个框都做一遍，顺序不能省：

1. 点进编辑器 → `Ctrl+A` 全选 → `Delete` 清空
2. `Ctrl+V` 粘贴文件内容
3. **再按一次 `Ctrl+A`**（此时隐藏 textarea 的值才会变成完整内容）
4. 滚到页面底部点「保存」，或 `Ctrl+S`

> 关键在第 3 步：**漏掉第二次 `Ctrl+A`，保存的只是选区片段**，不是整框内容。

## ③ 排查样式必须查 styleSheets.cssRules + getComputedStyle，不能只 grep 文件文本

文件里「看起来有这条规则」不等于浏览器「真的应用了这条规则」。一个多余的 `}` 会让后续整段规则
被 CSS 解析器丢弃（`document.styleSheets[].cssRules` 里根本不存在这些规则），而 grep 文本仍能看到它们。

正确做法：在页面上下文里读

- `document.styleSheets[i].cssRules`（注意跨域样式表访问会抛错，要 try/catch）确认规则是否被解析、顺序与优先级；
- `getComputedStyle(el)` 确认元素最终计算值；
- 需要几何信息时再用 `getBoundingClientRect()`。

`tests/` 下的 CDP 脚本就是按这个思路量化探测的，比截图更能判断「是否渲染 / 是否可见」。

## ④ custom.css 走 CDN，保存换 ?v= 缓存戳，边缘节点可能延迟

cnblogs 的 `custom.css` 通过 CDN 下发，每次保存会换一个 `?v=` 缓存戳，但**边缘节点同步有延迟**。
用无头浏览器或异地网络验证时可能仍命中旧文件（表现为「改动没生效」）。

确认文件本身已含改动后：本地浏览器 `Ctrl+Shift+R` 硬刷新，或等几分钟；仍不生效就再保存一次
（又换一个 `?v=`，新键没有陈旧缓存）。

## ⑤ 保存后重载设置页读回服务器值确认完整

改完「页面定制CSS代码」保存后，**重新加载设置页**，把三个框的内容读回，确认服务器实际存下的是完整内容
（尤其是第 ② 步最容易只存选区片段）。读回值与 `dist/*.paste.*` 一致，才算部署完成；
不一致就按第 ② 步重贴一遍。

## ⑥ 保存后 curl 核验线上产物

CDN 有缓存戳延迟（见 ④），浏览器直连未必立刻读到新值，可用 curl 拉首页 HTML 核对实际下发内容：

```bash
curl -s "https://你的博客首页/" | grep -o 'hm.baidu.com/hm.js?[a-f0-9]\{32\}'
```

- 确认页脚**不再出现写死的 `hm.baidu.com/hm.js?<32位ID>` 统计请求**：统计默认关闭，
  只有在 `window.XM.analyticsId` 自己填了合法 32 位 ID 时才应有该 URL。
  若仍 grep 到硬编码 ID，说明贴的是旧版 `page-end.paste.html`，按 ① 用最新产物重贴。
- 同理可核对 `cursor-effects.js` 是否只作为 `window.XM.cursorEffects` 的配置值出现，
  而非写死的 `<script src=...>`（换博客请替换或置 `null`）。

## 附：验证手段

受控浏览器不便时，用 CDP 直连无头 Chrome 做量化诊断最稳——读 `getComputedStyle` /
`getBoundingClientRect` / `cssRules` 比截图更能定位「是否渲染 / 是否可见」。见 `tests/README.md`。
