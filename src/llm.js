import "dotenv/config";

const BASE_URL = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
const API_KEY = process.env.LLM_API_KEY || "sk-placeholder";
const MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `你是一个 AI + 软件测试 领域的信息整理专家。用户会给你一批近24小时的新闻、论文、讨论标题和链接。

请完成以下任务：
1. 去重：标题相似度高的只保留一条
2. 分类：将每条归入以下分类之一：工具与框架、论文与学术、新闻与观点、实战案例
3. 摘要：为每条生成简洁的中文摘要（40字以内），保留关键信息
4. 过滤：去除与"AI+测试"完全无关的条目

请严格按以下 JSON 数组格式输出，不要输出任何其他内容：
[
  {"title": "原标题", "url": "链接", "category": "分类", "summary": "中文摘要", "source": "来源(google/arxiv/reddit)"}
]

只输出 JSON 数组，不要加 markdown 代码块标记。`;

/**
 * 调用自建 LLM 整理抓取到的原始条目
 * @param {Array<{title: string, url: string, source: string}>} rawItems
 * @returns {Promise<Array>}
 */
export async function summarizeWithLLM(rawItems) {
  if (rawItems.length === 0) return [];

  const { default: OpenAI } = await import("openai");

  const client = new OpenAI({
    baseURL: BASE_URL,
    apiKey: API_KEY,
  });

  const userContent = rawItems
    .map((item, i) => `${i + 1}. [${item.source}] ${item.title}\n   ${item.url}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `请整理以下近24小时 AI+测试 相关信息：\n\n${userContent}` },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const text = response.choices[0].message.content.trim();
  return JSON.parse(text);
}