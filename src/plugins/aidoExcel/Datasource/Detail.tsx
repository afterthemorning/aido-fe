import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { Button, Col, Form, Input, Modal, Popconfirm, Row, Space, Table, Tabs, Tag, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlayCircleOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { ExpiryRecord, listRecords, overrideClear, overrideUpsert, recordDisable } from '../services';

interface Props {
  data: any;
}

const cate = 'aido-excel';

function expiryTag(days: number) {
  if (days < 0) return <Tag color='red'>Expired</Tag>;
  if (days <= 7) return <Tag color='orange'>≤7 days</Tag>;
  if (days <= 30) return <Tag color='gold'>≤30 days</Tag>;
  return <Tag color='green'>OK</Tag>;
}

function SettingsTab({ data }: { data: any }) {
  return (
    <div>
      <div className='page-title'>Excel Settings</div>
      <div className='flash-cat-block'>
        <Row gutter={16}>
          <Col span={24}>File Path:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.file_path`], '-')}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>Sheet Name:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.sheet_name`], '-')}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>Cluster:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.cluster_name`], '-')}
          </Col>
        </Row>
      </div>
    </div>
  );
}

function ExpiryTab({ datasourceId }: { datasourceId: number }) {
  const [records, setRecords] = useState<ExpiryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [overrideModal, setOverrideModal] = useState<ExpiryRecord | null>(null);
  const [form] = Form.useForm();

  const reload = async () => {
    setLoading(true);
    try {
      setRecords(await listRecords(datasourceId));
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [datasourceId]);

  const openOverride = (rec: ExpiryRecord) => {
    setOverrideModal(rec);
    form.setFieldsValue({
      next_expiry_date: rec.next_expiry_date,
      support_owner: rec.support_owner,
      email: rec.email,
      reason: '',
    });
  };

  const submitOverride = async () => {
    if (!overrideModal) return;
    const values = await form.validateFields();
    try {
      await overrideUpsert({
        application_name: overrideModal.application_name,
        environment: overrideModal.environment,
        category: overrideModal.category,
        ...values,
      });
      message.success('Override saved');
      setOverrideModal(null);
      reload();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const columns: ColumnsType<ExpiryRecord> = [
    { title: 'Application', dataIndex: 'application_name', key: 'app', sorter: (a, b) => a.application_name.localeCompare(b.application_name) },
    { title: 'Category', dataIndex: 'category', key: 'cat', filters: [...new Set(records.map((d) => d.category))].map((v) => ({ text: v, value: v })), onFilter: (v, r) => r.category === String(v) },
    { title: 'Env', dataIndex: 'environment', key: 'env', filters: [...new Set(records.map((d) => d.environment))].map((v) => ({ text: v, value: v })), onFilter: (v, r) => r.environment === String(v) },
    { title: 'Owner', dataIndex: 'support_owner', key: 'owner' },
    {
      title: 'Next Expiry',
      dataIndex: 'next_expiry_date',
      key: 'expiry',
      sorter: (a, b) => dayjs(a.next_expiry_date).unix() - dayjs(b.next_expiry_date).unix(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, rec) => rec.disabled ? <Tag>Disabled</Tag> : expiryTag(rec.expiry_days),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, rec) => (
        <Space size='small'>
          <Tooltip title='Override expiry / owner'>
            <Button type='link' size='small' icon={<EditOutlined />} onClick={() => openOverride(rec)} />
          </Tooltip>
          <Tooltip title='Clear override'>
            <Popconfirm title='Clear manual override?' onConfirm={() => overrideClear(rec.application_name, rec.environment, rec.category).then(reload)}>
              <Button type='link' size='small' icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
          <Tooltip title={rec.disabled ? 'Enable' : 'Disable'}>
            <Popconfirm
              title={rec.disabled ? 'Enable this record?' : 'Disable this record?'}
              onConfirm={() => recordDisable(rec.application_name, rec.environment, rec.category, !rec.disabled).then(reload)}
            >
              <Button type='link' size='small' icon={rec.disabled ? <PlayCircleOutlined /> : <StopOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button size='small' icon={<ReloadOutlined />} onClick={reload} loading={loading}>Refresh</Button>
      </div>
      <Table<ExpiryRecord>
        rowKey='record_key'
        columns={columns}
        dataSource={records}
        loading={loading}
        size='small'
        scroll={{ x: true }}
        rowClassName={(rec) => rec.disabled ? 'opacity-50' : ''}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />
      <Modal
        title='Override Record'
        visible={!!overrideModal}
        onOk={submitOverride}
        onCancel={() => setOverrideModal(null)}
        destroyOnClose
      >
        {overrideModal && (
          <div style={{ marginBottom: 16 }}>
            <b>{overrideModal.application_name}</b> / {overrideModal.environment} / {overrideModal.category}
          </div>
        )}
        <Form form={form} layout='vertical'>
          <Form.Item name='next_expiry_date' label='Next Expiry Date (yyyy-mm-dd)'
            rules={[{ pattern: /^\d{4}-\d{2}-\d{2}$/, message: 'Format: yyyy-mm-dd' }]}>
            <Input placeholder='2026-12-31' />
          </Form.Item>
          <Form.Item name='support_owner' label='Support Owner'>
            <Input />
          </Form.Item>
          <Form.Item name='email' label='Email'>
            <Input type='email' />
          </Form.Item>
          <Form.Item name='reason' label='Reason for override'>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default function Detail(props: Props) {
  const { data } = props;

  return (
    <Tabs defaultActiveKey='settings'>
      <Tabs.TabPane tab='Settings' key='settings'>
        <SettingsTab data={data} />
      </Tabs.TabPane>
      <Tabs.TabPane tab='Expiry Records' key='expiry'>
        <ExpiryTab datasourceId={data.id} />
      </Tabs.TabPane>
    </Tabs>
  );
}
