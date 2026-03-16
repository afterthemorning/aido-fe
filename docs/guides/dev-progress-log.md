# Dev Progress Log

## 2026-03-16 - VS Code Performance Optimization + Cache Cleanup

Scope:
- Applied VS Code performance settings to reduce watcher/search pressure.
- Added reusable cache cleanup script and executed it once.
- Introduced unfinished-next-step stub workflow document.

Changes:
- Updated workspace settings in `.vscode/settings.json`.
- Added script `scripts/cleanup_dev_cache.sh` (supports `--dry-run`, `--yes`, `--deep`).
- Added `docs/guides/next-step-stub.md` with current unresolved items.

Execution:
- Ran dry-run and confirmed target paths.
- Ran cleanup with `--yes`; cache/build artifacts were removed in `aido-fe` and sibling `aido` repository.

Retrospective:
- What worked:
  - Minimal, low-intrusion settings changes improved editor overhead control.
  - Safe script flow (`dry-run` + confirmation) reduced accidental deletion risk.
- Risks:
  - `--deep` removes `node_modules` and may increase next startup/install time.
  - Existing large dirty workspace still impacts Git operations and indexing pressure.
- Follow-up:
  - Keep unresolved actions updated in `docs/guides/next-step-stub.md`.
  - Prefer single-repo workspace for long AI sessions.

## 2026-03-17 - Copilot Cache Cleanup + Field Group V2 Migration

Scope:
- Added a Copilot-specific cache cleanup script (separate from code cache cleanup).
- Replaced deprecated input group wrapper usage in query editor/explorer-related pages.
- Introduced a new reusable form field group component for new-version UI compatibility.

Changes:
- Added `scripts/cleanup_copilot_cache.sh`.
- Added `src/components/FieldGroupV2/index.tsx` and `src/components/FieldGroupV2/style.less`.
- Migrated old wrapper usage in:
  - `src/pages/dashboard/Editor/QueryEditor/QueryOptions.tsx`
  - `src/pages/dashboard/Editor/QueryEditor/components/DatasourceSelect/index.tsx`
  - `src/pages/dashboard/Editor/QueryEditor/Elasticsearch/DateField.tsx`
  - `src/pages/dashboard/Editor/QueryEditor/Elasticsearch/QueryPanel.tsx`
  - `src/pages/dashboard/Editor/QueryEditor/Elasticsearch/Values/index.tsx`
  - `src/pages/dashboard/Editor/QueryEditor/Elasticsearch/GroupBy/Terms.tsx`
  - `src/pages/dashboard/Editor/QueryEditor/Elasticsearch/GroupBy/Histgram.tsx`
  - `src/pages/explorer/Loki/index.tsx`

Execution:
- Ran `./scripts/cleanup_copilot_cache.sh --dry-run`.
- Ran `./scripts/cleanup_copilot_cache.sh --yes`.
- Verified main Copilot global storage directories were removed.

Retrospective:
- What worked:
  - Copilot cache cleanup targeted extension state/logs only, avoiding source/build artifacts.
  - `FieldGroupV2` migration removed dependency on incompatible legacy wrapper in related query UI.
- Risks:
  - VS Code may recreate Copilot cache immediately after first request; periodic cleanup may still be needed.
  - Full pixel-level parity with external reference page may require an additional UI pass.
- Follow-up:
  - If needed, run visual alignment pass against `/aido/metric/explorer` reference after this compatibility migration.

## 2026-03-17 - Expanded Full-Repo FieldGroupV2 Migration

Scope:
- Completed repository-wide migration for remaining `InputGroupWithFormItem` usages under `src`.

Changes:
- Batch-replaced old wrapper imports/usages with `FieldGroupV2` across plugin and page modules.
- Confirmed no remaining `InputGroupWithFormItem` references under `src`.

Execution:
- Ran full-text scan before and after replacement.
- Verified post-migration reference count for old component is zero.

Retrospective:
- What worked:
  - Batch replacement completed quickly and consistently in many files.
  - Existing prop shape compatibility minimized migration risk.
- Risks:
  - Large-scope migration may still have edge visual differences in specific plugin pages.
- Follow-up:
  - Run targeted UI verification on high-frequency pages (metric explorer, dashboard query editor, trace search).

