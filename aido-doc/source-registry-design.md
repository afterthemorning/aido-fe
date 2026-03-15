# Source Registry — 完整产品设计方案

> 基准：代码现状 2026-03-16 | 对标：Flashcat Pro/Enterprise 采集器生命周期治理能力

---

## 一、对标分析与立项背景

### 1.1 对标信号（来自 [rum-and-enterprise-ui-roadmap.md](./rum-and-enterprise-ui-roadmap.md)）

| 对标产品 | 关键能力信号 | 我们的差距 |
|---|---|---|
| **Flashcat Pro** | 更强的 datasource support + **collector lifecycle operations** | 无采集器注册/治理/审计界面 |
| **Flashcat Enterprise** | 全栈可观测 workspace + 访问控制深度 | 数据接入侧无 API Key 管理和策略管控 |
| **行业通用** | 数据接入 --- Key 颁发 --- QPS/基数策略 --- 审计 是一条完整链路 | 当前仅有 datasource 配置，无接入侧治理 |

### 1.2 产品定位

Source Registry 属于路线图中 **"Datasource operations workspace"** 工作流的核心实现：

```
路线图原文（Enterprise/Pro Depth Enhancements）：
  2. Datasource operations workspace
     - Source governance, health, and policy views with clearer lifecycle status
```

具体落地为：
- **数据源注册**：每个接入来源（采集器实例/Agent）需注册登记，获得唯一 `source_id`
- **API Key 管理**：为注册源颁发、轮换、撤销 API Key，密钥不落库明文
- **接入策略**：QPS/突发限流 + 基数限制 + 协议白名单 + IP 白名单 + Label 过滤
- **审计日志**：所有接入操作（成功/拒绝/错误）均留存审计记录

---

## 二、当前代码现状（已实现）

| 层 | 状态 | 文件 |
|---|---|---|
| 路由注册 | ✅ `/source-registry` 已挂载菜单 | `src/routers/index.tsx:201` |
| 页面主组件 | ✅ 单文件实现，约 500 行 | `src/aido-extension/sourceregistry/index.tsx` |
| API 服务层 | ✅ 8 个接口全部定义 | `src/aido-extension/sourceregistry/services.ts` |
| 前端类型定义 | ✅ 4 个核心实体完整 | `SourceRegistry / SourceAPIKey / SourcePolicy / SourceAuditEvent` |
| 国际化 | ✅ zh_CN / en_US 双语覆盖所有字段 | `locale/zh_CN.ts` / `locale/en_US.ts` |

### 现有 Gap（待补齐）

| # | Gap 描述 | 影响 |
|---|---|---|
| G1 | `owner_team_id` 用 free-text 而非团队选择器 | 团队 ID 易输错，无法与 RBAC 联动 |
| G2 | `target_datasource_id` 用 InputNumber 而非 Datasource 选择器 | 用户不知填什么 ID |
| G3 | `source_id` 无格式校验正则 | 可提交非法格式，后端返回 500 |
| G4 | 列表无分页（API 已支持 `p/limit` 参数） | 超 50 条时页面卡死 |
| G5 | 审计日志无筛选控件（API 已支持多维筛选） | 无法高效定位审计记录 |
| G6 | `DatasourceCateSelectV2` `disabled` prop 未透传到 `onClick` | disabled 状态下仍可点击 |

---

## 三、数据库 DDL

