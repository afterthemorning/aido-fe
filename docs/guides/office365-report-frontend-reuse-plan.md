# Regular Report 前端复用方案（AIDO-FE，首期 Office365）

## 1. 目标

在不新增独立复杂页面的前提下，支持 Regular Report 定期报告能力的最小化前端接入（首期 Office365 Outlook），并复用现有 AIDO-FE 页面能力与交互风格。

## 2. 复用原则

- 低侵入优先：优先复用现有通知与配置页面逻辑。
- 数据源复用优先：沿用当前 datasource 配置与展示模式，不新增平行配置体系。
- 告警机制复用优先：日报/周报共享动作应可接入现有告警/通知链路。
- 规则域分离：定期报告规则与实时告警规则分开展示、分开编辑，避免用户误把日报策略当成阈值告警规则。
- 不做路由扩张：首期不引入新的大型独立工作台。
- 仅做最小 UI 补充：必要时增加“入口按钮 + 抽屉/弹窗”。
- 与后端扩展接口解耦：前端仅调用标准 API。

## 3. 推荐首期前端能力

### 3.1 管理员入口

- 在现有“通知配置/系统配置”附近增加轻量入口：
  - 选择平台类型（首期 o365_outlook）
  - 测试平台连接
  - 配置定期报告规则（日报/周报）
  - 手动触发生成

配置项补充（新增）：

- AI 总结开关、模型、提示词版本、失败回退策略。
- 周报策略：由日报聚合 / 周报二次总结。
- 预审策略：是否启用、审批人、通过后自动发布开关。
- 工作流策略：workflow_profile、workflow_version、多来源节点、转换节点、合并策略。

入口边界建议：

- 页面文案统一使用“定期报告规则”，不使用“告警规则”字样。
- 在“共享到告警链路”动作旁增加提示：仅共享报告结果，不修改实时告警规则。

### 3.2 报告查看

- 首期可复用通用列表/详情布局：
  - 列表：报告类型、时间窗口、状态、生成时间
  - 详情：Markdown 预览 + HTML 预览切换

历史报告能力（新增）：

- 在列表增加历史筛选：策略、日期范围、状态、是否人工编辑。
- 列表项显示：当前 revision、最后编辑人、最后审批动作。
- 详情页展示：简报、完整报告、流水线状态时间线、审批与撤销记录。

状态补充（新增）：

- draft / pending_review / approved / rejected / published
- revoked（已撤销）

### 3.3 报告重发

- 在报告详情中提供“重发邮件”按钮，调用后端重发接口。

### 3.4 报告共享告警（新增）

- 在报告详情增加“共享到告警链路”按钮：
  - 预览共享内容（标题、摘要、窗口、重点数）
  - 选择通知规则/标签
  - 提交后走现有告警通知分发

### 3.5 发布前预审（新增）

- 增加“预审队列”视图：
  - 待审报告列表
  - 审核动作：通过、驳回、要求重生成
  - 审核意见记录与时间线
- 仅 `approved/published` 状态展示“发送邮件/共享告警”按钮。

人工干预编辑与撤销（新增）：

- 在报告详情增加“编辑报告”入口（权限控制）：
  - 可编辑简报、Markdown、HTML
  - 提交时必须填写变更说明
  - 提交后创建新 revision 并进入待审
- 增加“撤销报告”动作：
  - 执行后状态置为 revoked，禁止发送/共享
  - 在撤销窗口内显示“后悔药（Undo Revoke）”按钮
  - 超过窗口隐藏 Undo，仅支持重新审批发布
- 批准后进入“待发送倒计时”状态（approved_waiting_send），不立即发送：
  - 页面展示 scheduled_send_at 与倒计时
  - 在等待窗口内可执行“取消发送”
  - 若期间有改稿且策略要求重审，则自动回到 pending_review

### 3.6 工作流编排配置（新增）

- 在策略编辑抽屉中增加“工作流”分区（不新增独立重页面）：
  - 选择 workflow_profile（如 ops_daily / exec_daily）
  - 选择 workflow_version
  - 配置 Source 节点（首期 Outlook，后续可扩展 datasource/SharePoint/Webhook）
  - 配置 Transform 节点（清洗、分类、标签增强、趋势对比）
  - 配置 Merge 策略（优先级/去重/覆盖）
