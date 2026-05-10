import React from 'react';
import { Form, Input, InputNumber, Select, Row, Col, Card, Space, Tag } from 'antd';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { scrollToFirstError } from '@/utils';
import Name from '../../components/items/Name';
import HTTP from '../../components/items/HTTP';
import BasicAuth from '../../components/items/BasicAuth';
import SkipTLSVerify from '../../components/items/SkipTLSVerify';
import Headers from '../../components/items/Headers';
import Description from '../../components/items/Description';
import Footer from '../../components/items/Footer';

const { TextArea } = Input;

export default function FormCpt({ action, data, onFinish, submitLoading }: any) {
  const { t } = useTranslation('datasourceManage');
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      layout='vertical'
      onFinish={onFinish}
      onFinishFailed={() => scrollToFirstError()}
      initialValues={data}
      className='settings-source-form'
    >
      <Card title={<Space>{t(`${action}_title`)} <Tag color='purple'>OTLP</Tag></Space>}>
        <Name />
        <HTTP placeholder='http://localhost:4318' />

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('form.rum.protocol')}
              name={['settings', 'protocol']}
              initialValue='http'
              rules={[{ required: true, message: t('form.rum.required_protocol') }]}
            >
              <Select
                options={[
                  { label: 'HTTP / Protobuf (OTLP)', value: 'http' },
                  { label: 'gRPC (OTLP)', value: 'grpc' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('form.rum.sample_rate')}
              name={['settings', 'sample_rate']}
              initialValue={100}
              rules={[{ type: 'number', min: 0, max: 100, message: t('form.rum.required_sample_rate') }]}
            >
              <InputNumber min={0} max={100} addonAfter='%' style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <BasicAuth />
        <SkipTLSVerify />
        <Headers />

        <div className='page-title' style={{ marginTop: 0 }}>
          {t('form.rum.otel_settings')}
        </div>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('form.rum.api_key')}
              name={['settings', 'api_key']}
              rules={[]}
            >
              <Input.Password placeholder='otlp-api-key' />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('form.rum.session_timeout')}
              name={['settings', 'session_timeout_minutes']}
              initialValue={30}
              rules={[{ type: 'number', min: 1, max: 1440, message: t('form.rum.required_session_timeout') }]}
            >
              <InputNumber min={1} max={1440} addonAfter={t('form.rum.minutes')} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('form.rum.allowed_origins')}
              name={['settings', 'allowed_origins']}
              rules={[]}
            >
              <Select
                mode='tags'
                tokenSeparators={[',', '\n']}
                placeholder='https://app.example.com'
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('form.rum.max_payload_size')}
              name={['settings', 'max_payload_size_kb']}
              initialValue={1024}
              rules={[{ type: 'number', min: 64, max: 4096 }]}
            >
              <InputNumber min={64} max={4096} addonAfter='KB' style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label={t('form.rum.resource_attributes')}
          name={['settings', 'resource_attributes']}
          rules={[]}
          tooltip='service.name=frontend,deployment.environment=production'
        >
          <TextArea rows={2} placeholder='service.name=my-app, deployment.environment=production' />
        </Form.Item>
        <Description />
      </Card>
      <Footer id={data?.id} submitLoading={submitLoading} />
    </Form>
  );
}
