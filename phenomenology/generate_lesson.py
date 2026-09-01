#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
现象学100讲 · 单讲页面生成器
读取 lessons/content/lesson-XXX.json，输出 lessons/lesson-XXX.html
"""
import json
import os
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
CONTENT_DIR = os.path.join(BASE, "lessons", "content")
OUT_DIR = os.path.join(BASE, "lessons")

MODULE_NAMES = {
    1: "模块一 · 方法的诞生",
    2: "模块二 · 存在的追问",
    3: "模块三 · 身体的复魅",
    4: "模块四 · 自由与他者",
    5: "模块五 · 枝繁叶散",
    6: "模块六 · 跨学科整合",
}

TYPE_LABELS = {
    "normal": "常规讲",
    "collision": "⚡ 碰撞讲",
    "dialectic": "⚖ 辩证讲",
    "meta": "🔗 元洞见",
    "closing": "◆ 模块收尾",
}

def esc_attr(s):
    return s.replace('"', '&quot;')

def render_normal(data):
    parts = []
    for role_key, role_id, role_name, role_en, role_sub in [
        ("ursprung", "s-ursprung", "溯源者", "Ursprung", data.get("ursprung_sub", "")),
        ("deskription", "s-deskription", "描述者", "Deskription", data.get("deskription_sub", "")),
        ("widerstreit", "s-widerstreit", "诤者", "Widerstreit", data.get("widerstreit_sub", "")),
        ("ruckkehr", "s-ruckkehr", "还归者", "Rückkehr", data.get("ruckkehr_sub", "")),
    ]:
        paras = data.get(role_key, [])
        body = "\n        ".join(f"<p>{p}</p>" for p in paras)
        parts.append(f'''      <div class="role-section" id="{role_id}">
        <h2><span class="role-dot"></span>{role_name} <span class="role-en">{role_en}</span></h2>
        <div class="role-sub">{role_sub}</div>
        {body}
      </div>''')
    return "\n\n".join(parts)

def render_collision(data):
    phenom_paras = "\n          ".join(f"<p>{p}</p>" for p in data.get("phenom", []))
    other_paras = "\n          ".join(f"<p>{p}</p>" for p in data.get("other", []))
    other_title = data.get("other_title", "学科B理论")
    paradox_paras = "\n      ".join(f"<p>{p}</p>" for p in data.get("paradox", []))
    return f'''      <div class="collision-grid">
        <div class="collision-panel phenom" id="s-ursprung">
          <div class="panel-head">现象学理论</div>
          <div class="panel-content">
          {phenom_paras}
          </div>
        </div>
        <div class="collision-panel other" id="s-widerstreit">
          <div class="panel-head">{other_title}</div>
          <div class="panel-content">
          {other_paras}
          </div>
        </div>
      </div>
      <div class="collision-divider"><span class="vs">VS</span></div>
      <div class="paradox-block" id="s-ruckkehr">
        <h3>核心悖论</h3>
      {paradox_paras}
      </div>'''

def render_dialectic(data):
    a_paras = "\n        ".join(f"<p>{p}</p>" for p in data.get("position_a", []))
    b_paras = "\n        ".join(f"<p>{p}</p>" for p in data.get("position_b", []))
    unresolved_paras = "\n        ".join(f"<p>{p}</p>" for p in data.get("unresolved", []))
    a_title = data.get("position_a_title", "立场 A")
    b_title = data.get("position_b_title", "立场 B")
    return f'''      <div class="dialectic-block position-a" id="s-ursprung">
        <h2>{a_title}</h2>
        {a_paras}
      </div>
      <div class="dialectic-block position-b" id="s-deskription">
        <h2>{b_title}</h2>
        {b_paras}
      </div>
      <div class="dialectic-block unresolved" id="s-widerstreit">
        <h2>未解的分歧点</h2>
        {unresolved_paras}
      </div>'''

def render_meta(data):
    # meta uses same 4-role layout but with "scope" banner
    return render_normal(data)

def render_closing(data):
    return render_normal(data)

RENDERERS = {
    "normal": render_normal,
    "meta": render_meta,
    "closing": render_closing,
    "collision": render_collision,
    "dialectic": render_dialectic,
}

def render_toc_links(ltype):
    if ltype == "collision":
        return '''<a href="#s-ursprung" class="sidebar-link">现象学理论</a>
      <a href="#s-widerstreit" class="sidebar-link">学科B理论</a>
      <a href="#s-ruckkehr" class="sidebar-link">核心悖论</a>'''
    if ltype == "dialectic":
        return '''<a href="#s-ursprung" class="sidebar-link">立场 A</a>
      <a href="#s-deskription" class="sidebar-link">立场 B</a>
      <a href="#s-widerstreit" class="sidebar-link">未解的分歧点</a>'''
    return '''<a href="#s-ursprung" class="sidebar-link">溯源者</a>
      <a href="#s-deskription" class="sidebar-link">描述者</a>
      <a href="#s-widerstreit" class="sidebar-link">诤者</a>
      <a href="#s-ruckkehr" class="sidebar-link">还归者</a>'''

def build_lesson(num):
    path = os.path.join(CONTENT_DIR, f"lesson-{num:03d}.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    title = data["title"]
    ltype = data["type"]
    module_id = data["module"]
    module_name = MODULE_NAMES[module_id]
    type_label = TYPE_LABELS[ltype]
    type_class = "" if ltype == "normal" else f" {ltype}"

    body_html = RENDERERS[ltype](data)

    meta_scope_html = ""
    if ltype == "meta" and data.get("scope"):
        meta_scope_html = f'<div class="meta-scope">📍 本讲回顾范围：{data["scope"]}</div>\n'

    dharma_items = "\n          ".join(f"<li>{p}</li>" for p in data.get("dharma_card", []))
    quote_text = data.get("quote", "")
    quote_src = data.get("quote_src", "")
    quote_html = ""
    if quote_text:
        quote_html = f'''      <div class="quote-block">
        {quote_text}
        <span class="src mono">{quote_src}</span>
      </div>'''

    connection_html = ""
    if data.get("connection"):
        connection_html = f'''      <div class="connection-note">
        🔗 <strong>与前后讲的连接</strong>：{data["connection"]}
      </div>'''

    dharma_html = ""
    if dharma_items:
        dharma_html = f'''      <div class="card-block">
        <h3 class="sans">📌 法义卡片</h3>
        <ul>
          {dharma_items}
        </ul>
      </div>'''

    prev_num = num - 1
    next_num = num + 1
    prev_html = f'<a href="lesson-{prev_num:03d}.html" class="nav-btn">← 第{prev_num}讲</a>' if prev_num >= 1 else '<div class="nav-btn nav-disabled">← 已到第一讲</div>'
    next_html = f'<a href="lesson-{next_num:03d}.html" class="nav-btn">第{next_num}讲 →</a>' if next_num <= 100 else '<div class="nav-btn nav-disabled">已是最后一讲 →</div>'

    prev_side = f'<a href="lesson-{prev_num:03d}.html">← 第{prev_num}讲</a>' if prev_num >= 1 else '<span style="opacity:.4">← 第一讲</span>'
    next_side = f'<a href="lesson-{next_num:03d}.html">第{next_num}讲 →</a>' if next_num <= 100 else '<span style="opacity:.4">最后一讲 →</span>'

    toc_links = render_toc_links(ltype)

    module_color = {1: "var(--m1)", 2: "var(--m2)", 3: "var(--m3)", 4: "var(--m4)", 5: "var(--m5)", 6: "var(--m6)"}[module_id]

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>第{num}讲：{title} — 现象学100讲</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700;900&family=Noto+Sans+SC:wght@400;500;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/style.css">
</head>
<body>

<div class="topbar">
  <div class="topbar-left">
    <a href="../../" class="root-link">← Ethan&#39;s Lab</a>
    <span class="topbar-sep">|</span>
    <span class="site-title"><a href="../index.html">现象学100讲</a></span>
  </div>
  <div class="controls">
    <button id="fontSizeDecrease" title="缩小字号">A-</button>
    <button id="fontSizeIncrease" title="放大字号">A+</button>
    <button id="themeToggle" title="切换雾态模式">🌫 雾态</button>
  </div>
</div>

<div class="lecture-container">
  <aside class="lecture-sidebar">
    <div class="sidebar-nav">
      <div class="toc-title">本讲目录</div>
      {toc_links}
      <a href="#dharma-card" class="sidebar-link">法义卡片</a>
    </div>
    <div class="sidebar-prev-next">
      {prev_side}
      {next_side}
    </div>
  </aside>

  <main class="lecture-main">
    <nav class="crumb"><a href="../index.html">首页</a> &gt; <a href="../index.html">{module_name}</a> &gt; 第{num}讲</nav>

    <div class="lesson-header">
      <div class="tag-row">
        <span class="module-tag" style="background:{module_color}">{module_name}</span>
        <span class="type-tag{type_class}">{type_label}</span>
      </div>
      <div class="sub-num mono">⟨ {num:02d} / 100 ⟩</div>
      <h1>{title}</h1>
    </div>

    <span id="lessonNum" data-num="{num}" style="display:none;"></span>

    {meta_scope_html}{body_html}

{dharma_html}

{quote_html}

{connection_html}

      <div class="mark-read-section">
        <button id="markReadBtn" class="mark-read-btn">标记为已读</button>
      </div>

      <div class="bottom-nav">
        {prev_html}
        <a href="../index.html" class="nav-btn">返回目录</a>
        {next_html}
      </div>
  </main>
</div>

<footer class="site-footer">
  现象学100讲 · Phenomenology · Ethan
</footer>

<button id="tocToggle" class="toc-toggle" title="目录">☰</button>
<div id="tocOverlay" class="toc-overlay"></div>
<div id="tocDrawer" class="toc-drawer">
  <button id="tocClose" class="toc-close">✕</button>
  <div class="sidebar-nav" style="margin-top:20px;">
    <div class="toc-title">本讲目录</div>
    {toc_links}
  </div>
  <div class="sidebar-nav" style="margin-top:12px;">
    <a href="../index.html" class="sidebar-link">← 返回导航首页</a>
  </div>
</div>

<button id="scrollTopBtn" class="scroll-top" title="回到顶部">↑</button>
<script src="../assets/script.js"></script>
</body>
</html>'''

    out_path = os.path.join(OUT_DIR, f"lesson-{num:03d}.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated lesson-{num:03d}.html ({len(html)} chars)")

if __name__ == "__main__":
    nums = [int(x) for x in sys.argv[1:]] if len(sys.argv) > 1 else range(1, 11)
    for n in nums:
        build_lesson(n)
