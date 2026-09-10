import { MAX_ITEMS_PER_SOURCE } from "../config.js";

/**
 * arXiv API —— 官方 API，无需爬取
 * 搜索 AI + 软件测试 各子领域论文
 */
const ARXIV_QUERIES = [
  "AI AND test case generation",
  "LLM AND test generation",
  "AI AND vulnerability detection",
  "AI AND bug detection",
  "AI AND program analysis",
  "AI AND static analysis",
  "AI AND security testing",
  "AI AND defect localization",
  "AI AND fault localization",
  "AI AND testing framework",
  "AI AND test automation",
  "AI AND test management",
  "AI AND fuzzing",
  "AI AND kernel testing",
  "AI AND software testing",
  "AI AND test verification",
  "machine learning AND testing",
  "neural network AND test generation",
];

export async function fetchArxiv() {
  const results = [];

  for (const query of ARXIV_QUERIES) {
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&sortBy=submittedDate&sortOrder=descending&max_results=${MAX_ITEMS_PER_SOURCE}`;

    try {
      const response = await fetch(url);
      const xml = await response.text();
      const items = parseArxivXML(xml);

      for (const item of items) {
        results.push({
          title: item.title,
          url: item.link,
          source: "arxiv",
          timestamp: item.published,
        });
      }
    } catch (e) {
      console.error(`[arXiv] 抓取失败 (${query}):`, e.message);
    }
  }

  console.log(`[arXiv] 抓取到 ${results.length} 条`);
  return results;
}

function parseArxivXML(xml) {
  const items = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "id");
    const published = extractTag(block, "published");

    if (title && link) {
      items.push({ title, link, published });
    }
  }

  return items;
}

function extractTag(block, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\S]*?)<\\/${tag}>`, "i");
  const m = block.match(regex);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
}