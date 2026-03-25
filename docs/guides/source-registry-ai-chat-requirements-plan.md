# Regular Report 前端实施计划（读取 Email + 日报）

更新时间：2026-03-25
关联主文档：aido/aido-doc/guides/source-registry-ai-chat-requirements-plan.md

## 1. 目标

在不新建独立重页面的前提下，复用现有 `/regular-report` 页面，补齐“读取 Email -> 生成日报 -> 审批发布 -> 发送反馈”的前端闭环。

## 2. 当前前端状态

已具备：

1. `/regular-report` 路由和菜单入口。
2. 历史列表与状态筛选。
3. 核心动作：编辑、审批、撤销、撤销恢复、取消发送、查看版本。
4. API 服务层已封装 regular-report 生命周期接口。

待补齐：

1. 缺少 Outlook 邮箱连接配置入口。
2. 缺少“手动生成日报/周报”执行入口。
3. 缺少执行日志可视化（mail_count、duration、error）。
4. 缺少 AI 摘要来源与 prompt 版本展示。
5. 缺少工作流绑定与测试运行反馈。

## 3. 分阶段实现

## P0（先打通）

1. 配置入口

- 在现有 regular-report 页面加“数据源配置”抽屉。
- 配置项：tenant_id、client_id、client_secret、mailbox、folder、timezone。
- 增加“测试连接”按钮。

2. 日报生成入口

- 在策略行增加“立即生成”动作。
- 展示执行结果 toast + 最近执行状态。

3. 报告可解释性

- 在详情页展示 `summary_source`（rule/ai/mixed）。
- 展示 `prompt_version` 与 `window_start/window_end`。

## P1（审批与发送可视化）

1. 审批链路可视化

- 明确状态流转：`pending_review -> approved_waiting_send -> published`。
- 在列表和详情显示 `scheduled_send_at` 倒计时。

2. 发送反馈

- 增加发送记录面板：收件人、状态、重试次数、错误信息。
- 对失败结果提供“重发”入口。

3. 历史与回放

- 版本列表增加变更说明、操作人、时间。
- 支持快速跳转查看某个 revision 的简报与完整报告。

## P2（工作流增强）

1. 工作流绑定

- 在策略编辑区增加 `workflow_profile`、`workflow_version`。
- 未绑定 workflow 时禁止启用策略。

2. 测试运行与节点日志

- 增加“测试运行”动作。
- 展示节点级结果（输入/输出条数、耗时、错误）。

3. 周报支持

- 增加周报视图与覆盖区间提示。
- 缺失天数明确提示并标注聚合来源。

## 4. FE API 对接清单

新增/补充接口（在 services.ts 中最小扩展）：

1. `testO365Source(payload)`
2. `saveO365Source(payload)`
3. `runPolicyNow(policyId)`
4. `getExecutions(params)`
5. `getExecutionDetail(executionId)`
6. `getDigestInputPreview(reportId)`

复用已有接口：

1. `getReportsHistory`
2. `getReportRevisions`
3. `updateReportContent`
4. `approveReport`
5. `revokeReport`
6. `undoRevokeReport`
7. `cancelScheduledSend`
8. `getSendSchedule`
9. `bindPolicyNotifyRule`

## 5. UI 交互与风格约束

1. 使用现有组件体系，不新增平行样式系统。
2. 不使用硬编码颜色，统一沿用主题变量。
3. 所有异步动作都要有错误反馈（message/alert）。
4. 长文本渲染保持可折叠与复制能力。

## 6. 验证清单

1. 构建：`npm run build`
2. 单测（目标）：regularReport 相关 service/utils 测试通过。
3. 手测主路径：
   - 配置 O365 源并测试连接。
   - 手动触发日报生成。
   - 编辑内容并提交审批。
   - 查看发送计划并取消发送。
   - 撤销并恢复，确认状态一致。
4. 回归检查：
   - alert-rules 页面
   - notify-channels 页面
   - 现有 regular-report 操作不退化。

## 7. 风险与回滚

风险：

1. 状态展示与后端状态机不一致导致误操作。
2. 长报告渲染卡顿影响操作体验。
3. API 失败分支遗漏导致无反馈。

回滚：

1. 先回滚“数据源配置”和“测试运行”入口，不影响现有生命周期动作。
2. 保留现有 `/regular-report` 基础功能，按开关隐藏新增模块。

## 8. 任务建议（前端）

1. FE-RR-001 O365 配置抽屉 + 测试连接
2. FE-RR-002 策略立即生成与执行状态
3. FE-RR-003 报告详情增加来源与窗口信息
4. FE-RR-004 发送记录面板与重发入口
5. FE-RR-005 工作流绑定与测试运行结果
