#!/bin/bash
set -e

cd /home/huawei/ai-news

echo "=== $(date '+%Y-%m-%d %H:%M:%S') 开始更新 ==="

# 拉取最新代码
git pull origin main --rebase 2>/dev/null || true

# 运行抓取+LLM处理
npm run fetch

# 如果有变更就提交推送
if git diff --quiet docs/ && git diff --cached --quiet; then
  echo "内容无变化，跳过提交"
else
  git add docs/
  git commit -m "chore: auto update $(date '+%Y-%m-%d %H:%M')"
  git push origin main
  git push origin $(git subtree split --prefix docs main):gh-pages --force
  echo "已推送到 GitHub Pages"
fi

echo "=== 更新完成 ==="