# FinHot（示例项目文档）

FinHot 是一个 AI 驱动的财经新闻精选系统：从多个来源抓取新闻，用 LLM 分析方向性
（bullish/bearish/neutral），落 prediction_ledger 台账，T+5 异步打标签回测准确率。

核心模块：fetcher（抓取）→ analyzer（方向判断）→ publisher（精选发布）→ labeler（T+5 回测）。