```sql
-- 数据源注册表
CREATE TABLE source_registry (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_id            VARCHAR(64)  NOT NULL UNIQUE,  -- 用户可读 ID，如 prod-nginx-01
  source_name          VARCHAR(128) NOT NULL,
  owner_team_id        BIGINT UNSIGNED DEFAULT 0,
  owner_team_name      VARCHAR(64)  DEFAULT '',
  env                  VARCHAR(32)  NOT NULL,           -- prod / staging / dev
  agent_type           VARCHAR(32)  NOT NULL,           -- categraf / otel
  target_datasource_id BIGINT       NOT NULL DEFAULT 0,
  status               VARCHAR(16)  NOT NULL DEFAULT 'enabled', -- enabled / disabled
  description          VARCHAR(512) DEFAULT '',
  created_by           VARCHAR(64)  NOT NULL DEFAULT '',
  created_at           BIGINT       NOT NULL DEFAULT 0,
  updated_by           VARCHAR(64)  NOT NULL DEFAULT '',
  updated_at           BIGINT       NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_status (status),
  INDEX idx_env (env),
  INDEX idx_owner_team (owner_team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- API Key 表（明文不落库）
CREATE TABLE source_api_key (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  key_id       VARCHAR(64)  NOT NULL UNIQUE,
  source_id    VARCHAR(64)  NOT NULL,
  key_hash     VARCHAR(128) NOT NULL,   -- bcrypt 或 sha256(key)
  status       VARCHAR(16)  NOT NULL DEFAULT 'active',  -- active / revoked / expired
  expires_at   BIGINT       NOT NULL DEFAULT 0,   -- 0 = 永不过期
  revoked_at   BIGINT       NOT NULL DEFAULT 0,
  revoked_by   VARCHAR(64)  NOT NULL DEFAULT '',
  last_used_at BIGINT       NOT NULL DEFAULT 0,
  last_used_ip VARCHAR(64)  NOT NULL DEFAULT '',
  created_by   VARCHAR(64)  NOT NULL DEFAULT '',
  created_at   BIGINT       NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_source_id (source_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 接入策略表（按 source_id 主键，1:1）
CREATE TABLE source_policy (
  source_id           VARCHAR(64)  NOT NULL,
  qps_limit           INT          NOT NULL DEFAULT 500,
  burst_limit         INT          NOT NULL DEFAULT 1000,
  cardinality_limit   INT          NOT NULL DEFAULT 50000,
  allowed_protocols   JSON         NOT NULL DEFAULT '["otlp/grpc","otlp/http","categraf"]',
  ip_allowlist        JSON         NOT NULL DEFAULT '[]',
  required_labels     JSON         NOT NULL DEFAULT '[]',
  allowed_labels      JSON         NOT NULL DEFAULT '[]',
  blocked_labels      JSON         NOT NULL DEFAULT '[]',
  updated_by          VARCHAR(64)  NOT NULL DEFAULT '',
  updated_at          BIGINT       NOT NULL DEFAULT 0,
  PRIMARY KEY (source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 审计日志表（高写入，建议按月分区或落 ClickHouse）
CREATE TABLE source_audit_event (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id       VARCHAR(64)  NOT NULL UNIQUE,
  source_id      VARCHAR(64)  NOT NULL,
  key_id         VARCHAR(64)  NOT NULL DEFAULT '',
  actor          VARCHAR(64)  NOT NULL DEFAULT '',
  action         VARCHAR(64)  NOT NULL,
  -- action 枚举：key_create / key_revoke / source_create / source_update
  --             source_enable / source_disable / policy_update
  --             ingest_allow / ingest_deny / ingest_error
  result         VARCHAR(16)  NOT NULL,   -- success / deny / error
  reason         VARCHAR(512) NOT NULL DEFAULT '',
  request_path   VARCHAR(256) NOT NULL DEFAULT '',
  request_method VARCHAR(16)  NOT NULL DEFAULT '',
  request_ip     VARCHAR(64)  NOT NULL DEFAULT '',
  created_at     BIGINT       NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_source_id (source_id),
  INDEX idx_key_id (key_id),
  INDEX idx_created_at (created_at),
  INDEX idx_action_result (action, result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 四、API 契约

### 4.1 Backoffice 接口（已对齐 services.ts）

| Method | Path | 说明 | 返回 |
|---|---|---|---|
| `GET` | `/api/n9e/source-registry/sources` | 列表，支持 `p` / `limit` | `{ list, total }` |
| `POST` | `/api/n9e/source-registry/sources` | 新建 | `{ source_id }` |
| `PUT` | `/api/n9e/source-registry/sources/:sid` | 编辑（不可改 source_id） | 204 |
| `POST` | `/api/n9e/source-registry/sources/:sid/status` | 启用/禁用，body `{ status }` | 204 |
| `GET` | `/api/n9e/source-registry/sources/:sid/keys` | Key 列表 | `SourceAPIKey[]` |
| `POST` | `/api/n9e/source-registry/sources/:sid/keys` | 创建 Key，**明文仅此一次返回** | `{ key_id, api_key }` |
| `POST` | `/api/n9e/source-registry/keys/:kid/revoke` | 撤销 Key | 204 |
| `GET` | `/api/n9e/source-registry/sources/:sid/policy` | 读取策略 | `SourcePolicy` |
| `PUT` | `/api/n9e/source-registry/sources/:sid/policy` | 更新策略 | 204 |
| `GET` | `/api/n9e/source-registry/audit` | 审计日志，支持 `source_id/key_id/action/result/p/limit` | `{ list, total }` |

**统一错误格式：**

```json
{ "err": "source_id_conflict" }   // 409 重复
{ "err": "source_not_found" }     // 404
{ "err": "key_already_revoked" }  // 422
```

### 4.2 Gateway 内部验签接口（不经前端）

```
POST /internal/source-registry/verify
Headers:
  X-API-Key: <raw_key>
  X-Source-ID: <source_id>

