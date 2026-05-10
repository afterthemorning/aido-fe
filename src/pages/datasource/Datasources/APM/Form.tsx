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
      <Card title={<Space>{t(`${action}_title`)} <Tag color='blue'>OTLP</Tag></Space>}>
        <Name />
        <HTTP placeholder='http://localhost:4318' />

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('form.apm.protocol')}
              name={['settings', 'protocol']}
              initialValue='http'
              rules={[{ required: true, message: t('form.apm.required_protocol') }]}
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
              label={t('form.apm.sample_rate')}
              name={['settings', 'sample_rate']}
              initialValue={100}
              rules={[{ type: 'number', min: 0, max: 100, message: t('form.apm.required_sample_rate') }]}
            >
              <InputNumber min={0} max={100} addonAfter='%' style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <BasicAuth />
        <SkipTLSVerify />
        <Headers />

        <div className='page-title' style={{ marginTop: 0 }}>
          {t('form.apm.otel_settings')}
        </div>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('form.apm.api_key')}
              name={['settings', 'api_key']}
              rules={[]}
            >
              <Input.Password placeholder='otlp-api-key' />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('form.apm.trace_ratio')}
              name={['settings', 'trace_ratio']}
              initialValue={1.0}
              rules={[{ type: 'number', min: 0, max: 1, message: t('form.apm.required_trace_ratio') }]}
            >
              <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('form.apm.service_names')}
              name={['settings', 'service_names']}
              rules={[]}
            >
              <Select
                mode='tags'
                tokenSeparators={[',', '\n']}
                placeholder='my-service, api-gateway'
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('form.apm.span_limit_sec')}
              name={['settings', 'span_timeout_seconds']}
              initialValue={60}
              rules={[{ type: 'number', min: 1, max: 3600 }]}
            >
              <InputNumber min={1} max={3600} addonAfter={t('form.apm.seconds')} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label={t('form.apm.resource_attributes')}
          name={['settings', 'resource_attributes']}
          rules={[]}
          tooltip='service.name=my-app, service.version=1.0.0'
        >
          <TextArea rows={2} placeholder='service.name=my-app, service.version=1.0.0, deployment.environment=production' />
        </Form.Item>
        <Description />
      </Card>
      <Footer id={data?.id} submitLoading={submitLoading} />
    </Form>
  );
}
