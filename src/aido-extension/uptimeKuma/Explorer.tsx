import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, InputNumber, Space, Table, Tabs, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd/lib/form/Form';
import i18next from 'i18next';
import _ from 'lodash';
import moment from 'moment';

import TimeRangePicker, { IRawTimeRange, parseRange } from '@/components/TimeRangePicker';
import { getRealStep } from '@/components/PromQLInputNG';
import Timeseries from '@/pages/dashboard/Renderer/Renderer/Timeseries';
import { IPanel } from '@/pages/dashboard/types';
import { CommonStateContext } from '@/App';
import { DatasourceCateEnum } from '@/utils/constant';

interface IProps {
  headerExtra: HTMLDivElement | null;
  datasourceValue: number;
  form: FormInstance;
  panelIdx?: number;
}

interface MetricGroupDef {
  key: string;
  label: string;
  description: string;
  presetKey?: string;
  presetMetric?: string;
}

const METRIC_GROUP_MAP: Record<string, MetricGroupDef> = {
  monitor_status: {
    key: 'status',
    label: 'Monitor Status',
    description: 'Overall up/down/pending/maintenance state of each monitor.',
    presetKey: 'monitor_status',
    presetMetric: 'monitor_status',
  },
  monitor_cert_days_remaining: {
    key: 'certificate',
    label: 'SSL Certificate',
    description: 'Days until SSL certificate expiry. Negative = already expired.',
    presetKey: 'monitor_cert_days_remaining',
    presetMetric: 'monitor_cert_days_remaining',
  },
  monitor_cert_is_valid: {
    key: 'certificate',
    label: 'SSL Certificate',
    description: 'Whether the SSL certificate is currently valid (1 = valid, 0 = invalid).',
    presetKey: 'monitor_cert_is_valid',
    presetMetric: 'monitor_cert_is_valid',
  },
  monitor_uptime_ratio: {
    key: 'availability',
    label: 'Availability',
    description: 'Uptime ratio (0.0-1.0) calculated over a sliding window (window label: 1d / 30d / 365d).',
    presetKey: 'monitor_uptime_ratio_30d',
    presetMetric: 'monitor_uptime_ratio{window="30d"}',
  },
  monitor_response_time: {
    key: 'performance',
    label: 'Response Performance',
    description: 'Average HTTP response time in milliseconds at last check.',
    presetKey: 'monitor_response_time',
    presetMetric: 'monitor_response_time',
  },
  monitor_response_time_seconds: {
    key: 'performance',
    label: 'Response Performance',
    description: 'Average response time in seconds over a sliding window (window label: 1d / 30d / 365d).',
    presetKey: 'monitor_response_time_seconds_30d',
    presetMetric: 'monitor_response_time_seconds{window="30d"}',
  },
  up: {
    key: 'scrape',
    label: 'Scrape Health',
    description: 'Prometheus scrape target reachability (1 = reachable, 0 = unreachable).',
    presetKey: 'up',
    presetMetric: 'up',
  },
};

interface QuickPreset {
  key: string;
  labelKey: string;
  metric: string;
}

function buildPresetQuery(metric: string, datasourceValue?: number) {
  if (!datasourceValue) {
    return metric;
  }
  const braceIdx = metric.indexOf('{');
  if (braceIdx !== -1) {
    const name = metric.slice(0, braceIdx);
    const inner = metric.slice(braceIdx + 1, metric.lastIndexOf('}'));
    return `${name}{${inner},datasource_id="${datasourceValue}"}`;
  }
  return `${metric}{datasource_id="${datasourceValue}"}`;
}

type ResultMetric = Record<string, string>;

interface QueryVectorItem {
  metric: ResultMetric;
  value: [number, string];
}

interface QueryRangeItem {
  metric: ResultMetric;
  values: Array<[number, string]>;
}

interface PromQueryData<T> {
  resultType: string;
  result: T[];
}

interface MetricMetadata {
  metric: string;
  help?: string;
  type?: string;
}

function normalizeLabelValue(value?: string) {
  if (value === undefined || value === null) {
    return '-';
  }
  const normalized = String(value).trim();
  if (!normalized) {
    return '-';
  }
  return normalized;
}

function isNullLike(value?: string) {
  const normalized = (value || '').trim().toLowerCase();
  return !normalized || normalized === 'null' || normalized === '-';
}

const HIDDEN_LABEL_KEYS = new Set([
  '__name__',
  'cluster_name',
  'datasource_id',
  'ident',
  'source',
  'uptime_kuma',
  'monitor_hostname',
  'monitor_id',
]);

