#!/usr/bin/env node
/**
 * 星轨 Stellaris · 本地预览生成器
 * 用法：node mkpreview.js
 * 输入：home2.html（线上首页快照，已剥离第三方主题）
 * 产出：preview-home.html（含测试文章卡）/ preview-post.html（文章详情 + 评论）
 * 说明：纯本地 file:// 预览，不会访问博客园后台。
 */
const fs = require("fs");
const path = require("path");

const root = __dirname;
let src = fs.readFileSync(path.join(root, "preview-src.html"), "utf8");

// 本地预览自包含：去掉博客园的外部阻塞脚本与依赖它的内联统计脚本，
// 避免 file:// 下拉取 CDN 资源时挂住导致文档永远 loading。
src = src.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/g, "");
src = src.replace(/<script\b[^>]*>\s*$/gm, "");
src = src.replace(/<link[^>]*href="\/[^"]*"[^>]*>\s*/g, "");
src = src.replace(/<link[^>]*href="https?:[^"]*"[^>]*>\s*/g, "");
// 去掉原始 #loading（spinner 样式已在 CSS 中验证保留）
src = src.replace(/<div id="loading">\s*<div class="spinner-box">[\s\S]*?<\/div>\s*<\/div>\s*/, "");

const days = [1, 2, 3]
  .map(
    (i) => `
<div class="day">
  <div class="dayTitle"><a href="/p/${i}">2026-10-2${i} 14:0${i}</a></div>
  <div class="postTitle"><a class="postTitle2" href="/p/${i}">星轨主题的第 ${i} 篇测试文章：关于深色模式与可读性的取舍</a></div>
  <div class="postCon"><div class="c_b_p_desc">这是一段用于验证摘要截断的正文。深色底上的长文本最怕对比度不足，所以正文用了 #E7EEF7 配 #0F151D，正文对比度 13.6:1，次要文字 7.4:1，即使长时间阅读也不会累。这一段写得很长，长到足够触发三行截断，用来确认 line-clamp 在卡片里真的生效，而不是把整段文字摊开把卡片撑变形。</div></div>
  <div class="postDesc">posted @ 2026-10-2${i} 14:0${i} 星月梦微 阅读(${i}2) 评论(${i}) 推荐(${i}) <a href="/p/${i}">编辑</a></div>
</div>`
  )
  .join("");

