import React, { useRef } from 'react';
import { Card, Form, Input, Select } from 'antd';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

import Name from '@/pages/datasource/components/items/Name';
import HTTP from '@/pages/datasource/components/items/HTTP';
import BasicAuth from '@/pages/datasource/components/items/BasicAuth';
import SkipTLSVerify from '@/pages/datasource/components/items/SkipTLSVerify';
import Headers from '@/pages/datasource/components/items/Headers';
import Description from '@/pages/datasource/components/items/Description';
import Footer from '@/pages/datasource/components/items/Footer';
import Cluster from '@/pages/datasource/components/items/Cluster';

export default function FormCpt({ action, data, onFinish, submitLoading }: any) {
  const { t } = useTranslation('datasourceManage');
  const [form] = Form.useForm();
  const clusterRef = useRef<any>();
  const initialValues = _.merge({}, data);
  if (!initialValues?.http?.url && initialValues?.settings?.['aido-uptime-kuma.metrics_url']) {
    initialValues.http = {
      ...initialValues.http,
      url: initialValues.settings['aido-uptime-kuma.metrics_url'],
    };
  }

  return (
    <Form
      form={form}
      layout='vertical'
      onFinish={(values) => {
        values.settings = values.settings || {};
        values.settings['aido-uptime-kuma.metrics_url'] = values?.http?.url || '';
        onFinish(values, clusterRef.current);
      }}
      initialValues={initialValues}
      className='settings-source-form'
    >
      <Card title={t(`${action}_title`)}>
        <Name />
        <HTTP placeholder='http://uptime-kuma.example.com/metrics' />

        <BasicAuth />
        <SkipTLSVerify />
        <Headers />

        <div className='page-title' style={{ marginTop: 0 }}>
          {t('form.other')}
        </div>
        <Form.Item label='Remote Write URL' name={['settings', 'write_addr']}>
          <Input />
        </Form.Item>
        <Form.Item label={t('form.prom.read_addr')} name={['settings', 'internal_addr']}>
          <Input />
        </Form.Item>
        <Cluster form={form} clusterRef={clusterRef} />
        <Form.Item label={t('form.prom.tsdb_type')} name={['settings', 'prometheus.tsdb_type']}>
          <Select
            options={_.map(['Prometheus', 'Thanos', 'VictoriaMetrics', 'M3', 'SLS'], (item) => {
              return { label: item, value: item };
            })}
            showSearch
          />
        </Form.Item>

        <Description />
      </Card>
      <Footer id={data?.id} submitLoading={submitLoading} />
    </Form>
  );
}