function formatLabelHeader(labelKey: string) {
  return labelKey
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferProtocolFromUrl(rawUrl?: string) {
  const normalized = (rawUrl || '').trim();
  if (!normalized || normalized === 'null') {
    return '-';
  }
  try {
    return new URL(normalized).protocol.replace(':', '') || '-';
  } catch {
    return '-';
  }
}

function getSeriesName(metric: ResultMetric) {
  const metricName = normalizeLabelValue(metric?.__name__) || 'metric';
  const monitorName = normalizeLabelValue(metric?.monitor_name);
  const category = normalizeLabelValue(metric?.category);
  const window = normalizeLabelValue(metric?.window);

  if (monitorName !== '-') {
    let prefix = `${monitorName} [${metricName}`;
    if (window !== '-') {
      prefix += `/${window}`;
    }
    prefix += ']';
    if (category !== '-') {
      prefix += ` (${category})`;
    }
    return prefix;
  }

  const labels = _.keys(metric)
    .filter((key) => key !== '__name__')
    .map((key) => `${key}="${normalizeLabelValue(metric[key])}"`);
  return `${metricName}{${labels.join(',')}}`;
}

function buildUrl(path: string, datasourceValue: number, params: Record<string, string | number>) {
  const search = new URLSearchParams();
  _.forEach(params, (val, key) => {
    search.set(key, String(val));
  });
  return `/api/n9e/proxy/${datasourceValue}/api/v1/${path}?${search.toString()}`;
}

function buildFallbackUrl(path: string, datasourceValue: number, params: Record<string, string | number>) {
  const prefix = (import.meta.env.VITE_PREFIX || '').replace(/\/$/, '');
  if (!prefix) {
    return '';
  }
  const search = new URLSearchParams();
  _.forEach(params, (val, key) => {
    search.set(key, String(val));
  });
  return `${prefix}/api/n9e/proxy/${datasourceValue}/api/v1/${path}?${search.toString()}`;
}

function buildRawProxyUrl(path: string, datasourceValue: number) {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `/api/n9e/proxy/${datasourceValue}/${normalized}`;
}

function buildRawProxyFallbackUrl(path: string, datasourceValue: number) {
  const prefix = (import.meta.env.VITE_PREFIX || '').replace(/\/$/, '');
  if (!prefix) {
    return '';
  }
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${prefix}/api/n9e/proxy/${datasourceValue}/${normalized}`;
}

async function fetchProxyText(path: string, datasourceValue: number): Promise<string> {
  const primaryUrl = buildRawProxyUrl(path, datasourceValue);
  const fallbackUrl = buildRawProxyFallbackUrl(path, datasourceValue);

  const tryFetch = async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
      },
    });
    const raw = await response.text();
    if (!response.ok) {
      const snippet = raw.slice(0, 160).replace(/\s+/g, ' ');
      throw new Error(`HTTP ${response.status}: ${snippet}`);
    }
    return raw;
  };

  try {
    return await tryFetch(primaryUrl);
  } catch (firstErr) {
    if (!fallbackUrl) {
      throw firstErr;
    }
    return tryFetch(fallbackUrl);
  }
}

function parsePrometheusMetadata(text: string): Record<string, MetricMetadata> {
  const map: Record<string, MetricMetadata> = {};
  const lines = text.split(/\r?\n/);

  lines.forEach((line) => {
    const helpMatch = line.match(/^\s*#\s*HELP\s+([a-zA-Z_:][a-zA-Z0-9_:]*)\s+(.*)\s*$/);
    if (helpMatch) {
      const metric = helpMatch[1];
      const help = helpMatch[2]?.trim();
      map[metric] = {
        ...(map[metric] || { metric }),
        metric,
        help,
      };
      return;
    }

    const typeMatch = line.match(/^\s*#\s*TYPE\s+([a-zA-Z_:][a-zA-Z0-9_:]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/);
    if (typeMatch) {
      const metric = typeMatch[1];
      const type = typeMatch[2]?.trim();
      map[metric] = {
        ...(map[metric] || { metric }),
        metric,
        type,
      };
    }
  });

  return map;
}

function getMetricGroupDef(metricName: string): MetricGroupDef {
  const def = METRIC_GROUP_MAP[metricName];
  if (def) {
    return def;
  }
  const parts = metricName.split('_').filter(Boolean);
  const fallbackKey = parts.slice(0, 2).join('_') || 'other';
  return { key: fallbackKey, label: fallbackKey, description: '-' };
}

async function fetchPromJson<T>(path: string, datasourceValue: number, params: Record<string, string | number>): Promise<PromQueryData<T>> {
  const primaryUrl = buildUrl(path, datasourceValue, params);
  const fallbackUrl = buildFallbackUrl(path, datasourceValue, params);

  const tryFetch = async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
      },
    });

    const raw = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const snippet = raw.slice(0, 120).replace(/\s+/g, ' ');
      return {
        ok: false as const,
        message: `Non-JSON response from proxy (${response.status}) ${url}. ${snippet}`,
      };
    }

    return {
      ok: true as const,
      response,
      parsed,
    };
  };

  let result = await tryFetch(primaryUrl);
  if (!result.ok && fallbackUrl) {
    result = await tryFetch(fallbackUrl);
  }

  if (!result.ok) {
    throw new Error(result.message);
  }

  const { response, parsed } = result;

  const parsedObj = parsed as { status?: string; data?: PromQueryData<T>; error?: { message?: string } | string; message?: string };

  if (!response.ok) {
    const errorObj = parsedObj.error;
    const errorMessage = typeof errorObj === 'string' ? errorObj : errorObj?.message;
    throw new Error(errorMessage || parsedObj.message || `HTTP ${response.status}`);
  }

  if (parsedObj.status !== 'success') {
    const errorObj = parsedObj.error;
    const errorMessage = typeof errorObj === 'string' ? errorObj : errorObj?.message;
    throw new Error(errorMessage || parsedObj.message || 'Query failed');
  }

  return parsedObj.data as PromQueryData<T>;
}

export default function UptimeKumaExplorer(props: IProps) {
  const { datasourceValue } = props;
  const { datasourceList } = useContext(CommonStateContext);
  const tU = useCallback((key: string, options?: Record<string, unknown>) => i18next.t(`datasource:uptime_kuma.${key}`, options), []);
  const [promQL, setPromQL] = useState(() => buildPresetQuery('monitor_status', datasourceValue));
  const [range, setRange] = useState<IRawTimeRange>({ start: 'now-1h', end: 'now' });
  const [step, setStep] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [tableRows, setTableRows] = useState<QueryVectorItem[]>([]);
  const [seriesRows, setSeriesRows] = useState<QueryRangeItem[]>([]);
  const [activeTab, setActiveTab] = useState<'graph' | 'table' | 'semantics'>('graph');
  const [lastSuccessAt, setLastSuccessAt] = useState<number>();
  const [effectiveDatasourceValue, setEffectiveDatasourceValue] = useState<number>();
  const [metricMetadataMap, setMetricMetadataMap] = useState<Record<string, MetricMetadata>>({});
  const [metricMetadataError, setMetricMetadataError] = useState<string>('');

  const vmDatasourceValue = useMemo(() => {
    const promDS = _.find(datasourceList, (item) => item.plugin_type === DatasourceCateEnum.prometheus && item.id !== datasourceValue);
    return promDS?.id;
  }, [datasourceList, datasourceValue]);

  const resolvedPresetQueries = useMemo(() => {
    const presets: QuickPreset[] = _.chain(METRIC_GROUP_MAP)
      .values()
      .filter((item) => Boolean(item.presetKey && item.presetMetric))
      .uniqBy('presetMetric')
      .map((item) => ({
        key: item.presetKey as string,
        labelKey: item.presetKey as string,
        metric: item.presetMetric as string,
      }))
      .value();

    return presets.map((item) => ({
      ...item,
      label: tU(`presets.${item.labelKey}`),
      value: buildPresetQuery(item.metric, datasourceValue),
    }));
  }, [datasourceValue, tU]);

  const selectedPresetKey = useMemo(() => {
    const preset = resolvedPresetQueries.find((item) => item.value === promQL.trim());
    return preset?.key;
  }, [promQL, resolvedPresetQueries]);

  useEffect(() => {
    if (!datasourceValue) {
      return;
    }

    setPromQL((prev) => {
      const trimmed = (prev || '').trim();
      if (!trimmed) {
        return buildPresetQuery('monitor_status', datasourceValue);
      }

      // Check if current promQL matches any resolved preset (with old datasource_id), and rebuild it
      const matchedPreset = resolvedPresetQueries.find((item) => {
        const oldValue = item.value;
        const rebased = oldValue.replace(/datasource_id="\d+"/, `datasource_id="${datasourceValue}"`);
        return rebased === trimmed || oldValue === trimmed;
      });
      if (matchedPreset) {
        return buildPresetQuery(matchedPreset.metric, datasourceValue);
      }

      const legacyPresetMatch = trimmed.match(/^(up|monitor_status|monitor_response_time)\{job=~"\.\*uptime\.\*\|\.\*kuma\.\*"\}$/);
      if (legacyPresetMatch) {
        const metric = legacyPresetMatch[1] === 'monitor_response_time' ? 'monitor_uptime_ratio' : legacyPresetMatch[1];
        return buildPresetQuery(metric, datasourceValue);
      }

      return prev;
    });
  }, [datasourceValue, resolvedPresetQueries]);

  const seriesData = useMemo(() => {
    return seriesRows.map((item, idx) => {
      return {
        id: `uptime-series-${idx}`,
        name: getSeriesName(item.metric),
        metric: item.metric,
        data: item.values,
      };
    });
  }, [seriesRows]);

  const lineGraphProps = useMemo<IPanel>(() => {
    return {
      version: '3.0.0',
      id: 'uptime-kuma-template-panel',
      name: 'Uptime Kuma Template',
      description: '',
      layout: {
        h: 8,
        w: 24,
        x: 0,
        y: 0,
        i: 'uptime-kuma-template-panel',
      },
      datasourceCate: 'aido-uptime-kuma',
      datasourceValue,
      type: 'timeseries',
      custom: {
        drawStyle: 'lines',
        fillOpacity: 0,
        stack: 'off',
      },
      options: {
        legend: {
          displayMode: 'table' as const,
          columns: ['last'],
          calcs: ['last'],
          placement: 'bottom',
          detailName: '',
          detailUrl: '',
          behaviour: 'showItem',
          selectMode: 'multiple',
        },
        tooltip: {
          mode: 'all' as const,
          sort: 'desc' as const,
        },
        standardOptions: {
          unit: 'short',
        },
      },
      targets: [
        {
          refId: 'A',
          __mode__: '__expr__',
          expr: promQL,
          legendFormat: '',
        },
      ],
      overrides: [],
    };
  }, [datasourceValue, promQL]);

  const queryData = useCallback(async () => {
    if (!datasourceValue || !promQL.trim()) {
      return;
    }

    const parsed = parseRange(range);
    const start = moment(parsed.start).unix();
    const end = moment(parsed.end).unix();
    const calculatedStep = getRealStep({
      minStep: step,
      fromUnix: start,
      toUnix: end,
      maxDataPoints: 500,
    });

    setLoading(true);
    setError('');

    const runQuery = async (queryDatasourceValue: number) => {
      const [instantRes, rangeRes] = await Promise.all([
        fetchPromJson<QueryVectorItem>('query', queryDatasourceValue, {
          query: promQL,
          time: end,
        }),
        fetchPromJson<QueryRangeItem>('query_range', queryDatasourceValue, {
          query: promQL,
          start,
          end,
          step: calculatedStep,
        }),
      ]);
      return { instantRes, rangeRes };
    };

    const loadMetricMetadata = async () => {
      try {
        const text = await fetchProxyText('/metrics', datasourceValue);
        setMetricMetadataMap(parsePrometheusMetadata(text));
        setMetricMetadataError('');
      } catch (metadataErr) {
        setMetricMetadataError(metadataErr instanceof Error ? metadataErr.message : 'Failed to load metric metadata');
      }
    };

    try {
      let result;
      try {
        result = await runQuery(datasourceValue);
        setEffectiveDatasourceValue(datasourceValue);
      } catch (firstError) {
        if (!vmDatasourceValue) {
          throw firstError;
        }
        result = await runQuery(vmDatasourceValue);
        setEffectiveDatasourceValue(vmDatasourceValue);
      }

      const { instantRes, rangeRes } = result;
      setTableRows(Array.isArray(instantRes.result) ? instantRes.result : []);
      setSeriesRows(Array.isArray(rangeRes.result) ? rangeRes.result : []);
      setLastSuccessAt(Date.now());
      loadMetricMetadata();
    } catch (e: unknown) {
      setTableRows([]);
      setSeriesRows([]);
      setError(e instanceof Error ? e.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  }, [datasourceValue, promQL, range, step, vmDatasourceValue]);

  const querySourceLabel = useMemo(() => {
    if (!effectiveDatasourceValue) {
      return tU('query_source_values.unknown');
    }
    if (effectiveDatasourceValue === datasourceValue) {
      return tU('query_source_values.datasource', { id: effectiveDatasourceValue });
    }
    return tU('query_source_values.vm_fallback', { id: effectiveDatasourceValue });
  }, [datasourceValue, effectiveDatasourceValue, tU]);

  useEffect(() => {
    if (datasourceValue) {
      queryData();
    }
  }, [datasourceValue, queryData]);

  const visibleLabelKeys = useMemo(() => {
    const allKeys = _.chain(tableRows)
      .flatMap((row) => _.keys(row.metric || {}))
      .uniq()
      .filter((key) => !HIDDEN_LABEL_KEYS.has(key))
      .sortBy((key) => {
        const order = ['monitor_name', 'monitor_type', 'monitor_url', 'category', 'window', 'monitor_port'];
        const idx = order.indexOf(key);
        return idx === -1 ? 1000 : idx;
      })
      .value();
    return allKeys;
  }, [tableRows]);

  const tableColumns = useMemo<ColumnsType<QueryVectorItem>>(() => {
    const dynamicLabelColumns: ColumnsType<QueryVectorItem> = visibleLabelKeys.map((labelKey) => ({
      title: tU(`labels.${labelKey}`, { defaultValue: formatLabelHeader(labelKey) }),
      dataIndex: 'metric',
      key: `label_${labelKey}`,
      width: labelKey.includes('url') ? 320 : 180,
      ellipsis: true,
      render: (metric: ResultMetric) => {
        let value = normalizeLabelValue(metric[labelKey]);
        if (labelKey === 'monitor_port' && isNullLike(value)) {
          value = inferProtocolFromUrl(metric.monitor_url);
        }
        return <span title={value}>{value}</span>;
      },
    }));

    return [
      {
        title: tU('columns.metric_name'),
        dataIndex: 'metric',
        key: 'metric_name',
        width: 220,
        render: (metric: ResultMetric) => normalizeLabelValue(metric.__name__),
      },
      ...dynamicLabelColumns,
      {
        title: tU('columns.value'),
        dataIndex: 'value',
        key: 'value',
        width: 160,
        render: (value: [number, string]) => value?.[1] ?? '-',
      },
      {
        title: tU('columns.timestamp'),
        dataIndex: 'value',
        key: 'timestamp',
        width: 220,
        render: (value: [number, string]) => (value?.[0] ? moment.unix(value[0]).format('YYYY-MM-DD HH:mm:ss') : '-'),
      },
    ];
  }, [tU, visibleLabelKeys]);

  const metadataRows = useMemo(() => {
    const metricNames = _.chain([...tableRows, ...seriesRows])
      .map((row) => normalizeLabelValue(row.metric?.__name__))
      .filter((name) => Boolean(name) && name !== '-')
      .uniq()
      .value();

    return _.sortBy(
      metricNames.map((metricName) => {
        const meta = metricMetadataMap[metricName];
        const groupDef = getMetricGroupDef(metricName);
        const groupLabel = tU(`groups.${groupDef.key}`, { defaultValue: groupDef.label });
        const fallbackDesc = tU(`group_desc.${groupDef.key}`, { defaultValue: groupDef.description });
        const localizedHelp = tU(`help.${metricName}`, { defaultValue: meta?.help || fallbackDesc });
        return {
          key: metricName,
          groupKey: groupDef.key,
          groupLabel,
          groupDesc: fallbackDesc,
          metric: metricName,
          metricType: meta?.type || '-',
          help: localizedHelp,
        };
      }),
      ['groupKey', 'metric'],
    );
  }, [metricMetadataMap, seriesRows, tU, tableRows]);

  type MetadataRow = (typeof metadataRows)[number];

  const metadataColumns = useMemo<ColumnsType<MetadataRow>>(() => {
    return [
      {
        title: tU('columns.group'),
        dataIndex: 'groupLabel',
        key: 'groupLabel',
        width: 200,
        sorter: (a, b) => a.groupKey.localeCompare(b.groupKey),
        onCell: (row, rowIndex) => {
          if (!rowIndex) return {};
          const prev = metadataRows[rowIndex - 1];
          if (prev?.groupKey === row.groupKey) {
            return { rowSpan: 0 };
          }
          const span = metadataRows.filter((r) => r.groupKey === row.groupKey).length;
          return { rowSpan: span };
        },
      },
      {
        title: tU('columns.metric'),
        dataIndex: 'metric',
        key: 'metric',
        width: 260,
      },
      {
        title: tU('columns.metric_type'),
        dataIndex: 'metricType',
        key: 'metricType',
        width: 100,
      },
      {
        title: tU('columns.help'),
        dataIndex: 'help',
        key: 'help',
        ellipsis: true,
      },
    ];
  }, [metadataRows, tU]);

  return (
    <Card
      title={tU('title')}
      extra={
        lastSuccessAt ? <Typography.Text type='secondary'>{tU('last_success', { time: moment(lastSuccessAt).format('YYYY-MM-DD HH:mm:ss') })}</Typography.Text> : null
      }
      styles={{ body: { paddingTop: 12, paddingBottom: 12 } }}
    >
      <Space direction='vertical' style={{ width: '100%' }} size={12}>
        <Card size='small' styles={{ body: { padding: 12, background: 'var(--fill-1)', borderRadius: 8 } }}>
          <Space direction='vertical' style={{ width: '100%' }} size={10}>
            <Space align='center' style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <Typography.Text strong>{tU('quick_presets')}</Typography.Text>
              <Typography.Text type='secondary'>{tU('datasource', { id: datasourceValue || '-' })}</Typography.Text>
            </Space>

            <Space wrap>
              {resolvedPresetQueries.map((preset) => {
                const isActive = selectedPresetKey === preset.key;
                return (
                  <Button key={preset.key} size='small' type={isActive ? 'primary' : 'default'} onClick={() => setPromQL(preset.value)}>
                    {preset.label}
                  </Button>
                );
              })}
            </Space>

            <Input.TextArea value={promQL} onChange={(e) => setPromQL(e.target.value)} autoSize={{ minRows: 2, maxRows: 6 }} />

            <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <Space wrap>
                <TimeRangePicker value={range} onChange={(nextRange) => setRange(nextRange)} dateFormat='YYYY-MM-DD HH:mm:ss' />
                <InputNumber min={1} value={step} onChange={(val) => setStep(Number(val || 30))} addonBefore={tU('step_seconds')} />
              </Space>
              <Button type='primary' loading={loading} onClick={queryData}>
                {tU('query')}
              </Button>
            </Space>

            <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <Typography.Text type='secondary'>{tU('query_source', { source: querySourceLabel })}</Typography.Text>
              <Typography.Text type='secondary'>{tU('series_rows', { series: seriesData.length, rows: tableRows.length })}</Typography.Text>
            </Space>
          </Space>
        </Card>

        {error ? <Typography.Text type='danger'>{error}</Typography.Text> : null}
        {!error && !loading && seriesData.length === 0 && tableRows.length === 0 ? <Typography.Text type='secondary'>{tU('no_data')}</Typography.Text> : null}

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'graph' | 'table' | 'semantics')}
          items={[
            {
              key: 'graph',
              label: tU('tabs.graph', { count: seriesData.length }),
              children: <Timeseries inDashboard={false} chartHeight='460px' tableHeight='200px' values={lineGraphProps} series={seriesData} time={range} />,
            },
            {
              key: 'table',
              label: tU('tabs.table', { count: tableRows.length }),
              children: (
                <Table<QueryVectorItem>
                  rowKey={(row, idx) => `${getSeriesName(row.metric)}-${idx}`}
                  size='small'
                  loading={loading}
                  columns={tableColumns}
                  dataSource={tableRows}
                  pagination={{ pageSize: 20, showSizeChanger: true }}
                  scroll={{ x: 'max-content', y: 500 }}
                />
              ),
            },
            {
              key: 'semantics',
              label: tU('tabs.semantics', { count: metadataRows.length }),
              children: (
                <Card size='small' title={tU('metric_semantics', { metrics: metadataRows.length, groups: _.uniqBy(metadataRows, 'groupKey').length })}>
                  <Space direction='vertical' style={{ width: '100%' }} size={8}>
                    <Typography.Text type='secondary'>{tU('metric_semantics_desc')}</Typography.Text>
                    {metricMetadataError ? <Typography.Text type='warning'>{tU('help_type_fetch_failed', { message: metricMetadataError })}</Typography.Text> : null}
                    <Table<MetadataRow> size='small' columns={metadataColumns} dataSource={metadataRows} pagination={false} scroll={{ x: 'max-content' }} bordered />
                  </Space>
                </Card>
              ),
            },
          ]}
        />
      </Space>
    </Card>
  );
}