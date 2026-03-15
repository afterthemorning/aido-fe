import { App as AntdApp, Button, Card, ConfigProvider, Empty, Flex, Result, Space, Typography, theme } from 'antd';
import { useState } from 'react';

const { Title, Paragraph, Text } = Typography;

export default function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 12,
        },
      }}
    >
      <AntdApp>
        <div
          style={{
            minHeight: '100vh',
            padding: 24,
            background: isDark
              ? 'radial-gradient(circle at top right, #1f2a44 0%, #111827 55%, #0b0f19 100%)'
              : 'radial-gradient(circle at top right, #e6f4ff 0%, #f6fbff 45%, #ffffff 100%)',
          }}
        >
          <Space direction='vertical' size={16} style={{ width: '100%', maxWidth: 980, margin: '0 auto' }}>
            <Flex justify='space-between' align='center'>
              <Title level={3} style={{ margin: 0 }}>Ant Design 6 Illustration Style Lab</Title>
              <Button onClick={() => setIsDark((v) => !v)}>{isDark ? 'Switch to Light' : 'Switch to Dark'}</Button>
            </Flex>

            <Paragraph>
              <Text type='secondary'>
                This lab verifies React 18 + antd 6 baseline and shows Ant Design illustration-style empty/result experiences.
              </Text>
            </Paragraph>

            <Flex gap={16} wrap='wrap'>
              <Card title='Empty Illustration (Default)' style={{ flex: '1 1 420px' }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_DEFAULT}
                  description='No data yet. Connect datasource to start.'
                >
                  <Button type='primary'>Create Source</Button>
                </Empty>
              </Card>

              <Card title='Empty Illustration (Simple)' style={{ flex: '1 1 420px' }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description='No alerts configured for this scope.'
                >
                  <Button>Open Alert Wizard</Button>
                </Empty>
              </Card>
            </Flex>

            <Card title='Result Illustration'>
              <Result
                status='success'
                title='Configuration Draft Saved'
                subTitle='You can now publish this rule to the environment.'
                extra={[
                  <Button type='primary' key='publish'>Publish</Button>,
                  <Button key='edit'>Continue Editing</Button>,
                ]}
              />
            </Card>
          </Space>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}
