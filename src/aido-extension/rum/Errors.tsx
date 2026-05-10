import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Table, Card, Input, Select, Space, Row, Col, Tag, Typography, message, Button } from 'antd';
import { SearchOutlined, ReloadOutlined, WarningOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/pageLayout';
import EmptyState from '@/components/EmptyState';
import SkeletonWrap from '@/components/SkeletonWrap';
import './locale';

const { Text } = Typography;

/** RUM 错误记录 */
interface RUMError {
  id: string;
  message: string;
  type: 'js' | 'resource' | 'promise' | 'http' | 'custom';
  count: number;
  affectedUsers: number;
  firstSeen: number;
  lastSeen: number;
  status: 'unresolved' | 'resolved' | 'ignored';
  url: string;
}

/** 模拟数据 — TODO: 替换为真实 API 调用 */
const mockErrors: RUMError[] = [
  {
    id: 'err-001',
    message: 'TypeError: Cannot read property "data" of undefined',
    type: 'js',
    count: 1283,
    affectedUsers: 342,
    firstSeen: Date.now() - 86400000 * 3,
    lastSeen: Date.now() - 600000,
    status: 'unresolved',
    url: '/dashboard/overview',
  },
  {
    id: 'err-002',
    message: 'Failed to load resource: the server responded with 500',
    type: 'http',
    count: 567,
    affectedUsers: 189,
    firstSeen: Date.now() - 86400000 * 7,
    lastSeen: Date.now() - 3600000,
    status: 'unresolved',
    url: '/api/n9e/alert-rules',
  },
  {
    id: 'err-003',
    message: 'Uncaught (in promise) TypeError: network error',
    type: 'promise',
    count: 89,
    affectedUsers: 45,
    firstSeen: Date.now() - 86400000 * 14,
    lastSeen: Date.now() - 7200000,
    status: 'resolved',
    url: '/metric/explorer',
  },
  {
    id: 'err-004',
    message: '404 Not Found: /assets/chunk-abc123.js',
    type: 'resource',
    count: 234,
    affectedUsers: 78,
    firstSeen: Date.now() - 86400000 * 30,
    lastSeen: Date.now() - 86400000,
    status: 'ignored',
    url: '/login',
  },
  {
    id: 'err-005',
    message: 'TypeError: e.match is not a function',
    type: 'js',
    count: 412,
    affectedUsers: 156,
    firstSeen: Date.now() - 86400000 * 5,
    lastSeen: Date.now() - 1800000,
    status: 'unresolved',
    url: '/dashboards/123',
  },
];

const ERROR_TYPE_OPTIONS = [
  { label: 'JS Error', value: 'js' },
  { label: 'Resource Error', value: 'resource' },
  { label: 'Promise Rejection', value: 'promise' },
  { label: 'HTTP Error', value: 'http' },
  { label: 'Custom', value: 'custom' },
];

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  unresolved: { color: 'red', label: 'Unresolved' },
  resolved: { color: 'green', label: 'Resolved' },
  ignored: { color: 'default', label: 'Ignored' },
};

const TYPE_COLOR_MAP: Record<string, string> = {
  js: '#ff4d4f',
  resource: '#faad14',
  promise: '#722ed1',
  http: '#1890ff',
  custom: '#52c41a',
};

