import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Tooltip, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, StopOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { getDatasourceBriefList } from '@/services/common';
import { ExpiryRecord, listRecords, overrideClear, overrideUpsert, recordDisable } from './services';

const { Title } = Typography;

function expiryTag(days: number) {
  if (days < 0) return <Tag color='red'>Expired</Tag>;
  if (days <= 7) return <Tag color='orange'>≤7 days</Tag>;
  if (days <= 30) return <Tag color='gold'>≤30 days</Tag>;
  return <Tag color='green'>OK</Tag>;
}

export default function ExpiryReminder() {
  const [data, setData] = useState<ExpiryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [overrideModal, setOverrideModal] = useState<ExpiryRecord | null>(null);
  const [form] = Form.useForm();
  const [datasources, setDatasources] = useState<{ id: number; name: string }[]>([]);
  const [datasourceId, setDatasourceId] = useState<number | undefined>();

  useEffect(() => {
    getDatasourceBriefList().then((list) => {
      const excel = list.filter((d) => d.plugin_type === 'aido-excel');
      setDatasources(excel);
      if (excel.length === 1) setDatasourceId(excel[0].id);
    });
  }, []);

  const reload = async () => {
    if (!datasourceId) return;
    setLoading(true);
    try {
      setData(await listRecords(datasourceId));
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

  const handleClear = async (rec: ExpiryRecord) => {
    try {
      await overrideClear(rec.application_name, rec.environment, rec.category);
      message.success('Override cleared');
      reload();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleToggleDisable = async (rec: ExpiryRecord) => {
    try {
      await recordDisable(rec.application_name, rec.environment, rec.category, !rec.disabled);
      message.success(rec.disabled ? 'Record enabled' : 'Record disabled');
      reload();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const columns: ColumnsType<ExpiryRecord> = [
    { title: 'Application', dataIndex: 'application_name', key: 'app', sorter: (a, b) => a.application_name.localeCompare(b.application_name) },
    { title: 'Category', dataIndex: 'category', key: 'cat', filters: [...new Set(data.map((d) => d.category))].map((v) => ({ text: v, value: v })), onFilter: (v, r) => r.category === v },
    { title: 'Environment', dataIndex: 'environment', key: 'env', filters: [...new Set(data.map((d) => d.environment))].map((v) => ({ text: v, value: v })), onFilter: (v, r) => r.environment === v },
    { title: 'Owner', dataIndex: 'support_owner', key: 'owner' },
    {
      title: 'Next Expiry',
      dataIndex: 'next_expiry_date',
      key: 'expiry',
      sorter: (a, b) => dayjs(a.next_expiry_date).unix() - dayjs(b.next_expiry_date).unix(),
      render: (val) => val,
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
          <Tooltip title='Clear override (restore raw)'>
            <Popconfirm title='Clear manual override?' onConfirm={() => handleClear(rec)}>
              <Button type='link' size='small' icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
          <Tooltip title={rec.disabled ? 'Enable' : 'Disable'}>
            <Popconfirm title={rec.disabled ? 'Enable this record?' : 'Disable this record?'} onConfirm={() => handleToggleDisable(rec)}>
              <Button type='link' size='small' icon={rec.disabled ? <PlayCircleOutlined /> : <StopOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Expiry Reminder</Title>
        <Space>
          {datasources.length > 1 && (
            <Select
              style={{ width: 200 }}
              placeholder='Select Excel datasource'
              value={datasourceId}
              onChange={setDatasourceId}
              options={datasources.map((d) => ({ label: d.name, value: d.id }))}
            />
          )}
          <Button icon={<ReloadOutlined />} onClick={reload} loading={loading} disabled={!datasourceId}>Refresh</Button>
        </Space>
      </div>

      <Table<ExpiryRecord>
        rowKey='record_key'
        columns={columns}
        dataSource={data}
        loading={loading}
        size='small'
        rowClassName={(rec) => rec.disabled ? 'opacity-50' : ''}
        pagination={{ pageSize: 20, showSizeChanger: true }}
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
    </div>
  );
}
