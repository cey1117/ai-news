import { fetchGoogleNews } from "./sources/google-news.js";
import { fetchArxiv } from "./sources/arxiv.js";
import { fetchReddit } from "./sources/reddit.js";
import { summarizeWithLLM } from "./llm.js";
import { renderHTML } from "./template.js";

async function main() {
  console.log("=== AI + 测试 每日资讯聚合 ===\n");

  // 1. 并行抓取所有信息源
  console.log("[1/4] 抓取信息源...");
  const [googleItems, arxivItems, redditItems] = await Promise.all([
    fetchGoogleNews(),
    fetchArxiv(),
    fetchReddit(),
  ]);

  const allItems = [...googleItems, ...arxivItems, ...redditItems];
  console.log(`\n总计抓取 ${allItems.length} 条原始条目\n`);

  if (allItems.length === 0) {
    console.log("未抓取到任何内容，生成空页面。");
    const html = renderHTML([], new Date());
    await writeOutput(html);
    return;
  }

  // 2. LLM 整理
  console.log("[2/4] LLM 整理中...");
  let summarized;
  try {
    summarized = await summarizeWithLLM(allItems);
    console.log(`整理后得到 ${summarized.length} 条精选内容\n`);
  } catch (e) {
    console.error("[LLM] 整理失败:", e.message);
    console.log("回退：直接使用原始条目");
    summarized = allItems.map((item) => ({
      title: item.title,
      url: item.url,
      category: "新闻与观点",
      summary: item.title,
      source: item.source,
    }));
  }

  // 3. 生成 HTML
  console.log("[3/4] 生成页面...");
  const now = new Date();
  const html = renderHTML(summarized, now);

  // 4. 写入 docs/ 目录
  await writeOutput(html);
  console.log("[4/4] 完成！页面已输出到 docs/index.html");
}

async function writeOutput(html) {
  const { writeFile } = await import("fs/promises");
  const { mkdir } = await import("fs/promises");
  const path = await import("path");

  const dir = path.resolve(process.cwd(), "docs");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), html, "utf-8");
}

main().catch((e) => {
  console.error("运行失败:", e);
  process.exit(1);
});