Response 200:
{
  "allowed": true,
  "source_id": "prod-nginx-01",
  "policy": { "qps_limit": 500, "ip_allowlist": [], ... }
}

Response 401:
{
  "allowed": false,
  "reason": "key_not_found | revoked | expired | ip_blocked | source_disabled | qps_exceeded"
}
```

> Gateway 需在内存中缓存 Key hash（TTL 30s），避免每次接入都查库。

---

## 五、UI 信息架构与操作流程

```
/source-registry
│
├── [Tab] 数据源
│   ├── 顶部：[+ 新增数据源]            分页信息
│   ├── 表格
│   │   ├── Source ID    名称     环境     采集器类型
│   │   ├── 目标数据源   负责团队  状态     创建人 / 时间
│   │   └── 操作：[密钥] [策略] [编辑] [启用 | 禁用]
│   │
│   ├── 密钥抽屉（KeysDrawer）
│   │   ├── Key 列表：Key ID / 状态 / 过期时间 / 最近使用时间 / 最近 IP / [撤销]
│   │   ├── [创建密钥] → 填写过期天数 → 返回一次性明文 + Copy 按钮 + 警告提示
│   │   └── Popconfirm 撤销确认
│   │
│   └── 策略抽屉（PolicyDrawer）
│       ├── 基础限流：QPS 限制 / 突发限制 / 基数限制
│       ├── 接入协议：允许的协议（多选）
│       ├── 访问控制：IP 白名单（多行文本）
│       └── Label 规则：必填标签 / 允许标签 / 屏蔽标签（每行 key=value）
│
└── [Tab] 审计日志
    ├── 筛选栏：Source ID（下拉）/ 动作（下拉）/ 结果（下拉）/ 时间范围
    ├── [查询] 按钮
    └── 表格：时间 / Source ID / Key ID / 操作人 / 动作 / 结果 / 原因 / 请求 IP
```

### 5.1 关键 UX 节点

**新建数据源（Onboarding）：**
1. 填写 source_id（格式校验：`^[a-z0-9][a-z0-9\-_]{1,62}[a-z0-9]$`）
2. 选择负责团队（`getTeamInfoList` 下拉，存 `owner_team_id`）
3. 选择目标数据源（`DatasourceSelectV3` 组件）
4. 选择环境 / 采集器类型
5. 保存 → 自动跳转密钥抽屉提示创建首个 Key

**Key Rotate（轮换）：**
1. 创建新 Key → 复制明文 → 更新采集器配置
2. 确认新 Key 工作正常（观察 `last_used_at` 更新）
3. 撤销旧 Key

**禁用数据源：**
- 禁用后，该源下所有 Key 验签返回 `source_disabled`
- 禁用状态下，密钥和策略仍可查看，不可创建新 Key

---

## 六、前端待修复清单（P1 缺口）

### G1 — 团队选择器接入

```tsx
// src/aido-extension/sourceregistry/index.tsx
// SourceFormModal 中加载团队列表
const [userGroups, setUserGroups] = useState<{ id: number; name: string }[]>([]);
useEffect(() => {
  getTeamInfoList().then((res) => setUserGroups(res.dat ?? []));
}, []);

// 替换 owner_team_name 的 Input 为：
<Form.Item name='owner_team_id' label={t('source.owner_team')}>
  <Select
    showSearch
    options={userGroups.map((g) => ({ value: g.id, label: g.name }))}
    filterOption={(input, opt) => (opt?.label as string)?.includes(input)}
  />
</Form.Item>
```

> 注意：`services.ts` 中 `UpsertSourceForm` 的 `owner_team_id` 字段已定义为 `number`，无需改服务层。

### G2 — Datasource 选择器接入

```tsx
import DatasourceSelectV3 from '@/components/DatasourceSelect/DatasourceSelectV3';
// 替换 InputNumber 为：
<Form.Item name='target_datasource_id' label={t('source.target_datasource')} rules={[{ required: true }]}>
  <DatasourceSelectV3 />
</Form.Item>
```

### G3 — source_id 格式校验

```tsx
<Form.Item
  name='source_id'
  label={t('source.source_id')}
  rules={[
    { required: true },
    {
      pattern: /^[a-z0-9][a-z0-9\-_]{1,62}[a-z0-9]$/,
      message: 'lowercase alphanumeric + dash/underscore, 3-64 chars',
    },
  ]}
