import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Tag, Typography, Spin, Alert, Space, Grid } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, QuestionCircleFilled, MinusCircleFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import _ from 'lodash';
import EmptyState from '@/components/EmptyState';
import SkeletonWrap from '@/components/SkeletonWrap';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface MonitorStatus {
  monitor_name: string;
  monitor_type: string;
  monitor_url: string;
  status: number;
  response_time: number;
  uptime_ratio_30d: number;
  cert_days_remaining: number;
}

function statusIcon(status: number) {
  if (status === 1) return <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />;
  if (status === 0) return <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 18 }} />;
  if (status === 2) return <MinusCircleFilled style={{ color: '#faad14', fontSize: 18 }} />;
  return <QuestionCircleFilled style={{ color: '#d9d9d9', fontSize: 18 }} />;
}

function statusLabel(status: number) {
  if (status === 1) return <Tag color="success">UP</Tag>;
  if (status === 0) return <Tag color="error">DOWN</Tag>;
  if (status === 2) return <Tag color="warning">MAINTENANCE</Tag>;
  return <Tag>UNKNOWN</Tag>;
}

function uptimeColor(ratio: number) {
  if (ratio >= 0.99) return '#52c41a';
  if (ratio >= 0.95) return '#faad14';
  return '#ff4d4f';
}

interface Props {
  datasourceValue?: number;
  publicMode?: boolean;
}

export default function UptimeKumaStatusPage({ datasourceValue, publicMode }: Props) {
  const screens = useBreakpoint();
  const [monitors, setMonitors] = useState<MonitorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const overallStatus = useMemo(() => {
    if (monitors.length === 0) return 'unknown';
    const down = monitors.filter((m) => m.status === 0);
    if (down.length === 0) return 'healthy';
    if (down.length === monitors.length) return 'down';
    return 'degraded';
  }, [monitors]);

  useEffect(() => {
    if (!datasourceValue) return;
    const fetchStatus = async () => {
      setLoading(true);
      try {
        const query = `monitor_status{datasource_id="${datasourceValue}"}`;
        const resp = await fetch(`/api/n9e/proxy/${datasourceValue}/api/v1/query?query=${encodeURIComponent(query)}`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
        });
        const json = await resp.json();
        const results = json?.data?.result || [];

        const uptimeQuery = `monitor_uptime_ratio{window="30d",datasource_id="${datasourceValue}"}`;
        const uptimeResp = await fetch(`/api/n9e/proxy/${datasourceValue}/api/v1/query?query=${encodeURIComponent(uptimeQuery)}`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
        });
        const uptimeJson = await uptimeResp.json();
        const uptimeResults = uptimeJson?.data?.result || [];
        const uptimeMap: Record<string, number> = {};
        uptimeResults.forEach((r: any) => {
          if (r.metric?.monitor_name) uptimeMap[r.metric.monitor_name] = parseFloat(r.value?.[1]) || 0;
        });

        const monitors: MonitorStatus[] = results.map((r: any) => ({
          monitor_name: r.metric.monitor_name || 'unknown',
          monitor_type: r.metric.monitor_type || '-',
          monitor_url: r.metric.monitor_url || '-',
          status: parseInt(r.value?.[1]) || 0,
          response_time: 0,
          uptime_ratio_30d: uptimeMap[r.metric.monitor_name] || 0,
          cert_days_remaining: 0,
        }));
        setMonitors(monitors);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch monitor status');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [datasourceValue]);

  const overallBg = overallStatus === 'healthy' ? '#f6ffed' : overallStatus === 'degraded' ? '#fffbe6' : overallStatus === 'down' ? '#fff2f0' : '#fafafa';
  const overallColor = overallStatus === 'healthy' ? '#52c41a' : overallStatus === 'degraded' ? '#faad14' : overallStatus === 'down' ? '#ff4d4f' : '#999';
  const overallText = overallStatus === 'healthy' ? 'All Systems Operational' : overallStatus === 'degraded' ? 'Partial Outage' : overallStatus === 'down' ? 'Major Outage' : 'Unknown';

  if (!datasourceValue) {
    return <EmptyState type="no-data" description={publicMode ? 'No status data available' : 'Please select a Uptime Kuma datasource'} />;
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: publicMode ? '40px 24px' : '16px 8px' }}>
      {publicMode && (
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0 }}>Service Status</Title>
          <Text type="secondary">Real-time status of monitored services</Text>
        </div>
      )}

      <div style={{ background: overallBg, borderRadius: 12, padding: '24px 32px', marginBottom: 24, border: `1px solid ${overallColor}20` }}>
        <Space size={16}>
          {overallStatus === 'healthy' ? <CheckCircleFilled style={{ color: overallColor, fontSize: 32 }} /> :
           overallStatus === 'down' ? <CloseCircleFilled style={{ color: overallColor, fontSize: 32 }} /> :
           <MinusCircleFilled style={{ color: overallColor, fontSize: 32 }} />}
          <div>
            <Text style={{ fontSize: 18, fontWeight: 600, color: overallColor }}>{overallText}</Text>
            <br />
            <Text type="secondary">{monitors.length} monitors · Last checked: {dayjs().format('YYYY-MM-DD HH:mm:ss')}</Text>
          </div>
        </Space>
      </div>

      {loading ? (
        <SkeletonWrap type="card" rows={6} />
      ) : error ? (
        <Alert type="error" message={error} />
      ) : (
        <Row gutter={[12, 12]}>
          {monitors.map((m) => (
            <Col xs={24} sm={12} md={8} key={m.monitor_name}>
              <Card size="small" styles={{ body: { padding: 16 } }} hoverable>
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Text strong ellipsis style={{ maxWidth: screens.md ? 180 : 140, fontSize: 13 }}>{m.monitor_name}</Text>
                    {statusIcon(m.status)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    {statusLabel(m.status)}
                    <Text type="secondary" style={{ fontSize: 11 }}>{m.monitor_type}</Text>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fc-text-4)' }}>
                    <Space size={4}>
                      <span>Uptime: <span style={{ fontWeight: 600, color: uptimeColor(m.uptime_ratio_30d) }}>{(m.uptime_ratio_30d * 100).toFixed(1)}%</span></span>
                    </Space>
                  </div>
                  {!publicMode && (
                    <Text type="secondary" ellipsis style={{ fontSize: 10, maxWidth: '100%' }}>{m.monitor_url}</Text>
                  )}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
