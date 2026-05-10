import React from 'react';
import { Descriptions, Tag, Badge } from 'antd';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

export default function Detail({ data }: any) {
  const { t } = useTranslation('datasourceManage');
  const settings = data.settings || {};

  return (
    <Descriptions column={2} size='small' bordered>
      <Descriptions.Item label={t('form.rum.protocol')} span={2}>
        <Tag color='purple'>OTLP / {settings.protocol === 'grpc' ? 'gRPC' : 'HTTP'}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label={t('form.label.sample_rate')}>
        {settings.sample_rate ?? 100}%
      </Descriptions.Item>
      <Descriptions.Item label={t('form.rum.session_timeout')}>
        {settings.session_timeout_minutes ?? 30} {t('form.rum.minutes')}
      </Descriptions.Item>
      {settings.api_key && (
        <Descriptions.Item label={t('form.rum.api_key')} span={2}>
          <Tag>****{String(settings.api_key).slice(-4)}</Tag>
        </Descriptions.Item>
      )}
      {settings.allowed_origins && settings.allowed_origins.length > 0 && (
        <Descriptions.Item label={t('form.rum.allowed_origins')} span={2}>
          {settings.allowed_origins.map((o: string) => (
            <Tag key={o}>{o}</Tag>
          ))}
        </Descriptions.Item>
      )}
      {settings.resource_attributes && (
        <Descriptions.Item label={t('form.rum.resource_attributes')} span={2}>
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