>
```

### G4 — 列表分页

```tsx
const [page, setPage] = useState(1);
const PAGE_SIZE = 20;
// getSources({ p: page, limit: PAGE_SIZE }) 已支持参数
// Table 加：
pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, onChange: setPage }}
```

### G5 — 审计日志筛选栏

```tsx
// AuditQuery 已定义 source_id / action / result 参数
// 在 AuditTab 顶部加一行 Space：
<Space>
  <Select allowClear placeholder='Source ID' options={...} onChange={(v) => setFilter(f => ({...f, source_id: v}))} />
  <Select allowClear placeholder='Action' options={ACTION_OPTIONS} onChange={(v) => setFilter(f => ({...f, action: v}))} />
  <Select allowClear placeholder='Result' options={[
    { value: 'success', label: t('audit.result_success') },
    { value: 'deny', label: t('audit.result_deny') },
    { value: 'error', label: t('audit.result_error') },
  ]} onChange={(v) => setFilter(f => ({...f, result: v}))} />
  <Button type='primary' onClick={loadAudit}>{t('btn.search', '查询')}</Button>
</Space>
```

### G6 — DatasourceCateSelectV2 disabled 透传

```tsx
// src/components/DatasourceSelect/DatasourceCateSelectV2.tsx
className={classNames('n9e-db-cate-grid-item', {
  'n9e-db-cate-grid-item-selected': value === item.value,
  'n9e-db-cate-grid-item-disabled': disabled,   // 加这行
})}
onClick={() => {
  if (!disabled && item.value !== value) {       // 加 !disabled 守卫
    onChange && onChange(item.value, item);
  }
}}
```

---

## 七、上线验收清单

| # | 检查项 | 验证方式 |
|---|---|---|
| 1 | API Key 明文仅创建时返回一次，DB 只存 hash | 创建后刷新列表，调 GET keys 接口，无明文字段 |
| 2 | 已撤销 Key 验签返回 deny | `curl -H "X-API-Key: <revoked_key>"` → 401 + reason=revoked |
| 3 | 已过期 Key 验签返回 deny | 创建 1 天过期 Key，次日验签 → 401 + reason=expired |
| 4 | 禁用数据源后接入被拒绝 | 禁用后发数据 → 审计结果=deny，reason=source_disabled |
| 5 | 策略更新后 Gateway 30s 内生效 | 收窄 IP 白名单 → 30s 内未授权 IP 接入被拒 |
| 6 | `source_id` 重复创建返回 409，前端显示错误 | 同 source_id 提交两次 |
| 7 | 审计日志正常写入且可按 source_id 筛选 | 触发一次接入 → 审计 Tab 可查到记录 |
| 8 | typecheck 零错误 | `npx tsc --noEmit --skipLibCheck` exit 0 |

---

## 八、容量规划与压测标准

### 8.1 容量基线（100 数据源）

| 指标 | 目标值 | 说明 |
|---|---|---|
| 注册表记录 | ≤ 500 条 | 单表，无需分区 |
| 活跃 Key 数 | ≤ 1000 条 | 每源约 2 个活跃 Key |
| 审计写入峰值 | ≤ 5000 条/分钟 | deny 事件建议限速聚合写入，降低 10x |
| 审计表保留期 | 90 天 | 超期数据归档或 DELETE 清理 |
| 验签接口 QPS | 10,000 req/s | 需 Key hash 内存 LRU 缓存，TTL 30s |

### 8.2 压测命令

```bash
# 验签接口（Gateway 内部调用）
wrk -t4 -c100 -d30s \
  -H "X-API-Key: <valid_key>" \
  -H "X-Source-ID: prod-nginx-01" \
  http://gateway:8080/internal/source-registry/verify
# 目标：p99 < 5ms，error rate 0%

# Backoffice 列表接口
wrk -t2 -c20 -d10s \
  -H "Authorization: Bearer <token>" \
  http://backoffice/api/n9e/source-registry/sources
# 目标：p99 < 200ms
```

---

## 九、回滚策略

1. **前端**：移除 `src/components/menu/index.tsx` 中菜单项 + `src/routers/index.tsx` 中路由，零影响其他功能
2. **后端**：DDL 均为新增表，回滚只需下线相关 Handler，不触碰已有表
3. **Gateway**：验签中间件用 feature flag 控制，关闭后直接放行不验签

---

## 十、开发切片

| Phase | 前端工作 | 后端工作 | 估时 |
|---|---|---|---|
| **P1** | G1~G4 缺口修复（选择器+分页）+ typecheck | 4 张表 DDL + Backoffice 8 个 API | FE 2d / BE 3d |
| **P2** | G5 审计筛选 UI + G6 disabled 修复 | Gateway 验签中间件 + 策略读取 | FE 1d / BE 2d |
| **P3** | 联调 + 上线验收 + 压测 | 审计异步队列 + Key hash 缓存 | FE+BE 2d |

**当前代码已完成 P1 约 80%**，优先执行 G1~G4 缺口修复即可进入联调。
