const CATEGORY_META = {
  "用例生成":    { icon: "🧪", color: "#7c3aed", desc: "AI 生成的测试用例与脚本" },
  "漏洞分析":    { icon: "🐛", color: "#dc2626", desc: "AI 漏洞检测与缺陷预测" },
  "程序分析":    { icon: "🔍", color: "#2563eb", desc: "AI 静态/动态程序分析" },
  "安全扫描":    { icon: "🛡️", color: "#ea580c", desc: "AI 安全测试与漏洞扫描" },
  "缺陷定位":    { icon: "🎯", color: "#c026d3", desc: "AI 故障定位与根因分析" },
  "测试框架":    { icon: "🏗️", color: "#0891b2", desc: "AI 测试框架与自动化平台" },
  "测试工程":    { icon: "⚙️", color: "#4f46e5", desc: "AI 测试工程化与 CI/CD" },
  "测试流程":    { icon: "📋", color: "#059669", desc: "AI 测试管理与流程优化" },
  "测试治理":    { icon: "📊", color: "#d97706", desc: "AI 测试策略与质量保障" },
  "模糊测试":    { icon: "💥", color: "#b91c1c", desc: "AI 驱动的 Fuzzing" },
  "内核测试":    { icon: "🖥️", color: "#1e40af", desc: "AI 内核与系统测试" },
  "测试验证":    { icon: "✅", color: "#15803d", desc: "AI 辅助验证与形式化验证" },
  "业界研究":    { icon: "📖", color: "#6366f1", desc: "行业报告与白皮书" },
};

const SOURCE_NAMES = {
  google: "Google News",
  arxiv: "arXiv",
  reddit: "Reddit",
  scholar: "Semantic Scholar",
};

function scoreBadge(score) {
  if (score >= 8) return `<span class="score score-high">${score}分</span>`;
  if (score >= 6) return `<span class="score score-mid">${score}分</span>`;
  return `<span class="score score-low">${score}分</span>`;
}

function renderItemCard(item) {
  return `
    <a href="${escapeHTML(item.url)}" target="_blank" rel="noopener" class="item-card">
      <div class="item-top">
        <span class="item-source">${SOURCE_NAMES[item.source] || item.source}</span>
        ${scoreBadge(item.score || 5)}
      </div>
      <h4>${escapeHTML(item.title)}</h4>
      <p>${escapeHTML(item.summary)}</p>
    </a>`;
}

function renderCategorySection(cat, items) {
  const meta = CATEGORY_META[cat] || { icon: "📌", color: "#666", desc: "" };
  return `
    <section class="cat-section" id="cat-${escapeHTML(cat)}">
      <div class="cat-header">
        <span class="cat-icon" style="background:${meta.color}">${meta.icon}</span>
        <div>
          <h3>${escapeHTML(cat)}</h3>
          <span class="cat-desc">${escapeHTML(meta.desc)} · ${items.length}条</span>
        </div>
      </div>
      <div class="item-grid">
        ${items.map(renderItemCard).join("")}
      </div>
    </section>`;
}

