import { MAX_ITEMS_PER_SOURCE } from "../config.js";

/**
 * GitHub API —— 搜索 AI+测试 相关开源项目
 * 免费，无需 API Key（有 rate limit 60次/小时）
 */
const GITHUB_QUERIES = [
  "AI testing tools",
  "AI test automation",
  "LLM testing framework",
  "AI security testing",
  "AI fuzzing",
  "AI vulnerability scanner",
  "AI test generation",
  "machine learning testing",
];

export async function fetchGitHubTrending() {
  const results = [];

  for (const query of GITHUB_QUERIES) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`;

    try {
      const response = await fetch(url, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "ai-news-aggregator",
        },
      });
      const data = await response.json();
      const repos = data?.items || [];

      for (const repo of repos) {
        const title = repo.description
          ? `${repo.full_name}: ${repo.description}`
          : repo.full_name;
        results.push({
          title,
          url: repo.html_url,
          source: "github",
          timestamp: repo.updated_at || new Date().toISOString(),
        });
      }
    } catch (e) {
      // 静默失败
    }
  }

  console.log(`[GitHub] 抓取到 ${results.length} 条`);
  return results;
}