const ARTICLE = `<div id="topics">
  <div class="post">
    <h1 class="postTitle"><a id="cb_post_title_url" href="#">星轨主题测试文章：一套可迭代的博客园主题是怎么长出来的</a></h1>
    <div class="clear"></div>
    <div class="postBody">
      <div id="cnblogs_post_body">
        <p>这是一篇用来验证主题各组件样式的测试文章。博客园的挂载点只有「页面定制CSS代码」「页首HTML代码」「页脚HTML代码」三个，所以主题必须做到<strong>零依赖、可直接粘贴</strong>。</p>
        <h2>一、为什么要自己写一套</h2>
        <p>现成主题的问题是不可持续迭代：CSS 揉在一起，改一个颜色要翻三百行。星轨的做法是把视觉全部收进设计令牌，见下文。</p>
        <blockquote><p>浮生若梦，人生如露。写点代码，也写点别的。</p></blockquote>
        <h3>1.1 设计令牌</h3>
        <p>所有颜色、字号、间距都是 CSS 自定义属性，例如 <code>--xm-accent: #5FB2FF</code>。换肤只改 tokens.css 一份文件。</p>
        <h4>四级标题样式</h4>
        <ul><li>深色为默认形态</li><li>浅色是完整平行的一套，不是反色</li><li>主按钮文字用深墨 #08131F，不用白字</li></ul>
        <ol><li>冷蓝 #5FB2FF 管技术</li><li>暖金 #F0C987 管人</li></ol>
        <pre><code class="lang-js">const XM = {
  theme: "auto",   // auto | dark | light
  accent: null     // "#FF7A59"
};</code></pre>
        <table><thead><tr><th>场景</th><th>前景</th><th>背景</th><th>对比度</th></tr></thead>
        <tbody><tr><td>正文</td><td>#E7EEF7</td><td>#0F151D</td><td>13.60:1</td></tr>
        <tr><td>次要文字</td><td>#A9B8CA</td><td>#0F151D</td><td>7.40:1</td></tr>
        <tr><td>弱文字</td><td>#7B8A9E</td><td>#0F151D</td><td>4.50:1</td></tr></tbody></table>
        <hr>
        <p>最后一段，用来确认段间距与行高。行高 1.75，段间距 16px，中文长文阅读不挤。</p>
      </div>
    </div>
    <div class="clear"></div>
    <div id="blog_post_info_block">
      <div id="green_channel_favorite">收藏</div>
      <div id="green_channel_digg">推荐(3)</div>
      <div id="green_channel_follow">关注</div>
      <span>标签: <a href="/tag/css">CSS</a> <a href="/tag/boke">博客园</a></span>
    </div>
  </div>
</div>
<div class="feedback_area_title">评论列表</div>
<div class="feedbackItem">
  <div class="feedbackListSubtitle"><a href="#">小微</a> 2026-10-23 18:00 回复</div>
  <div class="feedbackCon"><p>令牌化的思路很干净，改一个变量就能换肤，比揉在一起的 CSS 好维护太多。</p></div>
  <div class="feedbackManage">支持(0) 反对(0) <a href="#">回复</a></div>
</div>
<div id="comment_form_container">
  <textarea rows="6" placeholder="评论支持 Markdown"></textarea>
  <input type="submit" value="提交评论" />
</div>`;

const FOOTER_OLD = `<div class="topicListFooter">
    <div id="nav_next_page">
        

    </div>    
</div>`;

let home = src.replace(FOOTER_OLD, days + "\n" + FOOTER_OLD);
let post = src.replace(days, "").replace(FOOTER_OLD, ARTICLE);


// 第二个参数指定主题：dark / light；会写进 <html data-theme>，
// 这样用 Chrome --screenshot 也能直接截到对应配色，无需模拟媒体查询。
const forced = process.argv[2];
const themeAttr = forced ? ` data-theme="${forced}"` : "";

// 预览自包含：去掉 loading 遮罩与外部脚本；
// 指定主题时把配置里的 auto 改成目标值，否则增强脚本会按系统偏好覆写 data-theme
const pbRaw = fs.readFileSync(path.join(root, "..", "dist", "page-begin.html"), "utf8");
const peRaw = fs.readFileSync(path.join(root, "..", "dist", "page-end.html"), "utf8");
const pb = pbRaw
  .replace(/<div id="loading">\s*<div class="spinner-box">[\s\S]*?<\/div>\s*<\/div>\s*/, "")
  .replace(/theme: "auto"/, forced ? `theme: "${forced}"` : 'theme: "auto"');
const pe = peRaw.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/g, "");

for (const [name, html] of [
  ["preview-home.html", home],
  ["preview-post.html", post],
]) {
  let h = html;
  // 直接内联 CSS，避免 file:// 下 link 解析问题
  const css = fs.readFileSync(path.join(root, "..", "dist", "custom.css"), "utf8");
  h = h.replace("</head>", "<style>\n" + css + "\n</style>\n</head>");
  h = h.replace('<div id="page_begin_html">', '<div id="page_begin_html">\n' + pb + "\n");
  h = h.replace('<div id="page_end_html">', '<div id="page_end_html">\n' + pe + "\n");
  if (themeAttr) h = h.replace("<html", "<html" + themeAttr);
  const out = forced ? name.replace(".html", `-${forced}.html`) : name;
  fs.writeFileSync(path.join(root, out), h);
  console.log(out, h.length, "bytes, shadcn:", (h.match(/shadcn/g) || []).length);
}