## 2026-03-17 - Dashboard Preset Filter Visibility Fix

Scope:
- Fixed missing preset filter visibility in `/aido/dashboards` after form-wrapper migration.

Changes:
- Updated `src/pages/dashboard/Variables/style.less` to make `FieldGroupV2` inline and width-adaptive specifically in dashboard variable container.

Execution:
- Applied container-scoped style override for variable bar layout.

Retrospective:
- What worked:
  - Targeted style patch avoided touching query logic and preserved global component behavior.
- Risks:
  - Further visual tuning may be needed if specific dashboards have unusually long variable labels.

## 2026-03-17 - BusinessGroup Sidebar Display Fix

Scope:
- Fixed BusinessGroup sidebar not visibly showing in collapsed state.

Changes:
- Updated `src/components/BusinessGroup/style.less` collapse handle positioning and z-index.

Execution:
- Kept collapse handle outside zero-width container (`right: -10px`) so users can reopen sidebar.

Retrospective:
- What worked:
  - Pure style fix restored discoverability without touching selection logic.
- Risks:
  - If page-level container overrides overflow aggressively, further local override may still be needed.

## 2026-03-17 - Global Light Theme Typography Baseline Fix

Scope:
- Fixed site-wide visual scaling issue (text/icons/image perception too large) by restoring light theme base typography.

