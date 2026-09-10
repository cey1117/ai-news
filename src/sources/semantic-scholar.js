import { MAX_ITEMS_PER_SOURCE } from "../config.js";

/**
 * Semantic Scholar API —— 学术论文搜索引擎，免费无需 API Key
 * 搜索 AI + 软件测试 各子领域论文
 */
const SCHOLAR_QUERIES = [
  "AI software testing",
  "AI test generation",
  "AI vulnerability detection software",
  "AI program analysis testing",
  "AI security testing",
  "AI defect localization",
  "AI testing framework",
  "AI test automation",
  "AI fuzzing testing",
  "AI test verification",
  "LLM software testing",
  "machine learning testing",
  "AI quality assurance",
  "AI kernel testing",
  "AI test management",
];

export async function fetchSemanticScholar() {
  const results = [];

  for (const query of SCHOLAR_QUERIES) {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${MAX_ITEMS_PER_SOURCE}&sort=publicationDate:desc&fields=title,url,publicationDate`;

    try {
      const response = await fetch(url, {
        headers: { "Accept": "application/json" },
      });
      const data = await response.json();
      const papers = data?.data || [];

      for (const paper of papers) {
        if (!paper.title || !paper.url) continue;
        results.push({
          title: paper.title,
          url: paper.url,
          source: "scholar",
          timestamp: paper.publicationDate || new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error(`[Semantic Scholar] 抓取失败 (${query}):`, e.message);
    }
  }

  console.log(`[Semantic Scholar] 抓取到 ${results.length} 条`);
  return results;
}