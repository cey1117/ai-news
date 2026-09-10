import { SEARCH_QUERIES, MAX_ITEMS_PER_SOURCE } from "../config.js";

/**
 * Google News RSS —— 不需要爬取，直接请求 RSS XML
 * 格式: https://news.google.com/rss/search?q=关键词&hl=en&gl=US&ceid=US:en
 */
export async function fetchGoogleNews() {
  const results = [];

  for (const query of SEARCH_QUERIES) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en&gl=US&ceid=US:en`;

    try {
      const response = await fetch(url);
      const xml = await response.text();
      const items = parseGoogleNewsRSS(xml);

      for (const item of items.slice(0, MAX_ITEMS_PER_SOURCE)) {
        results.push({
          title: item.title,
          url: item.link,
          source: "google",
          timestamp: item.pubDate,
        });
      }
    } catch (e) {
      console.error(`[Google News] 抓取失败 (${query}):`, e.message);
    }
  }

  console.log(`[Google News] 抓取到 ${results.length} 条`);
  return results;
}

function parseGoogleNewsRSS(xml) {
  const items = [];
  // 正则解析 RSS XML（足够用，不需要完整 XML 解析器）
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");

    if (title && link) {
      items.push({ title, link, pubDate });
    }
  }

  return items;
}

function extractTag(block, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(regex);
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : null;
}