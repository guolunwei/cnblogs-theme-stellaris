#!/usr/bin/env node
/* Build a self-contained local preview for the "direction 2 / Stellaris texture"
 * redesign: a pure cool-blue accent focus on a ~63px one-line toolbar.
 *
 * It inlines the freshly rebuilt dist/custom.css into a real SimpleMemory DOM
 * skeleton, plus the platform-equivalent rules that the live CDP audit found
 * (candy buttons injected AFTER the theme CSS, !important on color/border),
 * so the preview reproduces the live cascade instead of a theme-only vacuum.
 *
 * Switchable in-page: html[data-theme] light/dark, and the blog subtitle
 * (#blogTitle h2) present/empty. No brand name is hard-coded into the theme;
 * the tagline here is only fixture content representing the admin field.
 * Purely local: no network requests, no writes outside examples/.
 *
 * RUN:
 *   node examples/mk-redesign-preview.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CSS = fs.readFileSync(path.join(ROOT, '..', 'dist', 'custom.css'), 'utf8');
const OUT = path.join(ROOT, 'redesign-preview.html');
const TAGLINE = '星轨 · 设计令牌';

/* Platform rules mirrored from diagnostics/cdp-redesign-css-audit.json (live
   blog-common.min.css). They are declared AFTER the theme to mimic runtime
   injection; the redesigned theme rules must still win. */
const PLATFORM_CSS = `
/* ==== platform equivalents (declared AFTER theme, like the live page) ==== */
#green_channel a {
  background-image: linear-gradient(#2daecf, #2daecf); /* stands in for the candy gradient image */
  background-repeat: repeat-x;
  padding: 3px 8px;
  color: rgb(255, 255, 255);
  border-radius: 10px;
  box-shadow: rgba(0, 0, 0, 0.5) 0 1px 3px 0;
  text-shadow: rgba(0, 0, 0, 0.25) 0 -1px 1px;
}
#green_channel #green_channel_digg      { background-color: rgb(45, 174, 191); }
#green_channel #green_channel_follow    { background-color: rgb(227, 49, 0); }
#green_channel #green_channel_favorite  { background-color: rgb(255, 181, 21); }
#green_channel #green_channel_wechat    { background-color: rgb(78, 171, 87); }
#green_channel a:link,
#green_channel a:visited,
#green_channel a:active {
  color: rgb(255, 255, 255) !important;
  border-width: medium !important;
  border-style: none !important;
  border-color: currentcolor !important;
}
`;

const NAV_ITEMS = [
  ['blog_nav_sitehome', '博客园'],
  ['blog_nav_myhome', '首页'],
  ['blog_nav_newpost', '新随笔'],
  ['blog_nav_contact', '联系'],
  ['blog_nav_rss', '订阅'],
  ['blog_nav_admin', '管理']
].map(([id, text], i) =>
  `        <li><a id="${id}" class="menu${i === 1 ? ' is-current' : ''}" href="#">${text}</a></li>`
).join('\n');

const BUTTONS = [
  ['green_channel_digg', '好文要顶'],
  ['green_channel_follow', '关注我'],
  ['green_channel_favorite', '收藏该文'],
  ['green_channel_wechat', '微信分享']
].map(([id, text]) => `            <a id="${id}">${text}</a>`).join('\n');

