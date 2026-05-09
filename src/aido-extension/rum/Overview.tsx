import React from 'react';
import { Card, Row, Col, Statistic, Typography, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, TeamOutlined, WarningOutlined, ClockCircleOutlined, ApiOutlined } from '@ant-design/icons';
import PageLayout from '@/components/pageLayout';
import { useTranslation } from 'react-i18next';
import './locale';

const { Title } = Typography;

export default function RUMOverview() {
  const { t } = useTranslation('rum');

  const stats = [
    { title: t('sessions') || 'Sessions', value: 0, prefix: <TeamOutlined />, color: '#1890ff' },
    { title: t('page_views') || 'Page Views', value: 0, prefix: <ApiOutlined />, color: '#52c41a' },
    { title: t('js_errors') || 'JS Errors', value: 0, prefix: <WarningOutlined />, color: '#ff4d4f' },
    { title: t('avg_load_time') || 'Avg Load Time', value: '0ms', prefix: <ClockCircleOutlined />, color: '#722ed1' },
  ];

  return (
    <PageLayout title={t('rum_real_user_monitoring') || 'Real User Monitoring'}>
      <div style={{ padding: 16 }}>
        <Title level={4} style={{ marginTop: 0, marginBottom: 20 }}>
          {t('overview') || 'Overview'}
        </Title>
        <Row gutter={[16, 16]}>
          {stats.map((s) => (
            <Col xs={12} md={6} key={s.title}>
              <Card hoverable styles={{ body: { padding: 20 } }}>
                <Statistic
                  title={s.title}
                  value={s.value}
                  prefix={<span style={{ color: s.color, marginRight: 8 }}>{s.prefix}</span>}
                  valueStyle={{ fontSize: 24, fontWeight: 600 }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} md={16}>
            <Card title={t('trend') || 'Trend (Last 24h)'} styles={{ body: { height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' } }}>
              <Space direction="vertical" align="center">
                <ApiOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <span style={{ color: '#999' }}>{t('chart_placeholder') || 'Chart area - coming soon'}</span>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title={t('top_pages') || 'Top Pages'} styles={{ body: { height: 300 } }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <span style={{ color: '#999', textAlign: 'center', paddingTop: 100 }}>{t('no_data') || 'No data yet'}</span>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </PageLayout>
  );
}
