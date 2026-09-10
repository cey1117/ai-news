import "dotenv/config";

const BASE_URL = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
const API_KEY = process.env.LLM_API_KEY || "sk-placeholder";
const MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `你是一个 AI + 软件测试 领域的资深信息分析专家。用户会给你一批近24小时的新闻、论文、讨论标题和链接。

## 你的核心任务

### 1. 严格相关性过滤
只保留与 "AI/ML/LLM + 软件测试" 直接相关的条目。以下领域均算相关：
- 用例生成（AI生成测试用例、测试脚本）
- 漏洞分析（AI检测漏洞、缺陷预测）
- 程序分析（AI静态分析、动态分析、代码审查）
- 安全扫描（AI安全测试、渗透测试、漏洞扫描）
- 缺陷定位（AI故障定位、错误追踪、根因分析）
- 测试框架（AI测试框架、测试工具、自动化平台）
- 测试工程（AI测试工程化、CI/CD中AI应用）
- 测试流程（AI测试管理、流程优化、质量度量）
- 测试治理（AI测试策略、质量保障体系）
- 模糊测试（AI驱动的Fuzzing）
- 内核测试（AI在内核/系统测试中的应用）
- 测试验证（AI辅助验证、形式化验证）

**必须丢弃的条目**：
- 纯AI模型研究（不涉及测试应用）
- 通用软件开发（不涉及AI+测试）
- 纯硬件测试、非软件测试
- 与AI或测试完全无关的内容

### 2. 质量评分
根据信息价值对每条进行 1-10 评分：
- 8-10分：重大突破、新工具发布、重要论文、深度分析
- 5-7分：有价值的技术分享、实践经验、行业动态
- 1-4分：一般性讨论、重复内容（这类直接丢弃，不输出）

### 3. 分类
将每条归入以下分类之一：
- 用例生成
- 漏洞分析
- 程序分析
- 安全扫描
- 缺陷定位
- 测试框架
- 测试工程
- 测试流程
- 测试治理
- 模糊测试
- 内核测试
- 测试验证
- 业界研究（行业报告、白皮书、技术趋势分析、实践总结）

### 4. 中文摘要
为每条生成中文摘要（50-80字），要求：
- 保留关键信息：谁做了什么、用什么技术、达到什么效果
- 语言流畅、信息密度高
- 不要翻译腔

### 5. 排序
按质量评分从高到低排序。

## 输出格式

严格按以下 JSON 数组格式输出，不要输出任何其他内容：

[
  {
    "title": "英文原标题",
    "url": "原文链接",
    "category": "分类",
    "score": 8,
    "summary": "中文摘要，50-80字，信息密度高",
    "source": "来源(google/arxiv/reddit)"
  }
]

只输出纯 JSON 数组，不要加 \`\`\`json 标记，不要加任何解释文字。`;

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
      { role: "user", content: `请分析以下近24小时 AI+软件测试 相关信息，严格过滤相关性，高质量评分，中文摘要，按评分排序：\n\n${userContent}` },
    ],
    temperature: 0.3,
    max_tokens: 8192,
  });

  const text = response.choices[0].message.content.trim();
  return JSON.parse(text);
}