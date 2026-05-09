import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Row,
  Col,
  Tag,
  Typography,
  Space,
  Skeleton,
  Avatar,
  Statistic,
  Grid,
  Divider,
  Empty,
} from 'antd';
import {
  DashboardOutlined,
  BellOutlined,
  ApiOutlined,
  ExperimentOutlined,
  SafetyOutlined,
  BugOutlined,
  TeamOutlined,
  CloudServerOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  DatabaseOutlined,
  NotificationOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import PageLayout from '@/components/pageLayout';
import pkgJson from '../../../../package.json';
import './locale';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

interface FeatureItem {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
}

const features: FeatureItem[] = [
  { icon: <DashboardOutlined />, titleKey: 'feature.dashboard.title', descKey: 'feature.dashboard.desc' },
  { icon: <BellOutlined />, titleKey: 'feature.alert.title', descKey: 'feature.alert.desc' },
  { icon: <ApiOutlined />, titleKey: 'feature.datasource.title', descKey: 'feature.datasource.desc' },
  { icon: <ExperimentOutlined />, titleKey: 'feature.explorer.title', descKey: 'feature.explorer.desc' },
  { icon: <SafetyOutlined />, titleKey: 'feature.ssl.title', descKey: 'feature.ssl.desc' },
  { icon: <BugOutlined />, titleKey: 'feature.incident.title', descKey: 'feature.incident.desc' },
  { icon: <TeamOutlined />, titleKey: 'feature.team.title', descKey: 'feature.team.desc' },
  { icon: <CloudServerOutlined />, titleKey: 'feature.multi.title', descKey: 'feature.multi.desc' },
];

const archItems = [
  { labelKey: 'monitoring_protocol', valueKey: 'monitoring_protocol_val', icon: <CodeOutlined /> },
  { labelKey: 'alert_engine', valueKey: 'alert_engine_val', icon: <ThunderboltOutlined /> },
  { labelKey: 'notification_channels', valueKey: 'notification_channels_val', icon: <NotificationOutlined /> },
  { labelKey: 'data_retention', valueKey: 'data_retention_val', icon: <DatabaseOutlined /> },
];

interface BackendVersion {
  version: string;
}

export default function AboutProduct() {
  const { t } = useTranslation('version');
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [loading, setLoading] = useState(true);
  const [backendVersion, setBackendVersion] = useState('');

  useEffect(() => {
    fetch('/api/n9e/versions')
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data: { dat?: BackendVersion }) => setBackendVersion(data?.dat?.version || '-'))
      .catch(() => setBackendVersion('-'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageLayout title={t('title')}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '16px 24px 64px' }}>
        {/* ===== 1. Hero ===== */}
        <div style={{ textAlign: 'center', marginBottom: 40, paddingTop: 32, paddingBottom: 32 }}>
          <Avatar
            size={68}
            shape="square"
            style={{
              background: 'linear-gradient(135deg, #6C53B1 0%, #9470FF 100%)',
              fontSize: 30,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              borderRadius: 16,
            }}
          >
            A
          </Avatar>
          <Title level={2} style={{ margin: '0 0 8px', fontWeight: 700 }}>
            AIDO
          </Title>
          <Paragraph type="secondary" style={{ fontSize: 15, maxWidth: 540, margin: '0 auto' }}>
            {t('architecture_desc')}
          </Paragraph>
        </div>

        {/* ===== 2. Version Cards ===== */}
        <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
          <Col xs={24} md={12}>
            <Card styles={{ body: { padding: 24 } }}>
              <Space align="start" size={16}>
                <Avatar
                  size={44}
                  shape="square"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: 14,
                    fontWeight: 700,
                    borderRadius: 10,
                    flexShrink: 0,
                  }}
                >
                  FE
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t('frontend')}
                  </Text>
                  <Space size={10} style={{ marginBottom: 6 }}>
                    <Tag color="purple" style={{ fontSize: 14, fontWeight: 600, padding: '2px 12px', borderRadius: 6, margin: 0 }}>
                      v{pkgJson.version}
                    </Tag>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                    React 18 · Ant Design 6 · Vite · TypeScript
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card styles={{ body: { padding: 24 } }}>
              <Space align="start" size={16}>
                <Avatar
                  size={44}
                  shape="square"
                  style={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    fontSize: 14,
                    fontWeight: 700,
                    borderRadius: 10,
                    flexShrink: 0,
                  }}
                >
                  BE
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t('backend')}
                  </Text>
                  <Space size={10} style={{ marginBottom: 6 }}>
                    {loading ? (
                      <Skeleton.Input active size="small" style={{ width: 90, borderRadius: 6 }} />
                    ) : (
                      <Tag color="blue" style={{ fontSize: 14, fontWeight: 600, padding: '2px 12px', borderRadius: 6, margin: 0 }}>
                        {backendVersion || '-'}
                      </Tag>
                    )}
                  </Space>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                    Go 1.22+ · Gin · GORM · MySQL / PostgreSQL
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* ===== 3. Stats Row ===== */}
        <Row gutter={[16, 16]} style={{ marginBottom: 40 }}>
          {[
            { label: t('license'), value: 'Apache 2.0' },
            { label: t('edition'), value: 'Community Edition' },
            { label: 'Protocol', value: 'PromQL / ES DSL / LogQL' },
            { label: 'Storage', value: 'VictoriaMetrics / ES' },
          ].map((item) => (
            <Col xs={12} md={6} key={item.label}>
              <Card size="small" styles={{ body: { padding: '14px 16px', textAlign: 'center' } }}>
                <Statistic title={item.label} value={item.value} valueStyle={{ fontSize: 13, fontWeight: 500 }} />
              </Card>
            </Col>
          ))}
        </Row>

        {/* ===== 4. Features ===== */}
        <Title level={3} style={{ marginBottom: 20 }}>
          {t('core_features')}
        </Title>
        <Row gutter={[20, 20]} style={{ marginBottom: 40 }}>
          {features.map((feat) => (
            <Col xs={24} sm={12} md={6} key={feat.titleKey}>
              <Card
                hoverable
                styles={{ body: { padding: 24, height: '100%', display: 'flex', flexDirection: 'column' } }}
                style={{ height: '100%', borderRadius: 10 }}
              >
                <Avatar
                  size={40}
                  shape="square"
                  icon={feat.icon}
                  style={{
                    backgroundColor: 'var(--fc-fill-3)',
                    color: 'var(--fc-primary-color)',
                    fontSize: 20,
                    borderRadius: 10,
                    marginBottom: 14,
                  }}
                />
                <Title level={5} style={{ marginTop: 0, marginBottom: 10, fontWeight: 600 }}>
                  {t(feat.titleKey)}
                </Title>
                <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 12, lineHeight: 1.7, flex: 1 }}>
                  {t(feat.descKey)}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ===== 5. Architecture ===== */}
        <Title level={3} style={{ marginBottom: 20 }}>
          <CheckCircleOutlined style={{ color: 'var(--fc-primary-color)', marginRight: 8 }} />
          {t('architecture')}
        </Title>
        <Card styles={{ body: { padding: isMobile ? 0 : undefined } }}>
          <Row>
            {archItems.map((item, idx) => (
              <Col
                xs={12}
                md={6}
                key={item.labelKey}
                style={{
                  padding: '24px 20px',
                  borderRight: !isMobile && idx < archItems.length - 1 ? '1px solid var(--fc-border-color)' : 'none',
                  borderBottom: isMobile && idx < archItems.length - 1 ? '1px solid var(--fc-border-color)' : 'none',
                }}
              >
                <Space size={12} align="start">
                  <Avatar
                    size={36}
                    shape="square"
                    icon={item.icon}
                    style={{
                      backgroundColor: 'var(--fc-fill-3)',
                      color: 'var(--fc-primary-color)',
                      fontSize: 18,
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {t(item.labelKey)}
                    </Text>
                    <Text style={{ fontSize: 13, lineHeight: 1.5, display: 'block' }}>
                      {t(item.valueKey)}
                    </Text>
                  </div>
                </Space>
              </Col>
            ))}
          </Row>
        </Card>

        {/* ===== 6. Footer ===== */}
        <Divider style={{ marginTop: 40, marginBottom: 16 }} />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Copyright &copy; {new Date().getFullYear()} AIDO Team. Apache 2.0 License.
          </Text>
        </div>
      </div>
    </PageLayout>
  );
}
