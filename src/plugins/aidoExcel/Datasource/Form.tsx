import React, { useRef } from 'react';
import { Form, Card, Input, Divider } from 'antd';

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
      <Card title={action === 'add' ? 'Create AIDO Excel Datasource' : 'Edit AIDO Excel Datasource'}>
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

        <Divider orientation='left'>Column Mapping (Optional)</Divider>
        <Form.Item label='Application Name Column' name={['settings', `${cate}.column.application_name`]}>
          <Input autoComplete='off' placeholder='Application Name' />
        </Form.Item>
        <Form.Item label='Environment Column' name={['settings', `${cate}.column.environment`]}>
          <Input autoComplete='off' placeholder='Environment' />
        </Form.Item>
        <Form.Item label='Category Column' name={['settings', `${cate}.column.category`]}>
          <Input autoComplete='off' placeholder='Category' />
        </Form.Item>
        <Form.Item label='Support Owner Column' name={['settings', `${cate}.column.support_owner`]}>
          <Input autoComplete='off' placeholder='Support Owner' />
        </Form.Item>
        <Form.Item label='Email Column' name={['settings', `${cate}.column.email`]}>
          <Input autoComplete='off' placeholder='Email' />
        </Form.Item>
        <Form.Item label='Next Expiry Date Column' name={['settings', `${cate}.column.next_expiry_date`]}>
          <Input autoComplete='off' placeholder='Next Expiry Date' />
        </Form.Item>

        <Cluster cate={cate} clusterRef={clusterRef} />
        <Description />
      </Card>
      <Footer id={data?.id} submitLoading={submitLoading} />
    </Form>
  );
}
