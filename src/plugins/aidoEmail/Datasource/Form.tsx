import React, { useRef, useState } from 'react';
import { Form, Card, Input, InputNumber, Select, Switch, Tabs, Row, Col, Button, Space, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';

import Name from '@/pages/datasource/components/items/Name';
import Description from '@/pages/datasource/components/items/Description';
import Footer from '@/pages/datasource/components/items/Footer';
import Cluster from '@/pages/datasource/components/itemsNG/Cluster';
import { testIMAPConnection, IMAPConfig } from '../services';

interface AidoEmailFormProps {
  action: string;
  data?: {
    id?: number;
    settings?: Record<string, unknown>;
  };
  onFinish: (values: Record<string, unknown>, cluster: unknown) => void;
  submitLoading?: boolean;
}

export default function FormCpt({ action, data, onFinish, submitLoading }: AidoEmailFormProps) {
  const [form] = Form.useForm();
  const clusterRef = useRef<unknown>();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const cate = 'aido-email';
  const initialValues = _.merge(
    {
      settings: {
        [`${cate}.source_type`]: 'imap',
        [`${cate}.imap.port`]: 993,
        [`${cate}.imap.use_tls`]: true,
        [`${cate}.imap.folder`]: 'INBOX',
        [`${cate}.read_method`]: 'unread_only',
        [`${cate}.read_frequency_seconds`]: 300,
        [`${cate}.storage_mode`]: 'structured_json',
        [`${cate}.retention_days`]: 90,
        [`${cate}.address_split`]: ',',
      },
    },
    data,
  );

  return (
    <Form
      form={form}
      layout='vertical'
      onFinish={(values) => onFinish(values, clusterRef.current)}
      initialValues={initialValues}
      className='settings-source-form'
    >
      <Card title={action === 'add' ? 'Create Aido Email Datasource' : 'Edit Aido Email Datasource'}>
        <Name />
        <Tabs
          destroyInactiveTabPane={false}
          items={[
            {
              key: 'connection',
              label: 'Connection',
              children: (
                <>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item label='Source Type' name={['settings', `${cate}.source_type`]} rules={[{ required: true }]}>
                        <Select options={[{ label: 'IMAP', value: 'imap' }]} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label='IMAP Host'
                        name={['settings', `${cate}.imap.host`]}
                        rules={[{ required: true, message: 'IMAP host is required' }]}
                      >
                        <Input autoComplete='off' placeholder='imap.example.com' />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label='IMAP Port' name={['settings', `${cate}.imap.port`]} rules={[{ required: true }]}>
                        <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label='Use TLS' name={['settings', `${cate}.imap.use_tls`]} valuePropName='checked'>
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label='IMAP Username'
                        name={['settings', `${cate}.imap.username`]}
                        rules={[{ required: true, message: 'IMAP username is required' }]}
                      >
                        <Input autoComplete='off' />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label='IMAP Password'
                        name={['settings', `${cate}.imap.password`]}
                        rules={[{ required: true, message: 'IMAP password is required' }]}
                      >
                        <Input.Password autoComplete='off' />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label='IMAP Folder' name={['settings', `${cate}.imap.folder`]}>
                        <Input autoComplete='off' placeholder='INBOX' />
                      </Form.Item>
                    </Col>
                  </Row>
                  <div className='mt-4'>
                    <Space>
                      <Button
                        loading={testing}
                        onClick={async () => {
                          try {
                            const values = await form.validateFields([
                              ['settings', `${cate}.imap.host`],
                              ['settings', `${cate}.imap.port`],
                              ['settings', `${cate}.imap.username`],
                              ['settings', `${cate}.imap.password`],
                            ]);
                            const settings = values.settings || {};
                            const imapConfig: IMAPConfig = {
                              host: settings[`${cate}.imap.host`],
                              port: settings[`${cate}.imap.port`],
                              use_tls: settings[`${cate}.imap.use_tls`] ?? true,
                              username: settings[`${cate}.imap.username`],
                              password: settings[`${cate}.imap.password`],
                              folder: settings[`${cate}.imap.folder`] || 'INBOX',
                            };
                            setTesting(true);
                            setTestResult(null);
                            const result = await testIMAPConnection(imapConfig);
                            setTestResult(result);
                            if (result.success) {
                              message.success(result.message);
                            } else {
                              message.error(result.message);
                            }
                          } catch {
                            message.error('Please fill in all required IMAP fields');
                          } finally {
                            setTesting(false);
                          }
                        }}
                      >
                        Test Connection
                      </Button>
                      {testResult && (
                        <span style={{ color: testResult.success ? '#52c41a' : '#ff4d4f' }}>
                          {testResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />} {testResult.message}
                        </span>
                      )}
                    </Space>
                  </div>
                </>
              ),
            },
            {
              key: 'strategy',
              label: 'Read & Storage',
              children: (
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label='Read Method' name={['settings', `${cate}.read_method`]} rules={[{ required: true }]}>
                      <Select
                        options={[
                          { label: 'Unread Only', value: 'unread_only' },
                          { label: 'Latest Window', value: 'latest_window' },
                          { label: 'All Emails', value: 'all' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label='Read Frequency (seconds)'
                      name={['settings', `${cate}.read_frequency_seconds`]}
                      rules={[{ required: true }]}
                      extra='Minimum 30 seconds'
                    >
                      <InputNumber min={30} max={86400} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label='Storage Mode' name={['settings', `${cate}.storage_mode`]} rules={[{ required: true }]}>
                      <Select
                        options={[
                          { label: 'Structured JSON', value: 'structured_json' },
                          { label: 'Raw MIME', value: 'raw_mime' },
                          { label: 'Hybrid (JSON + MIME)', value: 'hybrid' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label='Retention Days' name={['settings', `${cate}.retention_days`]} rules={[{ required: true }]}>
                      <InputNumber min={1} max={3650} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'recipient',
              label: 'Recipients',
              children: (
                <>
                  <Form.Item
                    label='Email Addresses'
                    name={['settings', `${cate}.address_list`]}
                    rules={[{ required: true, message: 'Email addresses are required' }]}
                    extra='Use comma-separated or line-separated addresses'
                  >
                    <Input.TextArea autoComplete='off' rows={5} placeholder='alice@example.com,bob@example.com' />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item label='Address Separator' name={['settings', `${cate}.address_split`]}>
                        <Input autoComplete='off' placeholder=', or \n' />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Cluster cate={cate} clusterRef={clusterRef} />
                </>
              ),
            },
          ]}
        />
        <Description />
      </Card>
      <Footer id={data?.id} submitLoading={Boolean(submitLoading)} />
    </Form>
  );
}
