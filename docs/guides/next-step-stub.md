# 下一步存根（仅记录未完成）

目的：只保留 AI 建议中尚未完成的下一步动作，避免遗漏。

规则：
- 建议项如果已完成，不在本文件记录。
- 建议项如果未完成，追加一条记录。
- 记录要简短、可验证。
- 状态只用 `open` 或 `done`，每周清理已完成项。

模板：

| 日期 | 仓库 | 建议的下一步 | 负责人 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | aido-fe / aido | ... | ... | open | 可选 |

当前未完成项：

| 日期 | 仓库 | 建议的下一步 | 负责人 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| 2026-03-16 | aido-fe | 聚焦开发时将多根工作区拆分为单仓工作区 | raul.tang | open | 降低 AI 上下文与索引压力 |
| 2026-03-16 | aido-fe | 在当前工作区禁用非必要扩展 | raul.tang | open | 仅保留 AI 与核心 lint 工具 |
| 2026-03-17 | aido-fe | 在已登录态下对 `/aido/metric/explorer` 进行 17000 像素级人工核验（重点：内置指标按钮与 PromQL 占位文案位置） | raul.tang | open | 本次仅完成代码级修复与静态检查 |
| 2026-03-17 | aido-fe | 在已登录态下回归日志查询多 tab 切换，确认仅当前 tab 显示查询面板与结果面板 | raul.tang | open | 覆盖查询 1/查询 2 切换、关闭 tab、清空 tab 场景 |
| 2026-03-17 | aido-fe | 在已登录态下回归 InputGroupCompat 覆盖页面（Prom Table、Loki、ES/Doris/TDengine、Dashboard 变量） | raul.tang | open | 本次已完成 23 处 Input.Group 迁移与静态检查 |
| 2026-03-17 | aido-fe | 在已登录态下回归全站菜单与典型页面字体一致性（light/dark/light-gold） | raul.tang | open | 本次已统一主题层字号基线与关键 AntD 组件字号 |
| 2026-03-17 | aido-fe | 在已登录态下验证 `/aido/dashboards` 左侧预置筛选折叠/展开交互（含刷新后状态保持） | raul.tang | open | 本次已修复折叠态交互区域与按钮定位 |
| 2026-03-17 | aido-fe | 在已登录态下验证 explorer 中 disabled 数据源不会出现在下拉且 URL 注入 disabled id 会自动回退到可用数据源 | raul.tang | open | 覆盖 ES/Loki/Prometheus 至少各 1 条链路 |
