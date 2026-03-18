import React from 'react';
import { Col, Row } from 'antd';
import { useTranslation } from 'react-i18next';

interface Props {
  data: any;
}

export default function Detail(props: Props) {
  const { t } = useTranslation('datasourceManage');
  const { data } = props;
  const metricsUrl = data?.http?.url || data?.settings?.['aido-uptime-kuma.metrics_url'];

  return (
    <div>
      <div className='page-title'>{t('form.prom.scrape_settings_title')}</div>
      <div className='flash-cat-block'>
        <Row gutter={16}>
          <Col span={24}>{t('form.prom.scrape_metrics_url')}：</Col>
          <Col span={24} className='second-color'>
            {metricsUrl || '-'}
          </Col>
        </Row>
      </div>

      <div className='page-title'>{t('form.auth')}</div>
      <div className='flash-cat-block'>
        <Row gutter={16}>
          <Col span={8}>{t('form.username')}：</Col>
          <Col span={8}>{t('form.password')}：</Col>
          <Col span={8}>{t('form.skip_ssl_verify')}：</Col>
          <Col span={8} className='second-color'>
            {data?.auth?.basic_auth ? data?.auth?.basic_auth_user : '-'}
          </Col>
          <Col span={8} className='second-color'>
            {data?.auth?.basic_auth ? '******' : '-'}
          </Col>
          <Col span={8} className='second-color'>
            {data.http?.tls?.skip_tls_verify ? t('form.yes') : t('form.no')}
          </Col>
        </Row>
      </div>

      <div className='page-title'>{t('form.other')}</div>
      <div className='flash-cat-block'>
        <Row gutter={16}>
          <Col span={24}>Remote Write URL：</Col>
          <Col span={24} className='second-color'>
            {data.settings?.write_addr || '-'}
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>{t('form.prom.read_addr')}：</Col>
          <Col span={24} className='second-color'>
            {data.settings?.internal_addr || '-'}
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>{t('form.cluster')}：</Col>
          <Col span={24} className='second-color'>
            {data?.cluster_name || '-'}
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>{t('form.prom.tsdb_type')}：</Col>
          <Col span={24} className='second-color'>
            {data.settings?.['prometheus.tsdb_type'] || '-'}
          </Col>
        </Row>
      </div>
    </div>
  );
}
