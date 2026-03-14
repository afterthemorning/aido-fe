import React, { useRef } from 'react';
import { Form, Card, Input } from 'antd';

import Name from '@/pages/datasource/components/items/Name';
import Description from '@/pages/datasource/components/items/Description';
import Footer from '@/pages/datasource/components/items/Footer';
import Cluster from '@/pages/datasource/components/itemsNG/Cluster';

export default function FormCpt({ action, data, onFinish, submitLoading }: any) {
  const [form] = Form.useForm();
  const clusterRef = useRef<any>();
  const cate = 'aido-excel';

  return (
    <Form
      form={form}
      layout='vertical'
      onFinish={(values) => onFinish(values, clusterRef.current)}
      initialValues={data}
      className='settings-source-form'
    >
      <Card title={action === 'add' ? 'Create Aido Excel Datasource' : 'Edit Aido Excel Datasource'}>
        <Name />
        <Form.Item
          label='File Path'
          name={['settings', `${cate}.file_path`]}
          rules={[{ required: true, message: 'File path is required' }]}
        >
          <Input autoComplete='off' placeholder='/data/expiry-reminder.xlsx' />
        </Form.Item>
        <Form.Item label='Sheet Name' name={['settings', `${cate}.sheet_name`]}>
          <Input autoComplete='off' placeholder='Sheet1' />
        </Form.Item>
        <Cluster cate={cate} clusterRef={clusterRef} />
        <Description />
      </Card>
      <Footer id={data?.id} submitLoading={submitLoading} />
    </Form>
  );
}
