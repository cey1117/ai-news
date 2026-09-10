const CATEGORY_META = {
  "用例生成":    { icon: "🧪", color: "#7c3aed", desc: "AI 驱动的测试用例生成与设计" },
  "漏洞分析":    { icon: "🐛", color: "#dc2626", desc: "AI 漏洞检测、缺陷预测与分析" },
  "程序分析":    { icon: "🔍", color: "#2563eb", desc: "AI 静态/动态程序分析与代码审查" },
  "安全扫描":    { icon: "🛡️", color: "#ea580c", desc: "AI 安全测试、渗透测试与漏洞扫描" },
  "缺陷定位":    { icon: "🎯", color: "#c026d3", desc: "AI 故障定位、错误追踪与根因分析" },
  "测试框架":    { icon: "🏗️", color: "#0891b2", desc: "AI 测试框架、工具与自动化平台" },
  "测试工程":    { icon: "⚙️", color: "#4f46e5", desc: "AI 测试工程化与 CI/CD 集成" },
  "测试流程":    { icon: "📋", color: "#059669", desc: "AI 测试管理、流程优化与质量度量" },
  "测试治理":    { icon: "📊", color: "#d97706", desc: "AI 测试策略、质量保障与治理体系" },
  "模糊测试":    { icon: "💥", color: "#b91c1c", desc: "AI 驱动的 Fuzzing 与模糊测试" },
  "内核测试":    { icon: "🖥️", color: "#1e40af", desc: "AI 在内核与系统测试中的应用" },
  "测试验证":    { icon: "✅", color: "#15803d", desc: "AI 辅助测试验证与形式化验证" },
};

const SOURCE_NAMES = {
  google: "Google News",
  arxiv: "arXiv",
  reddit: "Reddit",
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
    <section class="category-section" id="cat-${escapeHTML(cat)}">
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

/**
 * 生成最终 HTML 页面
 * @param {Array} items - LLM 整理后的条目（已含 score、category、summary）
 * @param {Date} date - 生成时间
 */
export function renderHTML(items, date) {
  const dateStr = date.toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });
  const timeStr = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

  // 按 category 分组
  const grouped = {};
  for (const item of items) {
    const cat = item.category || "综合";
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

  const catTags = catOrder.map((cat) => {
    const meta = CATEGORY_META[cat] || { icon: "", color: "#666" };
    return `<a href="#cat-${escapeHTML(cat)}" class="nav-tag">${meta.icon} ${escapeHTML(cat)}</a>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI + 软件测试 每日资讯</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #1e293b;
      --text-secondary: #64748b;
      --border: #e2e8f0;
      --accent: #7c3aed;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }
    .container { max-width: 960px; margin: 0 auto; padding: 0 20px; }

    /* Header */
    header {
      text-align: center;
      padding: 48px 0 24px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 32px;
    }
    header h1 {
      font-size: 32px;
      font-weight: 800;
      background: linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #0891b2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }
    header .subtitle {
      color: var(--text-secondary);
      font-size: 15px;
      margin-top: 8px;
    }
    header .update-time {
      display: inline-block;
      margin-top: 12px;
      padding: 4px 14px;
      background: #f1f5f9;
      border-radius: 20px;
      font-size: 13px;
      color: var(--text-secondary);
    }

    /* Navigation */
    .nav {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 32px;
      justify-content: center;
    }
    .nav-tag {
      display: inline-block;
      padding: 4px 12px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      font-size: 13px;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.15s;
    }
    .nav-tag:hover { border-color: var(--accent); color: var(--accent); }

    /* Section Title */
    .section-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--accent);
      display: inline-block;
    }

    /* Featured */
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
      position: relative;
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

    /* Category Section */
    .category-section {
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

    /* Item Grid */
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
      line-height: 1.5;
    }

    /* Score Badge */
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

    /* Empty */
    .empty { text-align: center; padding: 80px 0; color: #94a3b8; font-size: 16px; }

    /* Footer */
    footer {
      text-align: center;
      padding: 40px 0;
      color: #cbd5e1;
      font-size: 12px;
      border-top: 1px solid var(--border);
      margin-top: 20px;
    }
    footer a { color: #94a3b8; }

    @media (max-width: 640px) {
      header h1 { font-size: 24px; }
      .featured-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>AI + 软件测试 每日资讯</h1>
      <p class="subtitle">聚合 AI 驱动的用例生成、漏洞分析、程序分析、安全扫描、缺陷定位、测试框架、测试工程等领域最新动态</p>
      <div class="update-time">📅 ${dateStr} ${timeStr} · 共 ${items.length} 条</div>
    </header>

    ${catTags ? `<nav class="nav">${catTags}</nav>` : ""}

    ${featuredHTML}

    ${items.length === 0 ? `<div class="empty">暂无内容，请稍后再来查看。</div>` : ""}

    ${sectionsHTML}

    <footer>
      数据来源: Google News · arXiv · Reddit |
      由大模型自动整理 ·
      <a href="https://github.com/${process.env.GITHUB_REPOSITORY || "cey1117/ai-news"}">GitHub</a>
    </footer>
  </div>
</body>
</html>`;
}

function escapeHTML(str) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}