const zh_CN = {
  es: {
    ref: '名称',
    index: '索引',
    index_tip: `
      支持多种配置方式
      <1 />
      1. 指定单个索引 gb 在 gb 索引中搜索所有的文档
      <1 />
      2. 指定多个索引 gb,us 在 gb 和 us 索引中搜索所有的文档
      <1 />
      3. 指定索引前缀 g*,u* 在任何以 g 或者 u 开头的索引中搜索所有的文档
      <1 />
      `,
    index_msg: '索引不能为空',
    indexPattern: '索引模式',
    indexPatterns: '索引模式',
    indexPattern_msg: '索引模式不能为空',
    indexPatterns_manage: '管理索引模式',
    filter: '过滤条件',
    syntax: '语法',
    time_label: '时间颗粒度',
    date_field: '日期字段',
    date_field_msg: '日期字段不能为空',
    interval: '时间间隔',
    value: '数值提取',
    func: '函数',
    funcField: '字段名',
    terms: {
      label: '根据指定 field 分组',
      more: '高级设置',
      size: '匹配个数',
      min_doc_count: '文档最小值',
    },
    raw: {
      limit: '日志条数',
      date_format: '日期格式',
      date_format_tip: '使用 Moment.js 格式模式，比如 YYYY-MM-DD HH:mm:ss.SSS',
    },
    alert: {
      query: {
        title: '查询统计',
        preview: '数据预览',
      },
      trigger: {
        title: '告警条件',
        builder: '简单模式',
        code: '表达式模式',
        label: '关联 Label',
      },
      prom_eval_interval_tip: '每隔 {{num}} 秒，去查询后端存储',
      prom_for_duration_tip:
        '通常持续时长大于执行频率，在持续时长内按照执行频率多次执行查询，每次都触发才生成告警；如果持续时长置为0，表示只要有一次查询的数据满足告警条件，就生成告警',
      advancedSettings: '高级设置',
      delay: '延迟执行',
    },
    event: {
      groupBy: `根据 {{field}} 分组，匹配个数 {{size}}, 文档最小值 {{min_doc_count}}`,
      logs: {
        title: '日志详情',
        size: '结果数',
        fields: '筛选字段',
        jsonParseError: '解析失败',
      },
    },
    syntaxOptions: '语法选项',
    queryFailed: '查询失败，请稍后重试',
    offset_tip: '用于查询指定时间段之前的数据，类似 PromQL 中的 offset，单位为秒',
  },
  datasource: {
    max_query_rows: '单次请求允许检索的最大行数',
    max_idle_conns: '最大空闲连接数',
    max_open_conns: '最大打开连接数',
    conn_max_lifetime: '连接最大生存时间（单位: 秒）',
    timeout: '超时时间（单位: 秒）',
    timeout_ms: '超时时间（单位: 毫秒）',
  },
  query: {
    title: '查询统计',
    execute: '查询',
    query: '查询条件',
    query_required: '查询条件不能为空',
    query_placeholder: '输入 SQL 进行查询，按 Shift+Enter 换行',
    query_placeholder2: '按 Shift+Enter 换行',
    advancedSettings: {
      title: '辅助配置',
      tags_placeholder: '回车输入多个',
      valueKey: '值字段',
      valueKey_tip: 'SQL 查询结果通常包含多个列，您可以指定哪些列的值作为曲线展示在图表上',
      valueKey_required: '值字段不能为空',
      labelKey: '标签字段',
      labelKey_tip: 'SQL 查询结果通常包含多个列，您可以指定哪些列作为曲线的标签元信息',
    },
  },
  uptime_kuma: {
    title: 'Uptime Kuma 指标',
    last_success: '最近成功时间: {{time}}',
    quick_presets: '快速预设',
    datasource: '数据源: {{id}}',
    query: '查询',
    step_seconds: '步长(秒)',
    query_source: '查询来源: {{source}}',
    series_rows: '序列: {{series}} | 行数: {{rows}}',
    no_data: '当前查询和时间范围没有数据。',
    metric_semantics: '指标语义 ({{metrics}} 个指标 / {{groups}} 个分组)',
    metric_semantics_desc: '固定业务域：状态、SSL证书、可用性、响应性能、采集健康。说明优先使用 exporter HELP 元数据。',
    help_type_fetch_failed: 'HELP/TYPE 拉取失败: {{message}}',
    tabs: {
      graph: '图表 ({{count}})',
      table: '表格 ({{count}})',
      semantics: '语义 ({{count}})',
    },
    columns: {
      metric_name: '指标名',
      value: '值',
      timestamp: '时间戳',
      group: '分组',
      metric: '指标',
      metric_type: '类型',
      help: '说明 (HELP)',
    },
    query_source_values: {
      unknown: '-',
      datasource: '数据源 {{id}}',
      vm_fallback: 'Prometheus VM 回退 ({{id}})',
    },
    presets: {
      monitor_status: '监控状态',
      monitor_uptime_ratio_30d: '可用率 (30天)',
      monitor_cert_days_remaining: '证书剩余天数',
      monitor_cert_is_valid: '证书是否有效',
      monitor_response_time: '响应时间 (毫秒)',
      monitor_response_time_seconds_30d: '响应时间 (秒, 30天)',
      up: '采集连通性',
    },
    groups: {
      status: '监控状态',
      certificate: 'SSL 证书',
      availability: '可用性',
      performance: '响应性能',
      scrape: '采集健康',
    },
    group_desc: {
      status: '每个监控对象的上/下线、待定、维护状态。',
      certificate: 'SSL 证书有效性与到期风险信号。',
      availability: '滑窗下的可用率信号。',
      performance: '毫秒或秒级滑窗响应时延信号。',
      scrape: 'Prometheus 采集目标连通性。',
    },
    help: {
      monitor_status: '监控状态 (1=在线, 0=离线, 2=待定, 3=维护)',
      monitor_cert_days_remaining: '证书到期前剩余天数',
      monitor_cert_is_valid: '证书当前是否仍有效 (1=是, 0=否)',
      monitor_uptime_ratio: '基于 window 标签滑动窗口计算的可用率 (0.0 - 1.0)',
      monitor_response_time: '监控响应时间 (毫秒)',
      monitor_response_time_seconds: '基于 window 标签滑动窗口计算的平均响应时间 (秒)',
      up: 'Prometheus 对目标的采集状态。',
    },
  },
};
export default zh_CN;