- 提供“测试运行”按钮：展示节点级执行结果（输入条数、输出条数、耗时、错误）。
- 提供“降级预览”提示：当某节点失败时，页面可提示将使用基础版日报输出。
- 联动约束：保存日报策略时必须选择工作流绑定；未绑定时禁止启用策略。

事件流水线配置与状态展示（新增）：

- 在常规报告规则中增加“事件处理流水线”配置区：
  - 选择多个 pipeline_id
  - 配置 enabled/order/on_failure/timeout/retry
  - 支持拖拽或上下移动调整执行顺序
- 测试运行后展示流水线时间线和状态标签：pending/running/success/failed/skipped/fallback。
- 失败流水线应提供可展开详情（错误信息、重试次数、降级路径）。
- 门禁策略展示：任一关键流水线失败时，页面应明确显示“本次报告禁止发送/共享”。
- 产物展示：同一次执行展示“简报（brief）”与“完整报告（full report）”两个视图标签。

本地整理可视化（新增）：

- 在“测试运行”结果中增加 AI 输入预览：
  - 统计信息（mail_count/thread_count/chunk_count）
  - 高优先级样本（脱敏后）
  - chunk 切分结果和每块 message_id 数量
- 提供“复制统一输入 JSON”按钮（仅管理员可见，默认脱敏），便于定位 AI 输出异常。
- 显示 `prompt_version` 与 `summary_source`，保证日报结果可解释。
- metadata 区域只读展示（policy_id/workflow_id/workflow_version/run_id），由后端 run_context 生成。

## 4. API 对接建议

后端建议前缀：/v1/n9e/regular-report

前端服务层新增最小接口：

- getSources / saveSource / testSource
- getPolicies / savePolicy / runPolicy
- getReports / getReportDetail / resendReport
- getReportHistory / getReportRevisions / updateReportContent
- getExecutions
- previewShareAlert / shareAlert
- getReviewQueue / submitReview / approveReview / rejectReview / regenerateReport
- approveReport / revokeReport / undoRevokeReport
- cancelScheduledSend / getSendSchedule
- getWorkflows / saveWorkflow / updateWorkflow / enableWorkflow / disableWorkflow / testWorkflow
- getExecutionNodes（查看节点级执行日志）
- getPolicyEventPipelines / savePolicyEventPipelines
- getExecutionPipelines（查看流水线级执行状态时间线）
- getExecutionBrief / getExecutionFullReport
- getDigestInputPreview（查看本地整理后的统一 AI 输入预览）

## 5. UI 与交互要求

- 统一使用现有项目组件与样式体系。
- 不引入硬编码色值，遵循主题变量。
- 错误处理明确：连接失败、权限不足、发送失败需有可读反馈。
- 长文本报告支持折叠和复制。

## 6. 分阶段落地

### 阶段 A（不改路由）

- 通过已有页面增加入口按钮打开抽屉配置。
- 提供“最近报告列表 + 详情弹窗”。

### 阶段 B（若产品确认）

- 增加独立轻量路由页面（仅在必要时）。
- 加入筛选、导出和重发批量操作。
- 加入“共享到告警”的批量操作。

## 7. 风险与注意事项

- 后端接口未稳定前，不做复杂状态联动。
- 报告 HTML 预览需注意 XSS 防护策略。
- 报告体较长时，避免一次性渲染阻塞。
- AI 摘要结果需可解释：展示“规则摘要/AI 摘要”来源标识。
- 周报由日报聚合时，需提示数据覆盖区间与缺失天数。

## 8. 结论

AIDO-FE 首期建议采用“最小入口 + 列表详情复用 + 共享告警按钮”的方式接入，不做大规模路由和页面重构，确保与当前框架和低侵入策略一致。

## 9. 现有 AI Summary 复用策略（新增）

现状：

- 项目已存在事件流水线 AI Summary 配置与交互能力。

可复用：

- AI 配置字段结构与表单交互（URL、API Key、模型、Prompt、自定义参数、超时、代理）。
- 试运行与错误提示交互模式。

建议扩展：

- 在“定期报告规则”页面复用同一组 AI 配置组件，但上下文说明改为 ReportContext（非 Alert Event）。
- 增加“摘要来源”展示：rule / ai / mixed。
- 增加“Prompt 版本”展示与回滚入口。
- 与预审联动：AI 生成后默认进入待审，审核通过后才展示发布动作。

边界：

- 复用配置组件，不复用“事件流水线规则编辑入口”。
- 定期报告规则仍保持独立入口与独立保存接口。