export default function RUMErrors() {
  const { t } = useTranslation('rum');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RUMError[]>([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  /** 模拟加载 — TODO: 替换为 getRUMErrors API */
  const fetchErrors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 模拟 API 延迟
      await new Promise((resolve) => setTimeout(resolve, 600));
      // 模拟筛选
      let filtered = [...mockErrors];
      if (searchText) {
        filtered = filtered.filter((e) => e.message.toLowerCase().includes(searchText.toLowerCase()));
      }
      if (typeFilter) {
        filtered = filtered.filter((e) => e.type === typeFilter);
      }
      if (statusFilter) {
        filtered = filtered.filter((e) => e.status === statusFilter);
      }
      setData(filtered);
      setPagination((prev) => ({ ...prev, total: filtered.length }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load errors');
      message.error(t('load_error_failed'));
    } finally {
      setLoading(false);
    }
  }, [searchText, typeFilter, statusFilter]);

  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  const columns: ColumnsType<RUMError> = useMemo(
    () => [
      {
        title: t('error_message'),
        dataIndex: 'message',
        key: 'message',
        ellipsis: true,
        render: (msg: string, record: RUMError) => (
          <Space>
            <WarningOutlined style={{ color: TYPE_COLOR_MAP[record.type] || '#999' }} />
            <Text ellipsis={{ tooltip: msg }} style={{ maxWidth: 400 }}>
              {msg}
            </Text>
          </Space>
        ),
      },
      {
        title: t('error_type'),
        dataIndex: 'type',
        key: 'type',
        width: 120,
        render: (type: string) => (
          <Tag color={TYPE_COLOR_MAP[type] || 'default'}>{type.toUpperCase()}</Tag>
        ),
      },
      {
        title: t('error_count'),
        dataIndex: 'count',
        key: 'count',
        width: 100,
        sorter: (a, b) => a.count - b.count,
        render: (val: number) => val.toLocaleString(),
      },
      {
        title: t('affected_users'),
        dataIndex: 'affectedUsers',
        key: 'affectedUsers',
        width: 120,
        sorter: (a, b) => a.affectedUsers - b.affectedUsers,
        render: (val: number) => val.toLocaleString(),
      },
      {
        title: t('first_seen'),
        dataIndex: 'firstSeen',
        key: 'firstSeen',
        width: 180,
        render: (ts: number) => dayjs(ts).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: t('last_seen'),
        dataIndex: 'lastSeen',
        key: 'lastSeen',
        width: 180,
        sorter: (a, b) => a.lastSeen - b.lastSeen,
        defaultSortOrder: 'descend',
        render: (ts: number) => (
          <Text type="secondary">{dayjs(ts).format('YYYY-MM-DD HH:mm')}</Text>
        ),
      },
      {
        title: t('error_status'),
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (status: string) => {
          const cfg = STATUS_MAP[status] || { color: 'default', label: status };
          return <Tag color={cfg.color}>{t(cfg.label.toLowerCase())}</Tag>;
        },
      },
    ],
    [t],
  );

  return (
    <PageLayout title={t('rum_errors')}>
      <div style={{ padding: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/rum')}>
            {t('back_to_overview')}
          </Button>
        </Space>

        <Card>
          {/* 筛选栏 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Input
                prefix={<SearchOutlined />}
                placeholder={t('search_error_placeholder')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder={t('error_type')}
                value={typeFilter}
                onChange={setTypeFilter}
                allowClear
                style={{ width: '100%' }}
                options={ERROR_TYPE_OPTIONS}
              />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder={t('error_status')}
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: t('unresolved'), value: 'unresolved' },
                  { label: t('resolved'), value: 'resolved' },
                  { label: t('ignored'), value: 'ignored' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Button icon={<ReloadOutlined />} onClick={fetchErrors}>
                {t('common:btn.search')}
              </Button>
            </Col>
          </Row>

          {/* 加载中 */}
          {loading && (
            <>
              <SkeletonWrap type="table" rows={5} />
            </>
          )}

          {/* 错误状态 */}
          {!loading && error && (
            <EmptyState type="error" description={error} onRetry={fetchErrors} />
          )}

          {/* 空数据 */}
          {!loading && !error && data.length === 0 && (
            <EmptyState type="no-data" description={t('no_errors_found')} />
          )}

          {/* 数据表格 */}
          {!loading && !error && data.length > 0 && (
            <Table<RUMError>
              rowKey="id"
              columns={columns}
              dataSource={data}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => `${t('common:table.total')} ${total}`,
              }}
              onChange={(pag) => setPagination((prev) => ({ ...prev, current: pag.current || 1 }))}
              scroll={{ x: 960 }}
            />
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
