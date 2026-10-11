# 架构说明（示例）

数据流：articles → analyses（LLM 方向判断）→ prediction_ledger（台账）→ labeler（T+5 打标签）。
关键设计：台账只插不更新；回测与发布解耦；失败行标记 failed 不阻塞流水线。
