/* ==========================================================================
   Stellaris · DOM selector adapter
   Collects platform-private selectors in one registry so the enhancement
   layer can stay skin-agnostic. enhance.js consumes pick()/pickAll() only.
   Runs before enhance.js (see build.js JS_ORDER) as a standalone IIFE.
   ========================================================================== */
(function () {
  "use strict";

  var XM = window.XM || {};

  /* Registry is grouped by skin/skeleton. Each key holds an ordered array of
     candidate selectors; the first matching candidate wins. Multiple
     candidates absorb known cnblogs drift (see docs/adapter.md). */
  var XM_SELECTORS = {
    simplememory: {
      postBody:          ["#cnblogs_post_body", ".postCon", "#post_detail", ".postBody"],
      header:            ["#header", "#blogTitle", "header.site"],
      sideBar:           ["#sideBar", "#sidebar", ".sideBar"],
      navMenuLinks:      ["#navList a.menu", "#navList a", ".menu a"],
      blogLogo:          ["#blogLogo", ".blogLogo", "#blogLogo img"],
      blogLogoLink:      ["#lnkBlogLogo", "a#lnkBlogLogo"],
      tagCloud:          [".catListTag", "#sidebar_tag", ".tag-cloud", "#tagCloud"],
      archiveMonthItems: [".entrylistItem", ".entrylistItemPostCon", ".post-list-item"],
      archiveDayTitles:  [".day > .postTitle", ".day .postTitle", ".postTitle"],
      hljsLineTable:     ["table.hljs-ln", ".hljs-ln"],
      tocButton:         [".cnblogs-toc-button", ".toc-button"],
      /* Root-level nodes that enhance.js used to hard-code via getElementById /
         querySelectorAll. Keeping them here lets missing skeletons degrade. */
      loading:           ["#loading"],
      codeBlocks:        ["#cnblogs_post_body pre, .postCon pre"],
      mainContent:       ["#mainContent"],
      tagList:           ["#taglist, .catListTag, #sidebar_toptags"]
    },
    fallback: {
      postBody:          ["article", ".post-content", ".entry-content", "#content"],
      header:            ["header", "#top", ".site-header"],
      sideBar:           ["aside", "#side", ".sidebar"],
      navMenuLinks:      ["nav a", ".nav a"],
      blogLogo:          [".logo img", "header img"],
      blogLogoLink:      ["a.logo", 'a[href="/"]'],
      tagCloud:          [".tags", ".tagcloud", ".widget_tag_cloud"],
      archiveMonthItems: [".archive-item", ".post-list-item", ".entry-list > li"],
      archiveDayTitles:  [".post-title", "h2.postTitle", ".entry-title"],
      hljsLineTable:     ["table.hljs-ln"],
      tocButton:         [".toc-toggle", ".toc-button"],
      /* Keep code-copy usable on skins without the SimpleMemory containers. */
      codeBlocks:        ["pre"],
      mainContent:       ["main", "#content"],
      tagList:           [".tags", ".tagcloud"]
    }
  };

  /* Custom selectors merge per key (override, not wholesale replace). Custom
     candidates go first, built-in ones stay as a fallback. Invalid selector
     strings are rejected here so one bad value cannot poison a whole key. */
  function validSelector(s) {
    if (typeof s !== "string" || !s) return false;
    try {
      document.querySelector(s);
      return true;
    } catch (e) {
      return false;
    }
  }

  function asArray(v) {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") return [v];
    return null;
  }

  function unique(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (out.indexOf(list[i]) === -1) out.push(list[i]);
    }
    return out;
  }

  function mergeKey(group, key, v) {
    var arr = asArray(v);
    if (!arr) return;
    var clean = arr.filter(validSelector);
    if (!clean.length) return; /* all invalid: keep the built-in candidates */
    if (!XM_SELECTORS[group]) XM_SELECTORS[group] = {};
    var base = XM_SELECTORS[group][key] || [];
    XM_SELECTORS[group][key] = unique(clean.concat(base));
  }

  function applyCustom(custom) {
    if (!custom || typeof custom !== "object") return;
    Object.keys(custom).forEach(function (name) {
      var v = custom[name];
      if (asArray(v)) {
        /* Flat form: { postBody: ["..."] } merges into the default group. */
        mergeKey("simplememory", name, v);
      } else if (v && typeof v === "object") {
        /* Grouped form: { simplememory: { postBody: ["..."] } }. */
        Object.keys(v).forEach(function (key) {
          mergeKey(name, key, v[key]);
        });
      }
    });
  }

  applyCustom(XM.selectors);

  function candidates(key, group) {
    var out = [];
    var primary = XM_SELECTORS[group];
    if (primary && primary[key]) out = out.concat(primary[key]);
    /* The fallback group always trails, so a missing skin node degrades quietly. */
    if (group !== "fallback" && XM_SELECTORS.fallback && XM_SELECTORS.fallback[key]) {
      out = out.concat(XM_SELECTORS.fallback[key]);
    }
    return out;
  }

  /* Return the first matching node for a component key, or null. No match is
     a normal outcome: the caller silently skips that component (see
     enhance.js initLogo's isolated try/catch). Never throws, never creates
     placeholder nodes, never blocks later init. */
  function pick(key, group) {
    var list = candidates(key, group || "simplememory");
    for (var i = 0; i < list.length; i++) {
      try {
        var node = document.querySelector(list[i]);
        if (node) return node;
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  function pickAll(key, group) {
    var list = candidates(key, group || "simplememory");
    var out = [];
    for (var i = 0; i < list.length; i++) {
      try {
        var nodes = document.querySelectorAll(list[i]);
        for (var j = 0; j < nodes.length; j++) out.push(nodes[j]);
      } catch (e) {
        continue;
      }
    }
    return out;
  }

  /* Single public handle for enhance.js and console inspection. A second
     global alias would drift out of sync with the merged registry. */
  window.XM_ADAPTER = {
    SELECTORS: XM_SELECTORS,
    pick: pick,
    pickAll: pickAll
  };
})();
