import React from 'react';
import { Descriptions, Tag, Badge } from 'antd';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

export default function Detail({ data }: any) {
  const { t } = useTranslation('datasourceManage');
  const settings = data.settings || {};

  return (
    <Descriptions column={2} size='small' bordered>
      <Descriptions.Item label={t('form.apm.protocol')} span={2}>
        <Tag color='blue'>OTLP / {settings.protocol === 'grpc' ? 'gRPC' : 'HTTP'}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label={t('form.label.sample_rate')}>
        {settings.sample_rate ?? 100}%
      </Descriptions.Item>
      <Descriptions.Item label={t('form.apm.trace_ratio')}>
        {settings.trace_ratio ?? 1.0}
      </Descriptions.Item>
      {settings.api_key && (
        <Descriptions.Item label={t('form.apm.api_key')} span={2}>
          <Tag>****{String(settings.api_key).slice(-4)}</Tag>
        </Descriptions.Item>
      )}
      {settings.service_names && settings.service_names.length > 0 && (
        <Descriptions.Item label={t('form.apm.service_names')} span={2}>
          {settings.service_names.map((s: string) => (
            <Tag key={s} color='blue'>{s}</Tag>
          ))}
        </Descriptions.Item>
      )}
      {settings.resource_attributes && (
        <Descriptions.Item label={t('form.apm.resource_attributes')} span={2}>
          {settings.resource_attributes}
        </Descriptions.Item>
      )}
      <Descriptions.Item label={t('form.label.http_endpoint')} span={2}>
        {data?.http_urls?.[0] || '-'}
      </Descriptions.Item>
      <Descriptions.Item label={t('form.label.basic_auth')}>
        {data?.basic_auth_user ? <Badge status='success' text={t('form.label.configured')} /> : <Badge status='default' text={t('form.label.not_configured')} />}
      </Descriptions.Item>
      <Descriptions.Item label={t('form.label.skip_tls')}>
        {data?.skip_tls_verify ? <Badge status='warning' text={t('form.label.enabled')} /> : <Badge status='default' text={t('form.label.disabled')} />}
      </Descriptions.Item>
    </Descriptions>
  );
}
