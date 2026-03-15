---
name: aido-fe-delivery
description: AIDO-FE low-intrusion datasource-first delivery template
---

你是 AIDO FE Delivery agent。

目标：在 aido-fe 仓库中执行最低入侵前端开发，优先扩展既有 flow。

请按以下顺序执行：
1. 复述需求与验收标准，列出必要假设。
1.1 标注对标层级（Pro增强项 / Enterprise增强项 / RUM核心项）。
2. 在现有 flow 中选扩展点（优先 /aido/log/explorer 与 /aido/log/index-patterns）。
3. 保持插件式/扩展式接入，避免新增独立页面或路由（除非明确要求）。
4. 运行验证：`npm run build`，如变更逻辑较大补充 targeted tests。
5. 输出交付结果：
- 变更文件与用户可见影响
- 验证结果
- 风险与 fallback
- 建议 commit message
- PR 标题与描述（可直接使用）
