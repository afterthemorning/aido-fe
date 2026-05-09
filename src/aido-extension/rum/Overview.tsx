import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Space } from 'antd';
import { TeamOutlined, WarningOutlined, ClockCircleOutlined, ApiOutlined } from '@ant-design/icons';
import PageLayout from '@/components/pageLayout';
import EmptyState from '@/components/EmptyState';
import SkeletonWrap from '@/components/SkeletonWrap';
import { useTranslation } from 'react-i18next';
import './locale';

const { Title } = Typography;

export default function RUMOverview() {
  const { t } = useTranslation('rum');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { title: t('sessions'), value: 0, prefix: <TeamOutlined />, color: '#1890ff' },
    { title: t('page_views'), value: 0, prefix: <ApiOutlined />, color: '#52c41a' },
    { title: t('js_errors'), value: 0, prefix: <WarningOutlined />, color: '#ff4d4f' },
    { title: t('avg_load_time'), value: '0ms', prefix: <ClockCircleOutlined />, color: '#722ed1' },
  ];

  return (
    <PageLayout title={t('rum_real_user_monitoring')}>
      <div style={{ padding: 16 }}>
        <Title level={4} style={{ marginTop: 0, marginBottom: 20 }}>{t('overview')}</Title>
        {loading ? (
          <>
            <SkeletonWrap type="stats" rows={4} />
            <div style={{ marginTop: 24 }}><SkeletonWrap type="detail" /></div>
          </>
        ) : (
          <>
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
                <Card title={t('trend')} styles={{ body: { minHeight: 300 } }}>
                  <EmptyState type="no-data" description={t('chart_placeholder')} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card title={t('top_pages')} styles={{ body: { minHeight: 300 } }}>
                  <EmptyState type="no-data" description={t('no_data')} />
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
    </PageLayout>
  );
}
