import React from 'react';
import { Alert, Col, Form, Input, InputNumber, Row, Select, Space, Switch } from 'antd';
import { useTranslation } from 'react-i18next';

export default function ReportMode() {
  const { t } = useTranslation('alertRules');
  const reportModeEnabled = Form.useWatch(['extra_config', 'regular_report_mode', 'enabled']);

  return (
    <>
      <Form.Item label={t('report_mode.title')}>
        <Space>
          <Form.Item name={['extra_config', 'regular_report_mode', 'enabled']} valuePropName='checked' noStyle>
            <Switch />
          </Form.Item>
          <span>{t('report_mode.enable_tip')}</span>
        </Space>
      </Form.Item>
      {reportModeEnabled && (
        <>
          <Alert style={{ marginBottom: 12 }} type='info' message={t('report_mode.enabled_notice')} />
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label={t('report_mode.report_type')}
                name={['extra_config', 'regular_report_mode', 'report_type']}
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: t('report_mode.report_types.daily'), value: 'daily' },
                    { label: t('report_mode.report_types.weekly'), value: 'weekly' },
                    { label: t('report_mode.report_types.monthly'), value: 'monthly' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t('report_mode.window_minutes')} name={['extra_config', 'regular_report_mode', 'window_minutes']}>
                <InputNumber min={5} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t('report_mode.topn')} name={['extra_config', 'regular_report_mode', 'topn']}>
                <InputNumber min={1} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('report_mode.include_recovered')} name={['extra_config', 'regular_report_mode', 'include_recovered']} valuePropName='checked'>
                <Switch />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label={t('report_mode.summary_template')} name={['extra_config', 'regular_report_mode', 'summary_template']}>
                <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} placeholder={t('report_mode.summary_template_placeholder')} />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
    </>
  );
}