Changes:
- Updated [src/theme/default.light.less](src/theme/default.light.less#L1) to add missing baseline styles:
  - `font-size: 12px`
  - `line-height: 1.5715`

Execution:
- Verified computed styles in local site and legacy reference environment.
- Confirmed `/aido/login` and `/aido/notification-channels` redirect target now use `theme-light` + `body font-size: 12px`.

Retrospective:
- What worked:
  - Minimal theme-level patch restored global scale parity quickly without broad component rewrites.
- Risks:
  - Legacy page-level overrides may still produce isolated visual mismatches and should be checked per module if reported.

## 2026-03-17 - metric/explorer 像素级对齐（对标 17000）

范围：
- 仅针对 `/aido/metric/explorer` 页面做 UI 结构和间距回调，不改功能逻辑和文案。

改动：
- 调整 [src/pages/explorer/Metric.tsx](src/pages/explorer/Metric.tsx#L1)：
  - 恢复参考页容器层级与面板外观参数（面板 padding、maxHeight、关闭按钮位置等）。
- 调整 [src/pages/explorer/Explorer.tsx](src/pages/explorer/Explorer.tsx#L1)：
  - 仅在 `type === 'metric'` 时恢复旧版 datasource 顶栏布局（Row/Col + InputGroup 形态）。
  - 保留现有 datasource 切换逻辑，不改变行为。
  - 日志探索页继续使用现有布局，避免扩大影响面。
- 调整 [src/pages/explorer/components/Help/index.tsx](src/pages/explorer/components/Help/index.tsx#L1)：
  - 补充 `ant-input-group-addon` 类名，确保 metric 顶栏在旧布局下边框与间距对齐。

验证：
- 代码诊断检查通过：上述三个文件无 TypeScript/语法错误。
- 自动化像素对比受限：`/aido/metric/explorer` 在无登录态会发生重定向，Playwright 无法直接在匿名上下文完成目标页截图比对。

复盘：
- 有效点：
  - 通过“仅 metric 分支回调”控制改动范围，降低对其他页面的连带风险。
- 风险点：
  - 仍需在已登录态下进行最终人工像素核验（对比 17000）。

## 2026-03-17 - InputGroupWithFormItem 新框架兼容改造（components）

范围：
- 处理 `src/components` 中旧版 `InputGroupWithFormItem` 与新版本框架兼容问题。
- 清理 metric/explorer 中对旧组件的直接使用。

改动：
- 调整 [src/components/InputGroupWithFormItem/index.tsx](src/components/InputGroupWithFormItem/index.tsx#L1)：
  - 将组件实现改为兼容层，内部统一委托给 `FieldGroupV2`。
  - 保留原有 props 语义，避免调用侧行为变化。
- 调整 [src/components/InputGroupWithFormItem/style.less](src/components/InputGroupWithFormItem/style.less#L1)：
  - 样式选择器切换到 `FieldGroupV2` 结构，保证旧类名仍可生效。
- 调整 [src/pages/explorer/Explorer.tsx](src/pages/explorer/Explorer.tsx#L1)：
  - metric 分支改为直接使用 `FieldGroupV2`，不再直接依赖 `InputGroupWithFormItem`。
- 调整 [src/pages/explorer/index.less](src/pages/explorer/index.less#L1)：
  - 增加 metric datasource 组样式微调，维持与参考页一致的视觉边框与间距。

验证：
- 代码诊断：上述文件无报错。
- 代码扫描：`src` 内仅保留兼容组件定义本身，不再有业务页面直接依赖旧组件。

复盘：
- 有效点：
  - 通过“兼容层 + 页面去直连”兼顾新框架兼容与低侵入改造。
- 风险点：
  - 若后续新增页面再次直接引入旧组件，仍建议优先使用 `FieldGroupV2`。

## 2026-03-17 - 17000 样式选择器兼容修复（FieldGroupV2）

范围：
- 根据 17000 的 `index-06ff0551.css` 对比结果，修复新版本页面中“样式资源已加载但关键选择器未命中”的问题。

结论：
- 旧站通过 `<link>` 加载打包 CSS，新站当前环境以内联 `<style>` 注入为主；并非“无样式加载”。
- 真正差异在于选择器：旧站关键规则依赖 `.ant-input-group.ant-input-group-compact.input-group-with-form-item` 及其子类名，新版本 `FieldGroupV2` 类名结构不同，导致规则不生效。

改动：
- 调整 [src/components/FieldGroupV2/index.tsx](src/components/FieldGroupV2/index.tsx#L1)：
  - 为容器和子节点补充旧版兼容类名（如 `input-group-with-form-item*`、`ant-input-group-addon`）。
  - 保留 `field-group-v2` 新类名，确保新老规则可同时命中。

验证：
- 代码诊断无报错。
- 通过样式加载方式检查确认问题来源为“选择器不匹配”，非“资源未加载”。

## 2026-03-17 - metric/explorer PromQL 输入区对齐修复（promql-input-ng-container）

范围：
- 仅修复 `/aido/metric/explorer` 中“内置指标按钮 + PromQL 输入框”位置偏差。
- 不改功能逻辑，不改文案。

改动：
- 调整 [src/components/PromQLInputNG/style.less](src/components/PromQLInputNG/style.less#L1)：
  - 为 `ant-dropdown-trigger` 增加拉伸对齐，修复内置指标触发器在 NG 结构中的基线偏移。
  - 为 `ant-input-group-addon` 补齐紧凑输入组外观（高度、边框衔接、圆角）。
  - 将 `ant-input-affix-wrapper` 回调为与旧结构一致的高度/内边距，并保持 suffix 垂直居中。
- 调整 [src/components/PromGraphCpt/style.less](src/components/PromGraphCpt/style.less#L59)：
  - 增加表达式行 `> .flex` 的 `align-items: stretch`。
  - 约束 `promql-input-ng-container` 宽度为 `100%`，避免输入区与右侧按钮错位。

验证：
- 代码诊断：上述 less 文件无错误。

复盘：
- 有效点：
  - 通过最小样式补丁恢复了旧输入组的关键布局语义，避免回退到不兼容组件。
- 风险点：
  - 最终像素级结果仍需在已登录态下与 17000 参考页做人工对比确认。

## 2026-03-17 - 日志页 Tab 面板显示修复 + PromQL 输入框边框修复

范围：
- 修复 PromQL 输入行“无边框”和 suffix 偏位问题。
- 修复日志查询多 Tab 场景下非当前 Tab 结果面板同时显示的问题。

改动：
- 调整 [src/components/PromQLInputNG/style.less](src/components/PromQLInputNG/style.less#L1)：
  - 为 `ant-input-group-addon` 和 `ant-input-affix-wrapper` 显式补齐边框与背景。
  - 约束 affix 容器为 `display: flex`，并让输入区 `flex: 1`。
  - 调整 `ant-input-suffix` 为固定尾部布局（`flex-shrink: 0` + `margin-inline-start`）。
- 调整 [src/pages/explorer/index.less](src/pages/explorer/index.less#L325)：
  - 将日志页 tabpane 样式作用域改为仅当前可见 pane：
    ` .ant-tabs-tabpane:not(.ant-tabs-tabpane-hidden) `。

验证：
- less 诊断无报错。

复盘：
- 有效点：
  - 通过选择器约束避免隐藏 tab 被强制显示，修复范围小且不影响业务逻辑。
- 风险点：
  - 仍建议在登录态下做一次日志页多 tab 的人工回归（查询 1/查询 2 切换、增删 tab、清空 tab）。

## 2026-03-17 - 全仓 Input.Group 兼容升级（InputGroupCompat）

范围：
- 对 `src` 与 `plugins` 中所有真实 JSX `Input.Group` 用法做统一兼容升级。
- 目标是消除新版本下 Input.Group 在部分场景中的样式/布局异常（控件不显示、边框错位等）。

改动：
- 新增 [src/components/InputGroupCompat/index.tsx](src/components/InputGroupCompat/index.tsx#L1)。
- 批量将 23 处 `Input.Group` 替换为 `InputGroupCompat`，覆盖以下模块族：
  - Prometheus Table 控件区（Time/Unit）
  - Loki 上下文与探索面板
  - Elasticsearch / Doris / TDengine 查询配置
  - Dashboard 变量与编辑器相关输入组
  - TimeRangePicker 与 PromQueryBuilder 局部输入组

验证：
- 全量扫描确认无真实 `Input.Group` JSX 残留（仅注释文本保留）。
- 代码诊断：`src` 下无新增报错。

复盘：
- 有效点：
  - 统一兼容组件后，后续维护只需在单点收敛输入组行为。
- 风险点：
  - 仍需登录态逐页人工回归典型页面，确认视觉与交互细节完全一致。

## 2026-03-17 - InputGroupCompat 旧样式命中增强

范围：
- 针对 InputGroupCompat 补齐旧样式兼容钩子，修复部分页面在迁移后样式命中不足导致的显示偏差。

改动：
- 调整 [src/components/InputGroupCompat/index.tsx](src/components/InputGroupCompat/index.tsx#L1)：
  - 增加旧版类名钩子：`ant-input-group-wrapper`、`input-group-with-form-item`、`ant-input-group-wrapper-compact`。
  - 引入组件样式文件作为兜底。
- 新增 [src/components/InputGroupCompat/style.less](src/components/InputGroupCompat/style.less#L1)：
  - 兜底输入组与 addon 的对齐规则。
  - 在 compact 场景下补齐 addon 与后续控件的边框圆角衔接。

验证：
- 相关文件诊断无报错。

复盘：
- 有效点：
  - 通过类名兼容和小范围样式兜底，保持旧规则可命中且不回退业务代码。
- 风险点：
  - 仍需登录态回归典型页面，确认不同主题下边框衔接一致。

## 2026-03-17 - 全站字号基线统一（AntD 6 Light/Dark）

范围：
- 修复新站页面与菜单字体大小不一致、整体视觉放大的问题。
- 同步 light / dark / light-gold 三种主题下的基础字号与行高。

改动：
- 调整 [src/theme/variable.css](src/theme/variable.css#L1)：
  - 增加全局字体变量：`--fc-font-size-base`、`--fc-line-height-base`。
  - light/dark/light-gold 明确 `color-scheme` 与基线变量。
- 调整 [src/theme/default.less](src/theme/default.less#L1)：
  - 为 `.theme-light/.theme-dark/.theme-light-gold` 增加统一 typography 基线。
  - 统一关键 AntD 组件字体大小（menu、dropdown、button、form、table、tabs、pagination 等）。
- 调整 [src/theme/default.dark.less](src/theme/default.dark.less#L1) 与 [src/theme/default.light-gold.less](src/theme/default.light-gold.less#L1)：
  - 补齐主题级基线字号与行高。

验证：
- 主题文件诊断无报错。

复盘：
- 有效点：
  - 通过主题层统一基线，避免逐页修字号导致的回归成本。
- 风险点：
  - 极少数页面可能依赖 14px 历史视觉，需要登录态抽样回归并按需局部回调。

## 2026-03-17 - DropdownCompat 6.x 兼容桥增强

范围：
- 强化 `src/components` 内 Dropdown 兼容层，统一承接旧参数与 AntD 6 参数。

改动：
- 调整 [src/components/AntdDropdownCompat/index.tsx](src/components/AntdDropdownCompat/index.tsx#L1)：
  - 支持旧参数 `visible` / `onVisibleChange` 映射到 6.x 的 `open` / `onOpenChange`。
  - 支持 `overlayClassName` / `overlayStyle` 映射到 6.x `classNames.root` / `styles.root`。
  - 保留 `overlay` 用法并通过 `popupRender` 继续兼容旧调用侧。

验证：
- 文件诊断无报错。

复盘：
- 有效点：
  - 无需批量改动业务调用文件即可兼容 6.x Dropdown 参数语义。

## 2026-03-17 - dashboards 预置筛选折叠恢复 + 停用数据源拦截

范围：
- 修复 `/aido/dashboards` 左侧预置筛选折叠后难以再次展开的问题。
- 修复 explorer 场景下停用数据源仍可继续被选择和发起查询的问题。

改动：
- 调整 [src/components/BusinessGroup/index.tsx](src/components/BusinessGroup/index.tsx#L121)：
  - 折叠态下保留 12px 可交互宽度；为 Resizable 容器增加 `overflow: visible`，避免折叠按钮交互区域被裁剪。
- 调整 [src/components/BusinessGroup/style.less](src/components/BusinessGroup/style.less#L8)：
  - 折叠态按钮从 `right: -10px` 改为 `right: 0`，保证按钮始终处于可点击区域。
- 调整 [src/App.tsx](src/App.tsx#L69)：
  - 增加数据源启用态归一化过滤，仅将 enabled 数据源写入全局 `datasourceList/groupedDatasourceList`。
- 调整 [src/pages/explorer/Explorer.tsx](src/pages/explorer/Explorer.tsx#L75)：
  - explorer 的数据源过滤中显式排除 disabled。
  - 当 URL/本地状态带入无效或已停用数据源时，自动切换到当前可用的同类数据源（或首个可用数据源）。

验证：
- 文件级错误检查通过：上述 4 个文件均无 TypeScript/样式错误。

复盘：
- 有效点：
  - 采用“交互可达性修复 + 选择源头过滤 + 表单值兜底纠正”三层最小改动，避免改动查询执行组件内部逻辑。
- 风险点：
  - 若后端 `datasource/brief` 的状态字段命名发生变化，需要在启用态判断中同步扩展字段映射。

## 2026-03-17 - aido-excel 数据源编辑页上传并导入刷新

范围：
- 为 `/aido/datasources/edit/aido-excel/:id` 增加 Excel 文件上传能力。
- 在“测试连通性并保存”流程中串联上传与导入刷新，保证数据快照及时更新。

改动：
- 前端：
  - 调整 [src/plugins/aidoExcel/Datasource/Form.tsx](src/plugins/aidoExcel/Datasource/Form.tsx#L1)：新增上传控件并将待上传文件透传给提交流程。
  - 调整 [src/pages/datasource/Form.tsx](src/pages/datasource/Form.tsx#L1)：`aido-excel` 且 `saveAndTest` 时按顺序执行“上传 -> 保存 -> 导入触发”。
  - 调整 [src/plugins/aidoExcel/services.ts](src/plugins/aidoExcel/services.ts#L1)：新增 `uploadDatasourceExcelFile` API。
- 后端：
  - 调整 [aido/center/router/router_expiry.go](aido/center/router/router_expiry.go#L1)：新增 `ExpiryUpload`，将文件写入与当前配置同目录，且同数据源仅保留一个文件。
  - 调整 [aido/center/router/router.go](aido/center/router/router.go#L1)：注册 `/api/n9e/expiry/upload` 路由。

验证：
- 以上变更文件静态检查通过，无新增 TS/Go 报错。

复盘：
- 有效点：
  - 复用了现有 `expiry/import/trigger` 导入链路，避免新增导入分支逻辑。
  - 上传策略限定同目录并清理旧文件，满足同数据源单文件约束。
- 风险点：
  - 当前“上传+导入”串行执行会增加“测试并保存”耗时，后续可根据用户反馈评估是否异步化导入。
