import "dotenv/config";

const BASE_URL = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
const API_KEY = process.env.LLM_API_KEY || "sk-placeholder";
const MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `你是一个 AI + 软件测试 领域的资深信息分析专家和科技记者。用户会给你一批近24小时的新闻、论文、讨论标题和链接。

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
- 业界研究（行业报告、白皮书、技术趋势分析、实践总结）

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

### 3. 深度理解与中文重述（最重要！）
你需要根据标题深入理解每条信息的内容，然后用自然流畅的中文重新表述。要求：
- 像写新闻简报一样，从标题推断出内容的核心要点
- 用中文重新组织语言，不是翻译标题，而是理解后用自己的话讲出来
- 摘要 80-120 字，包含：这项技术/研究做了什么、用了什么方法/技术、有什么意义或影响
- 语言风格：专业但易懂，像科技媒体的报道摘要
- 不要出现"本文"、"该研究"等论文腔，直接说事实

### 4. 分类
将每条归入以下分类之一（必须严格使用以下名称，不要用"综合"）：
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
- 业界研究

### 5. 排序
按质量评分从高到低排序。

## 输出格式

严格按以下 JSON 数组格式输出，不要输出任何其他内容：

[
  {
    "title": "英文原标题",
    "url": "原文链接",
    "category": "分类（必须来自上述列表）",
    "score": 8,
    "summary": "中文深度摘要，80-120字，用自然的中文重新表述内容要点",
    "source": "来源(google/arxiv/reddit/scholar)"
  }
]

只输出纯 JSON 数组，不要加 \`\`\`json 标记，不要加任何解释文字。`;

/**
 * 调用自建 LLM 整理抓取到的原始条目
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
      { role: "user", content: `请分析以下近24小时 AI+软件测试 相关信息。先理解每条的标题推断内容，然后用中文重新表述，严格过滤无关内容，按质量评分排序：\n\n${userContent}` },
    ],
    temperature: 0.5,
    max_tokens: 16384,
  });

  // 兼容推理模型（输出在 reasoning_content）和普通模型（输出在 content）
  const msg = response.choices[0].message;
  let text = (msg.content || msg.reasoning_content || "").trim();

  // 如果模型把 JSON 包在 markdown 代码块里，提取出来
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) text = jsonMatch[1].trim();

  return JSON.parse(text);
}