import React, { useEffect, useState, useContext } from 'react';
import { Card, Row, Col, Statistic, Space, Tag, Typography, Spin, Alert } from 'antd';
import {
  DashboardOutlined, BellOutlined, DatabaseOutlined, TeamOutlined,
  CheckCircleOutlined, WarningOutlined, ApiOutlined,
  RocketOutlined, SettingOutlined, SafetyCertificateOutlined,
  AppstoreOutlined, ExperimentOutlined,
} from '@ant-design/icons';
import _ from 'lodash';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/pageLayout';
import { CommonStateContext } from '@/App';
import { getDataSourceList } from '@/pages/datasource/services';

const { Title, Text } = Typography;

interface ModuleCard {
  key: string;
  titleKey: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

const ALL_MODULES: ModuleCard[] = [
  { key: 'targets', titleKey: 'menu.targets', icon: <RocketOutlined />, route: '/targets', color: '#1890ff' },
  { key: 'explorer', titleKey: 'menu.metric_explorer', icon: <ApiOutlined />, route: '/metric/explorer', color: '#52c41a' },
  { key: 'alertRules', titleKey: 'menu.alert_rules', icon: <BellOutlined />, route: '/alert-rules', color: '#ff4d4f' },
  { key: 'dashboards', titleKey: 'menu.dashboards', icon: <DashboardOutlined />, route: '/dashboards', color: '#faad14' },
  { key: 'datasources', titleKey: 'menu.data_source', icon: <DatabaseOutlined />, route: '/datasources', color: '#722ed1' },
  { key: 'users', titleKey: 'menu.users', icon: <TeamOutlined />, route: '/users', color: '#13c2c2' },
  { key: 'regularReport', titleKey: 'menu.regular_report', icon: <ExperimentOutlined />, route: '/regular-report', color: '#eb2f96' },
  { key: 'setting', titleKey: 'menu.setting', icon: <SettingOutlined />, route: '/system/version', color: '#fa8c16' },
];

/** Check if a route is accessible via perms */
const hasRouteAccess = (route: string, perms?: string[]): boolean => {
  if (!perms) return true;
  return perms.some((p) => route.startsWith(p) || p.startsWith(route) || p === route.replace(/^\//, '') || p === `${route}:view`);
};

export default function Home() {
  const { t } = useTranslation(['common', 'sideMenu']);
  const navigate = useNavigate();
  const { versions, perms, profile, installTs } = useContext(CommonStateContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ datasources: 0 });

  useEffect(() => {
    getDataSourceList()
      .then((res: any) => setStats({ datasources: res?.dat?.length || 0 }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const versionStr = versions?.version || versions?.github_verison || '-';
  const hasNewVersion = versions?.newVersion;

  const availableModules = ALL_MODULES.filter((m) => hasRouteAccess(m.route, perms));

  const daysSinceInstall = installTs ? Math.floor((Date.now() - installTs * 1000) / 86400000) : 0;

  return (
    <PageLayout title='Home'>
      <div style={{ padding: 16 }}>
        {/* System Status Banner */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align='middle'>
            <Col xs={12} md={6}>
              <Statistic
                title='Version'
                value={versionStr}
                prefix={<RocketOutlined style={{ color: '#6C53B1' }} />}
                valueStyle={{ fontSize: 20 }}
              />
            </Col>
            <Col xs={12} md={4}>
              <Statistic
                title='Uptime'
                value={daysSinceInstall || 'New'}
                suffix={daysSinceInstall ? 'days' : ''}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Col>
            <Col xs={12} md={4}>
              <Statistic
                title='Data Sources'
                value={stats.datasources}
                prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
              />
            </Col>
            <Col xs={12} md={4}>
              <Statistic
                title='Active Users'
                value={profile?.username ? 1 : 0}
                prefix={<TeamOutlined style={{ color: '#13c2c2' }} />}
              />
            </Col>
            <Col xs={24} md={6}>
              <Space wrap>
                <Tag icon={<CheckCircleOutlined />} color='success'>Online</Tag>
                <Tag icon={<SafetyCertificateOutlined />} color={profile?.admin ? 'gold' : 'default'}>
                  {profile?.admin ? 'Admin' : 'User'}
                </Tag>
                {hasNewVersion && <Tag color='warning'>Update Available</Tag>}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Module Access Grid */}
        <Title level={5} style={{ marginBottom: 16 }}>
          <Space><AppstoreOutlined /> Modules</Space>
        </Title>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size='large' /></div>
        ) : (
          <Row gutter={[16, 16]}>
            {availableModules.map((mod) => (
              <Col xs={12} sm={8} md={6} lg={4} key={mod.key}>
                <Card
                  hoverable
                  styles={{ body: { padding: 16, textAlign: 'center' } }}
                  onClick={() => navigate(mod.route)}
                >
                  <div style={{ fontSize: 32, color: mod.color, marginBottom: 8 }}>{mod.icon}</div>
                  <Text strong style={{ fontSize: 13 }}>{t(mod.titleKey, { ns: 'sideMenu' })}</Text>
                </Card>
              </Col>
            ))}
            {availableModules.length === 0 && (
              <Col span={24}>
                <Alert message='No modules available' type='info' showIcon />
              </Col>
            )}
          </Row>
        )}
      </div>
    </PageLayout>
  );
}
