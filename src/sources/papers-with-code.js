import { MAX_ITEMS_PER_SOURCE } from "../config.js";

/**
 * Papers with Code API —— 学术论文+代码，免费无需 API Key
 * 搜索 AI + 软件测试 各子领域论文
 */
const PWC_QUERIES = [
  "AI software testing",
  "AI test generation",
  "AI vulnerability detection",
  "AI program analysis",
  "AI security testing",
  "AI testing framework",
  "AI test automation",
  "AI fuzzing",
  "AI test verification",
  "LLM software testing",
  "machine learning testing",
  "AI quality assurance",
  "AI kernel testing",
  "AI test management",
];

export async function fetchPapersWithCode() {
  const results = [];

  for (const query of PWC_QUERIES) {
    const url = `https://paperswithcode.com/api/v1/papers/?q=${encodeURIComponent(query)}&items_per_page=${MAX_ITEMS_PER_SOURCE}`;

    try {
      const response = await fetch(url, {
        headers: { "Accept": "application/json" },
      });
      const data = await response.json();
      const papers = data?.results || [];

      for (const paper of papers) {
        if (!paper.title || !paper.url_abs) continue;
        results.push({
          title: paper.title,
          url: paper.url_abs,
          source: "paperswithcode",
          timestamp: paper.published || new Date().toISOString(),
        });
      }
    } catch (e) {
      // 国内可能访问受限，静默失败
    }
  }

  console.log(`[PapersWithCode] 抓取到 ${results.length} 条`);
  return results;
}