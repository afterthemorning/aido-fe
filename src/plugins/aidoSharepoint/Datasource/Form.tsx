import React, { useRef } from 'react';
import { Form, Card, Input } from 'antd';

import Name from '@/pages/datasource/components/items/Name';
import Description from '@/pages/datasource/components/items/Description';
import Footer from '@/pages/datasource/components/items/Footer';
import Cluster from '@/pages/datasource/components/itemsNG/Cluster';

export default function FormCpt({ action, data, onFinish, submitLoading }: any) {
  const [form] = Form.useForm();
  const clusterRef = useRef<any>();
  const cate = 'aido-sharepoint';

  return (
    <Form
      form={form}
      layout='vertical'
      onFinish={(values) => onFinish(values, clusterRef.current)}
      initialValues={data}
      className='settings-source-form'
    >
      <Card title={action === 'add' ? 'Create Aido SharePoint Datasource' : 'Edit Aido SharePoint Datasource'}>
        <Name />
        <Form.Item
          label='Site URL'
          name={['settings', `${cate}.site_url`]}
          rules={[{ required: true, message: 'Site URL is required' }]}
        >
          <Input autoComplete='off' placeholder='https://contoso.sharepoint.com/sites/ops' />
        </Form.Item>
        <Form.Item label='List Name' name={['settings', `${cate}.list_name`]}>
          <Input autoComplete='off' placeholder='ExpiryReminder' />
        </Form.Item>
        <Form.Item label='Tenant ID' name={['settings', `${cate}.tenant_id`]}>
          <Input autoComplete='off' />
        </Form.Item>
        <Form.Item label='Client ID' name={['settings', `${cate}.client_id`]}>
          <Input autoComplete='off' />
        </Form.Item>
        <Form.Item label='Client Secret' name={['settings', `${cate}.client_secret`]}>
          <Input.Password autoComplete='off' />
        </Form.Item>
        <Cluster cate={cate} clusterRef={clusterRef} />
        <Description />
      </Card>
      <Footer id={data?.id} submitLoading={submitLoading} />
    </Form>
  );
}
