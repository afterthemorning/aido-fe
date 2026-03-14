import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { Button, Col, Form, Input, Modal, Popconfirm, Row, Space, Table, Tabs, Tag, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlayCircleOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { ExpiryImportJob, ExpiryPreviewResp, ExpiryRecord, getImportJob, listImportJobs, listRecords, overrideClear, overrideUpsert, previewRecords, recordDisable, triggerImport } from '../services';
import ScheduleSettings from '@/aido-extension/expiry/ScheduleSettings';

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
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [preview, setPreview] = useState<ExpiryPreviewResp | null>(null);

  const runPreview = async () => {
    if (!data?.id) {
      message.warning('Please save datasource first');
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await previewRecords(data.id, 20);
      setPreview(res);
      setPreviewVisible(true);
    } catch (e: any) {
      message.error(e.message || 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  const previewColumns: ColumnsType<Record<string, string>> = React.useMemo(() => {
    const first = preview?.sample_rows?.[0] || {};
    return Object.keys(first).map((k) => ({
      title: k,
      dataIndex: k,
      key: k,
      ellipsis: true,
      width: 180,
    }));
  }, [preview]);


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
        <Row gutter={16} style={{ marginTop: 12 }}>
          <Col span={24}><b>Column Mapping</b></Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>Application Name:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.column.application_name`], '-')}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>Environment:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.column.environment`], '-')}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>Category:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.column.category`], '-')}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>Support Owner:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.column.support_owner`], '-')}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>Email:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.column.email`], '-')}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>Next Expiry Date:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.column.next_expiry_date`], '-')}
          </Col>
        </Row>
        <ScheduleSettings datasourceId={data?.id} />
        <div style={{ marginTop: 12 }}>
          <Space>
            <Button size='small' icon={<ReloadOutlined />} loading={previewLoading} onClick={runPreview}>Run Preview</Button>
          </Space>
        </div>
      </div>

      <Modal
        title='Expiry Data Preview'
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={1000}
      >
        <Row gutter={12}>
          <Col span={8}><b>Total Rows:</b> {preview?.total_rows ?? 0}</Col>
          <Col span={8}><b>Missing Application:</b> {preview?.missing_application ?? 0}</Col>
          <Col span={8}><b>Missing Environment:</b> {preview?.missing_environment ?? 0}</Col>
        </Row>
        <Row gutter={12} style={{ marginTop: 8 }}>
          <Col span={8}><b>Missing Category:</b> {preview?.missing_category ?? 0}</Col>
          <Col span={8}><b>Missing Next Expiry:</b> {preview?.missing_next_expiry_date ?? 0}</Col>
          <Col span={8}><b>Invalid Next Expiry:</b> {preview?.invalid_next_expiry_date ?? 0}</Col>
        </Row>
        <Row style={{ marginTop: 12 }}>
          <Col span={24} className='second-color'>
            Suggested expired rule: {preview?.suggested_rule_query || 'expiry_days < 0'}
          </Col>
        </Row>
        <Row>
          <Col span={24} className='second-color'>
            Suggested urgent rule: {preview?.suggested_urgent_query || 'expiry_days <= 7 and expiry_days >= 0'}
          </Col>
        </Row>
        <div style={{ marginTop: 12 }}>
          <Table<Record<string, string>>
            rowKey={(row, idx) => `${idx}`}
            size='small'
            columns={previewColumns}
            dataSource={preview?.sample_rows || []}
            scroll={{ x: true, y: 380 }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        </div>
      </Modal>
    </div>
  );
}

function ExpiryTab({ datasourceId }: { datasourceId: number }) {
  const [records, setRecords] = useState<ExpiryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobs, setJobs] = useState<ExpiryImportJob[]>([]);
  const [jobDetail, setJobDetail] = useState<ExpiryImportJob | null>(null);
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

  const reloadJobs = async () => {
    setJobsLoading(true);
    try {
      setJobs(await listImportJobs(datasourceId, 20));
    } catch (e: any) {
      message.error(e.message || 'Load import jobs failed');
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    reload();
    reloadJobs();
  }, [datasourceId]);

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

  const runImport = async () => {
    setImportLoading(true);
    try {
      const job = await triggerImport(datasourceId);
      message.success(`Import completed: ${job.valid_rows}/${job.total_rows} valid`);
      reload();
      reloadJobs();
    } catch (e: any) {
      message.error(e.message || 'Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  const openJobDetail = async (id: number) => {
    try {
      const job = await getImportJob(id);
      setJobDetail(job);
    } catch (e: any) {
      message.error(e.message || 'Load job detail failed');
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

  const jobColumns: ColumnsType<ExpiryImportJob> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100 },
    { title: 'Source', dataIndex: 'trigger_source', key: 'trigger_source', width: 100 },
    { title: 'Total', dataIndex: 'total_rows', key: 'total', width: 80 },
    { title: 'Valid', dataIndex: 'valid_rows', key: 'valid', width: 80 },
    { title: 'Invalid', dataIndex: 'invalid_rows', key: 'invalid', width: 80 },
    { title: 'Triggered By', dataIndex: 'triggered_by', key: 'triggered_by', width: 140 },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: number) => v ? dayjs.unix(v).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: 'Action',
      key: 'action',
      width: 90,
      render: (_, rec) => <Button type='link' size='small' onClick={() => openJobDetail(rec.id)}>Detail</Button>,
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space>
          <Button size='small' type='primary' onClick={runImport} loading={importLoading}>Run Import</Button>
          <Button size='small' icon={<ReloadOutlined />} onClick={reloadJobs} loading={jobsLoading}>Refresh Jobs</Button>
        </Space>
        <Button size='small' icon={<ReloadOutlined />} onClick={reload} loading={loading}>Refresh Records</Button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Table<ExpiryImportJob>
          rowKey='id'
          columns={jobColumns}
          dataSource={jobs}
          loading={jobsLoading}
          size='small'
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: true }}
        />
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

      <Modal
        title='Import Job Detail'
        visible={!!jobDetail}
        footer={null}
        onCancel={() => setJobDetail(null)}
      >
        {jobDetail && (
          <div>
            <Row gutter={12}><Col span={12}><b>ID:</b> {jobDetail.id}</Col><Col span={12}><b>Status:</b> {jobDetail.status}</Col></Row>
            <Row gutter={12} style={{ marginTop: 8 }}><Col span={12}><b>Total:</b> {jobDetail.total_rows}</Col><Col span={12}><b>Valid:</b> {jobDetail.valid_rows}</Col></Row>
            <Row gutter={12} style={{ marginTop: 8 }}><Col span={12}><b>Invalid:</b> {jobDetail.invalid_rows}</Col><Col span={12}><b>By:</b> {jobDetail.triggered_by || '-'}</Col></Row>
            <Row gutter={12} style={{ marginTop: 8 }}><Col span={12}><b>Source:</b> {jobDetail.trigger_source || '-'}</Col><Col span={12}><b>Started:</b> {jobDetail.started_at ? dayjs.unix(jobDetail.started_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Col></Row>
            <Row gutter={12} style={{ marginTop: 8 }}><Col span={24}><b>Finished:</b> {jobDetail.finished_at ? dayjs.unix(jobDetail.finished_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Col></Row>
            <Row gutter={12} style={{ marginTop: 8 }}><Col span={24}><b>Message:</b> {jobDetail.message || '-'}</Col></Row>
          </div>
        )}
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