function buildContentBlocks(items) {
  if (items.length === 0) {
    return { catNav: "", featuredHTML: "", sectionsHTML: `<div class="empty">暂无内容，请稍后再来查看。</div>` };
  }

  // 按 category 分组
  const grouped = {};
  for (const item of items) {
    const cat = item.category || "其他";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  // 同组内按 score 降序
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  // 分类排序：按组内最高分
  const catOrder = Object.keys(grouped).sort((a, b) => {
    const maxA = Math.max(...grouped[a].map((i) => i.score || 0));
    const maxB = Math.max(...grouped[b].map((i) => i.score || 0));
    return maxB - maxA;
  });

  const sectionsHTML = catOrder.map((cat) => renderCategorySection(cat, grouped[cat])).join("");

  // 侧边栏分类导航（只显示已知分类，过滤"综合"/"其他"）
  const catNav = catOrder
    .filter((cat) => CATEGORY_META[cat])
    .map((cat) => {
      const meta = CATEGORY_META[cat];
      return `<a href="#cat-${escapeHTML(cat)}" class="side-nav-item" onclick="setActive(this)">${meta.icon} ${escapeHTML(cat)}<span>${grouped[cat].length}</span></a>`;
    }).join("");

  // 精选 top 3
  const topItems = items.filter((i) => (i.score || 0) >= 8).slice(0, 3);
  const featuredHTML = topItems.length > 0 ? `
    <section class="featured">
      <h2 class="section-title">🔥 今日精选</h2>
      <div class="featured-grid">
        ${topItems.map((item) => `
          <a href="${escapeHTML(item.url)}" target="_blank" rel="noopener" class="featured-card">
            <span class="featured-cat" style="background:${(CATEGORY_META[item.category] || {}).color || "#666"}">${(CATEGORY_META[item.category] || {}).icon || ""} ${escapeHTML(item.category)}</span>
            <h3>${escapeHTML(item.title)}</h3>
            <p>${escapeHTML(item.summary)}</p>
            <div class="featured-meta">
              <span>${SOURCE_NAMES[item.source] || item.source}</span>
              ${scoreBadge(item.score)}
            </div>
          </a>
        `).join("")}
      </div>
    </section>
  ` : "";

  return { catNav, featuredHTML, sectionsHTML };
}

function renderDatePicker(dates, currentDate) {
  if (!dates || dates.length === 0) return "";
  const current = formatDateStr(currentDate);
  const options = dates.map((d) => {
    const label = formatDisplayDate(d.date);
    const selected = d.date === current ? " selected" : "";
    const href = d.date === current ? "./" : `${d.date}/`;
    return `<option value="${href}"${selected}>${label} (${d.count}条)</option>`;
  }).join("");

  return `
    <div class="date-picker">
      <div class="date-label">📅 日期选择</div>
      <select onchange="location=this.value">
        <option value="./">最新</option>
        ${options}
      </select>
    </div>`;
}

function formatDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

const BASE_CSS = `
    :root {
      --bg: #f1f5f9;
      --card-bg: #ffffff;
      --text: #1e293b;
      --text-secondary: #64748b;
      --border: #e2e8f0;
      --accent: #7c3aed;
      --sidebar-w: 220px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }

    /* ====== Layout ====== */
    .app { display: flex; min-height: 100vh; }

    /* ====== Sidebar ====== */
    .sidebar {
      width: var(--sidebar-w);
      background: var(--card-bg);
      border-right: 1px solid var(--border);
      padding: 24px 16px;
      position: fixed;
      top: 0; left: 0; bottom: 0;
      overflow-y: auto;
      z-index: 100;
      display: flex;
      flex-direction: column;
    }
    .sidebar-logo {
      font-size: 18px;
      font-weight: 800;
      background: linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #0891b2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 20px;
      text-align: center;
      line-height: 1.3;
    }
    .sidebar-logo a { text-decoration: none; color: inherit; }

    .date-picker {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }
    .date-label {
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 6px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .date-picker select {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 13px;
      background: var(--bg);
      color: var(--text);
      cursor: pointer;
      outline: none;
      font-family: inherit;
    }
    .date-picker select:focus { border-color: var(--accent); }

    .side-nav-label {
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .side-nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      overflow-y: auto;
    }
    .side-nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 13px;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.12s;
      white-space: nowrap;
    }
    .side-nav-item:hover, .side-nav-item.active {
      background: #ede9fe;
      color: var(--accent);
      font-weight: 600;
    }
    .side-nav-item span {
      font-size: 11px;
      color: #94a3b8;
      background: var(--bg);
      padding: 1px 7px;
      border-radius: 10px;
    }
    .side-nav-item:hover span, .side-nav-item.active span {
      background: #ddd6fe;
      color: var(--accent);
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      font-size: 11px;
      color: #cbd5e1;
      text-align: center;
    }
    .sidebar-footer a { color: #94a3b8; }

    /* ====== Main Content ====== */
    .main {
      margin-left: var(--sidebar-w);
      flex: 1;
      padding: 32px 40px;
      max-width: calc(100vw - var(--sidebar-w));
    }
    .main-header {
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }
    .main-header h1 {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .main-header .subtitle {
      color: var(--text-secondary);
      font-size: 14px;
      margin-top: 6px;
    }
    .update-time {
      display: inline-block;
      margin-top: 10px;
      padding: 3px 12px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--accent);
      display: inline-block;
    }

    .featured { margin-bottom: 40px; }
    .featured-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }
    .featured-card {
      display: block;
      background: var(--card-bg);
      border-radius: 14px;
      padding: 24px;
      text-decoration: none;
      color: var(--text);
      border: 1px solid var(--border);
      transition: all 0.2s;
    }
    .featured-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(124,58,237,0.12);
      border-color: var(--accent);
    }
    .featured-cat {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 10px;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .featured-card h3 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 10px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .featured-card p {
      font-size: 14px;
      color: var(--text-secondary);
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .featured-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 14px;
      font-size: 12px;
      color: #94a3b8;
    }

    .cat-section {
      margin-bottom: 40px;
      scroll-margin-top: 20px;
    }
    .cat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .cat-icon {
      width: 40px; height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .cat-header h3 {
      font-size: 18px;
      font-weight: 700;
    }
    .cat-desc {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .item-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .item-card {
      display: block;
      background: var(--card-bg);
      border-radius: 10px;
      padding: 16px 18px;
      text-decoration: none;
      color: var(--text);
      border: 1px solid var(--border);
      transition: all 0.15s;
    }
    .item-card:hover {
      border-color: #c4b5fd;
      background: #faf9ff;
    }
    .item-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .item-source {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .item-card h4 {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 6px;
      line-height: 1.4;
    }
    .item-card p {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .score {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
    }
    .score-high { background: #dcfce7; color: #15803d; }
    .score-mid  { background: #fef3c7; color: #b45309; }
    .score-low  { background: #f1f5f9; color: #64748b; }

    .empty { text-align: center; padding: 80px 0; color: #94a3b8; font-size: 16px; }

    /* ====== Mobile ====== */
    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main { margin-left: 0; max-width: 100%; padding: 20px 16px; }
      .main-header h1 { font-size: 22px; }
      .featured-grid { grid-template-columns: 1fr; }
    }

    @media (min-width: 769px) {
      .mobile-toggle { display: none; }
    }`;

export function renderDailyPage(items, date) {
  const dateStr = date.toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });
  const timeStr = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const { catNav, featuredHTML, sectionsHTML } = buildContentBlocks(items);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${dateStr} - AI + 软件测试 每日资讯</title>
  <style>${BASE_CSS}</style>
  <script>
    function setActive(el) {
      document.querySelectorAll('.side-nav-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
    }
  </script>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="sidebar-logo"><a href="../">AI + 测试<br>每日资讯</a></div>
      <div class="side-nav-label">📂 分类导航</div>
      <nav class="side-nav">${catNav}</nav>
      <div class="sidebar-footer">
        <a href="../">← 返回首页</a><br><br>
        数据来源<br>Google News · arXiv<br>Reddit · Semantic Scholar<br><br>
        由大模型自动整理<br>
        <a href="https://github.com/${process.env.GITHUB_REPOSITORY || "cey1117/ai-news"}">GitHub</a>
      </div>
    </aside>
    <main class="main">
      <div class="main-header">
        <h1>AI + 软件测试 每日资讯</h1>
        <p class="subtitle">聚合 AI 驱动的用例生成、漏洞分析、程序分析、安全扫描、缺陷定位、测试框架、测试工程等领域最新动态</p>
        <div class="update-time">📅 ${dateStr} ${timeStr} · 共 ${items.length} 条</div>
      </div>
      ${featuredHTML}
      ${sectionsHTML}
    </main>
  </div>
</body>
</html>`;
}

export function renderIndexPage(items, date, archiveDates) {
  const dateStr = date.toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });
  const timeStr = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const { catNav, featuredHTML, sectionsHTML } = buildContentBlocks(items);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI + 软件测试 每日资讯</title>
  <style>${BASE_CSS}</style>
  <script>
    function setActive(el) {
      document.querySelectorAll('.side-nav-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
    }
  </script>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="sidebar-logo"><a href="./">AI + 测试<br>每日资讯</a></div>
      ${renderDatePicker(archiveDates, date)}
      <div class="side-nav-label">📂 分类导航</div>
      <nav class="side-nav">${catNav}</nav>
      <div class="sidebar-footer">
        数据来源<br>Google News · arXiv<br>Reddit · Semantic Scholar<br><br>
        由大模型自动整理<br>
        <a href="https://github.com/${process.env.GITHUB_REPOSITORY || "cey1117/ai-news"}">GitHub</a>
      </div>
    </aside>
    <main class="main">
      <div class="main-header">
        <h1>AI + 软件测试 每日资讯</h1>
        <p class="subtitle">聚合 AI 驱动的用例生成、漏洞分析、程序分析、安全扫描、缺陷定位、测试框架、测试工程等领域最新动态</p>
        <div class="update-time">📅 ${dateStr} ${timeStr} · 共 ${items.length} 条</div>
      </div>
      ${featuredHTML}
      ${sectionsHTML}
    </main>
  </div>
</body>
</html>`;
}

function escapeHTML(str) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}