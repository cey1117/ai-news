import { MAX_ITEMS_PER_SOURCE } from "../config.js";

/**
 * Reddit API —— 访问 .json 即可，无需爬取
 * 子版块: softwaretesting, MachineLearning, testing, QualityAssurance
 */
const SUBREDDITS = [
  "softwaretesting",
  "MachineLearning",
  "QualityAssurance",
  "testing",
];

export async function fetchReddit() {
  const results = [];
  const oneDayAgo = Date.now() / 1000 - 24 * 60 * 60;

  for (const sub of SUBREDDITS) {
    try {
      // 不带 search 的 Reddit API 请求，传多个子版块用 +
      const url = `https://www.reddit.com/r/${sub}/search.json?q=AI+testing+test+automation+generation+vulnerability+fuzzing+verification&sort=new&restrict_sr=on&limit=${MAX_ITEMS_PER_SOURCE}&t=day`;

      const response = await fetch(url, {
        headers: { "User-Agent": "ai-news-aggregator/1.0" },
      });
      const data = await response.json();

      const posts = data?.data?.children || [];
      for (const post of posts) {
        const p = post.data;
        if (p.created_utc < oneDayAgo) continue;

        results.push({
          title: p.title,
          url: `https://www.reddit.com${p.permalink}`,
          source: "reddit",
          timestamp: new Date(p.created_utc * 1000).toISOString(),
        });
      }
    } catch (e) {
      console.error(`[Reddit] 抓取失败 (r/${sub}):`, e.message);
    }
  }

  console.log(`[Reddit] 抓取到 ${results.length} 条`);
  return results;
}