const HTML = `<!DOCTYPE html>
<html lang="zh-cn" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>星轨 Stellaris · 方向二 星轨质感 本地预览</title>
<style>
/* ==== rebuilt dist/custom.css (theme) ==== */
${CSS}
</style>
<style>
${PLATFORM_CSS}
</style>
<style>
/* preview-only chrome, not part of the theme */
.xm-preview-controls {
  position: fixed; right: 16px; bottom: 16px; z-index: 9999;
  display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;
}
.xm-preview-controls button {
  padding: 8px 14px; border: 1px solid var(--xm-border-strong);
  border-radius: var(--xm-r-button); background: var(--xm-surface);
  color: var(--xm-text); font-size: 13px; cursor: pointer;
}
</style>
</head>
<body class="skin-simplememory no-navbar">
<div id="home">
  <div id="header">
    <div id="blogTitle">
      <a id="lnkBlogLogo" href="#"><img id="blogLogo" src="/skins/custom/images/logo.gif" alt="返回主页" /></a>
      <h1><a id="Header1_HeaderTitle" class="headermaintitle HeaderMainTitle" href="#">星月梦微</a></h1>
      <h2>${TAGLINE}</h2>
    </div>
    <div id="navigator">
      <ul id="navList">
${NAV_ITEMS}
      </ul>
      <div class="blogStats"><span>随笔 - 12 文章 - 3 评论 - 5 阅读 - 1024</span></div>
    </div>
  </div>

  <div id="main">
    <div id="mainContent">
      <div class="forFlow">
        <div id="post_detail">
          <div id="topics">
            <div class="post">
              <h1 class="postTitle"><a id="cb_post_title_url" href="#">星轨主题测试文章：方向二 · 星轨质感</a></h1>
              <div class="clear"></div>
              <div class="postBody">
                <div id="cnblogs_post_body">
                  <p>方向二把强调色收敛成唯一焦点：纯冷蓝。页头仍是约 63px 的单行工具条，但多了标题左侧四分之一轨道弧线、底边 132px 冷蓝轨道线、当前导航淡底，以及侧栏标题的轨道节奏。</p>
                  <h2>一、设计语言</h2>
                  <p>本轮页头 / 底部按钮 / 侧栏三处只用冷蓝，不出现暖金；副标题来自博客园后台「博客子标题」字段，不硬编码品牌名，空节点不占高度。</p>
                  <blockquote><p>浮生若梦，人生如露。</p></blockquote>
                  <p>底部四个按钮中「好文要顶」是主操作（冷蓝淡底 + 冷蓝文字 + 冷蓝边框），其余三个保持中性细边框。</p>
                </div>
              </div>
              <div class="clear"></div>
              <div id="blog_post_info_block" class="post-meta-container">
                <div id="blog_post_info">
                  <div id="green_channel">
${BUTTONS}
                  </div>
                </div>
                <span>标签: <a href="#">CSS</a> <a href="#">博客园</a></span>
              </div>
            </div>
          </div>
          <div class="entrylist">
            <h3 class="entrylistTitle">11 2026 档案</h3>
          </div>
        </div>
      </div>
    </div>
    <div id="sideBar">
      <div id="sideBarMain">
        <div id="sidebar_news" class="newsItem">
          <h3 class="catListTitle">公告</h3>
          <ul><li>星轨主题本地预览</li><li>方向二 · 纯冷蓝</li></ul>
        </div>
        <div id="sidebar_postarchive" class="catListPostArchive">
          <h3 class="catListTitle">随笔档案</h3>
          <ul><li>2026 年 11 月 (3)</li></ul>
        </div>
      </div>
    </div>
    <div class="clear"></div>
  </div>
  <div id="footer">
    <span>&copy; 2004-2026 博客园</span>
  </div>
</div>
<div class="xm-preview-controls">
  <button id="themeToggle" type="button">切换浅色 / 深色</button>
  <button id="taglineToggle" type="button">切换 tagline 有 / 无</button>
</div>
<script>
var TAGLINE = ${JSON.stringify(TAGLINE)};
document.getElementById('themeToggle').addEventListener('click', function () {
  var root = document.documentElement;
  root.setAttribute('data-theme', root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});
document.getElementById('taglineToggle').addEventListener('click', function () {
  var h2 = document.querySelector('#blogTitle h2');
  h2.textContent = h2.textContent ? '' : TAGLINE;
});
</script>
</body>
</html>`;

fs.writeFileSync(OUT, HTML, 'utf8');
console.log('WROTE ' + OUT + '  (' + HTML.length + ' bytes, inlined dist/custom.css)');
