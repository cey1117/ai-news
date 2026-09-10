import { fetchGoogleNews } from "./sources/google-news.js";
import { fetchArxiv } from "./sources/arxiv.js";
import { fetchReddit } from "./sources/reddit.js";
import { fetchSemanticScholar } from "./sources/semantic-scholar.js";
import { fetchPapersWithCode } from "./sources/papers-with-code.js";
import { fetchGitHubTrending } from "./sources/github-trending.js";
import { summarizeWithLLM } from "./llm.js";
import { renderDailyPage, renderIndexPage } from "./template.js";
import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import path from "path";

async function main() {
  console.log("=== AI + 测试 每日资讯聚合 ===\n");

  const now = new Date();
  const dateStr = formatDate(now);

  // 1. 并行抓取所有信息源
  console.log("[1/5] 抓取信息源...");
  const [googleItems, arxivItems, redditItems, scholarItems, pwcItems, githubItems] = await Promise.all([
    fetchGoogleNews(),
    fetchArxiv(),
    fetchReddit(),
    fetchSemanticScholar(),
    fetchPapersWithCode(),
    fetchGitHubTrending(),
  ]);

  const allItems = [...googleItems, ...arxivItems, ...redditItems, ...scholarItems, ...pwcItems, ...githubItems];
  console.log(`\n总计抓取 ${allItems.length} 条原始条目\n`);

  let summarized;
  let llmProcessed = false;
  if (allItems.length === 0) {
    console.log("未抓取到任何内容，生成空页面。");
    summarized = [];
  } else {
    // 2. LLM 整理
    console.log("[2/5] LLM 整理中...");
    try {
      summarized = await summarizeWithLLM(allItems);
      llmProcessed = true;
      console.log(`整理后得到 ${summarized.length} 条精选内容\n`);
    } catch (e) {
      console.error("[LLM] 整理失败:", e.message);
      // 在 CI 环境（GitHub Actions）中，LLM 失败应该阻止部署，避免覆盖已有内容
      if (process.env.CI) {
        console.error("CI 环境：LLM 处理失败，退出以免覆盖已有内容");
        process.exit(1);
      }
      console.log("本地环境回退：直接使用原始条目");
      summarized = allItems.map((item) => ({
        title: item.title,
        url: item.url,
        category: "综合",
        summary: item.title,
        source: item.source,
        score: 5,
      }));
    }
  }

  // 3. 生成页面
  console.log("[3/5] 生成页面...");

  // 日归档页面
  const dailyHTML = renderDailyPage(summarized, now, llmProcessed);
  const dailyDir = path.resolve(process.cwd(), "docs", dateStr);
  await mkdir(dailyDir, { recursive: true });
  await writeFile(path.join(dailyDir, "index.html"), dailyHTML, "utf-8");
  console.log(`  归档: docs/${dateStr}/index.html`);

  // 4. 更新归档清单
  console.log("[4/5] 更新归档清单...");
  const archivePath = path.resolve(process.cwd(), "docs", "archive.json");
  let archive = { dates: [] };
  try {
    const existing = await readFile(archivePath, "utf-8");
    archive = JSON.parse(existing);
  } catch (e) {
    // 首次运行
  }

  const existingEntry = archive.dates.find((d) => d.date === dateStr);
  if (existingEntry) {
    existingEntry.count = summarized.length;
    existingEntry.updated = now.toISOString();
  } else {
    archive.dates.push({ date: dateStr, count: summarized.length, updated: now.toISOString() });
  }
  archive.dates.sort((a, b) => b.date.localeCompare(a.date));
  await writeFile(archivePath, JSON.stringify(archive), "utf-8");

  // 5. 生成首页（展示最新内容 + 日期选择器）
  console.log("[5/5] 生成首页...");
  const indexHTML = renderIndexPage(summarized, now, archive.dates, llmProcessed);
  await writeFile(path.resolve(process.cwd(), "docs", "index.html"), indexHTML, "utf-8");

  console.log(`\n完成！首页: /index.html    归档: /${dateStr}/index.html`);
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

main().catch((e) => {
  console.error("运行失败:", e);
  process.exit(1);
});