const CATEGORY_COLORS = {
  "工具与框架": "#1890ff",
  "论文与学术": "#722ed1",
  "新闻与观点": "#13c2c2",
  "实战案例": "#52c41a",
};

const CATEGORY_ICONS = {
  "工具与框架": "🔧",
  "论文与学术": "📄",
  "新闻与观点": "📰",
  "实战案例": "💡",
};

const SOURCE_NAMES = {
  google: "Google News",
  arxiv: "arXiv",
  reddit: "Reddit",
};

/**
 * 生成最终 HTML 页面
 * @param {Array} items - LLM 整理后的条目
 * @param {Date} date - 生成时间
 */
export function renderHTML(items, date) {
  const dateStr = date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const timeStr = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

  const itemsHTML = items.length === 0
    ? `<div class="empty">暂无内容，请稍后再来查看。</div>`
    : items.map((item) => `
    <div class="card">
      <div class="card-header">
        <span class="category-tag" style="background:${CATEGORY_COLORS[item.category] || "#666"}">
          ${CATEGORY_ICONS[item.category] || ""} ${item.category}
        </span>
        <span class="source-tag">${SOURCE_NAMES[item.source] || item.source}</span>
      </div>
      <h3><a href="${escapeHTML(item.url)}" target="_blank" rel="noopener">${escapeHTML(item.title)}</a></h3>
      <p class="summary">${escapeHTML(item.summary)}</p>
    </div>
  `).join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI + 测试 每日资讯</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    header {
      text-align: center;
      padding: 40px 0 20px;
    }
    header h1 {
      font-size: 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    header .subtitle { color: #999; font-size: 14px; margin-top: 8px; }
    .stats { text-align: center; margin: 20px 0; color: #999; font-size: 14px; }
    .card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .category-tag {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 10px;
      color: #fff;
      font-size: 12px;
      font-weight: 500;
    }
    .source-tag {
      color: #aaa;
      font-size: 12px;
    }
    .card h3 { font-size: 16px; margin-bottom: 8px; }
    .card h3 a { color: #333; text-decoration: none; }
    .card h3 a:hover { color: #667eea; }
    .summary { color: #666; font-size: 14px; }
    .empty { text-align: center; padding: 80px 0; color: #999; font-size: 16px; }
    footer {
      text-align: center;
      padding: 40px 0;
      color: #bbb;
      font-size: 12px;
    }
    footer a { color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>AI + 测试 每日资讯</h1>
      <p class="subtitle">聚合 AI + 软件测试/内核测试/测试验证 相关最新动态</p>
    </header>
    <div class="stats">📅 ${dateStr} ${timeStr} · 共 ${items.length} 条精选</div>
    ${itemsHTML}
    <footer>
      数据来源: Google News · arXiv · Reddit |
      由大模型自动整理 ·
      <a href="https://github.com/${process.env.GITHUB_REPOSITORY || "your-username/ai-news"}">GitHub</a>
    </footer>
  </div>
</body>
</html>`;
}

function escapeHTML(str) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}