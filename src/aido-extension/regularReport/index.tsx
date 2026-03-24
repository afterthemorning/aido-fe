import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button, Drawer, Form, Input, InputNumber, Modal, Select, Space, Spin, Table, Tag, Typography, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { CommonStateContext } from '@/App';
import PageLayout from '@/components/pageLayout';
import Page403 from '@/pages/notFound/Page403';
import {
  approveReport,
  bindPolicyNotifyRule,
  cancelScheduledSend,
  getReportHistory,
  getReportRevisions,
  getSendSchedule,
  RegularReportItem,
  RevisionItem,
  revokeReport,
  SendScheduleItem,
  undoRevokeReport,
  updateReportContent,
} from './services';
import { canApproveStatus, canCancelSendStatus, canRevokeStatus, canUndoStatus, filterReportsByKeyword } from './utils';
import './locale';

const { Text } = Typography;

type EditedFilter = 'all' | 'yes' | 'no';

function getErrorMessage(err: unknown, fallback: string) {
  if (typeof err === 'object' && err && 'message' in err) {
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return fallback;
}

function formatUnix(ts?: number) {
  if (!ts || ts <= 0) return '-';
  return dayjs.unix(ts).format('YYYY-MM-DD HH:mm:ss');
}

function statusColor(status: string) {
  switch (status) {
    case 'approved_waiting_send':
      return 'processing';
    case 'pending_review':
      return 'warning';
    case 'published':
      return 'success';
    case 'revoked':
      return 'error';
    case 'send_canceled':
      return 'default';
    default:
      return 'default';
  }
}

export default function RegularReport() {
  const { t } = useTranslation('regularReport');
  const [form] = Form.useForm<{ notify_rule_id?: number; send_delay_seconds?: number }>();
  const [bindForm] = Form.useForm<{ notify_rule_id: number }>();
  const [editForm] = Form.useForm<{ brief_content?: string; markdown_content?: string; html_content?: string; change_comment: string }>();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<RegularReportItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [editedFilter, setEditedFilter] = useState<EditedFilter>('all');
  const [search, setSearch] = useState('');
  const { perms } = useContext(CommonStateContext);

  const [approveTarget, setApproveTarget] = useState<RegularReportItem | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  const [bindTarget, setBindTarget] = useState<RegularReportItem | null>(null);
  const [bindLoading, setBindLoading] = useState(false);

  const [editTarget, setEditTarget] = useState<RegularReportItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSeedLoading, setEditSeedLoading] = useState(false);

  const [revisionTarget, setRevisionTarget] = useState<RegularReportItem | null>(null);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);

  const [scheduleTarget, setScheduleTarget] = useState<RegularReportItem | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [schedule, setSchedule] = useState<SendScheduleItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string; edited?: boolean } = {};
      if (statusFilter) params.status = statusFilter;
      if (editedFilter === 'yes') params.edited = true;
      if (editedFilter === 'no') params.edited = false;
      const data = await getReportHistory(params);
      setList(data?.list || []);
    } catch (err: unknown) {
      message.error(getErrorMessage(err, t('msg.load_failed')));
    } finally {
      setLoading(false);
    }
  }, [editedFilter, statusFilter, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (fn: () => Promise<unknown>, okMsg: string) => {
    try {
      await fn();
      message.success(okMsg);
      loadData();
    } catch (err: unknown) {
      message.error(getErrorMessage(err, t('msg.action_failed')));
    }
  };

  const openApprove = (row: RegularReportItem) => {
    setApproveTarget(row);
    form.setFieldsValue({
      notify_rule_id: row.notify_rule_id,
      send_delay_seconds: 0,
    });
  };

  const openBind = (row: RegularReportItem) => {
    setBindTarget(row);
    bindForm.setFieldsValue({ notify_rule_id: row.notify_rule_id || 0 });
  };

  const submitBind = async () => {
    if (!bindTarget) return;
    const values = await bindForm.validateFields();
    setBindLoading(true);
    try {
      await bindPolicyNotifyRule(bindTarget.policy_id, values.notify_rule_id);
      message.success(t('msg.bind_ok'));
      setBindTarget(null);
      loadData();
    } catch (err: unknown) {
      message.error(getErrorMessage(err, t('msg.action_failed')));
    } finally {
      setBindLoading(false);
    }
  };

  const openEdit = async (row: RegularReportItem) => {
    setEditTarget(row);
    setEditSeedLoading(true);
    try {
      const revs = await getReportRevisions(row.id);
      const latest = revs && revs.length > 0 ? revs[revs.length - 1] : null;
      editForm.setFieldsValue({
        brief_content: latest?.brief_content || '',
        markdown_content: latest?.markdown_content || '',
        html_content: latest?.html_content || '',
        change_comment: '',
      });
    } catch (err: unknown) {
      message.error(getErrorMessage(err, t('msg.load_revisions_failed')));
      editForm.setFieldsValue({
        brief_content: '',
        markdown_content: '',
        html_content: '',
        change_comment: '',
      });
    } finally {
      setEditSeedLoading(false);
    }
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    const values = await editForm.validateFields();
    setEditLoading(true);
    try {
      await updateReportContent(editTarget.id, values);
      message.success(t('msg.edit_ok'));
      setEditTarget(null);
      loadData();
    } catch (err: unknown) {
      message.error(getErrorMessage(err, t('msg.action_failed')));
    } finally {
      setEditLoading(false);
    }
  };

  const submitApprove = async () => {
    if (!approveTarget) return;
    const values = await form.validateFields();
    setApproveLoading(true);
    try {
      await approveReport(approveTarget.id, {
        notify_rule_id: values.notify_rule_id,
        send_delay_seconds: values.send_delay_seconds,
      });
      message.success(t('msg.approve_ok'));
      setApproveTarget(null);
      loadData();
    } catch (err: unknown) {
      message.error(getErrorMessage(err, t('msg.action_failed')));
    } finally {
      setApproveLoading(false);
    }
  };

  const openRevisions = async (row: RegularReportItem) => {
    setRevisionTarget(row);
    setRevisionLoading(true);
    try {
      const data = await getReportRevisions(row.id);
      setRevisions(data || []);
    } catch (err: unknown) {
      message.error(getErrorMessage(err, t('msg.load_revisions_failed')));
      setRevisions([]);
    } finally {
      setRevisionLoading(false);
    }
  };

  const openSchedule = async (row: RegularReportItem) => {
    setScheduleTarget(row);
    setScheduleLoading(true);
    try {
      const data = await getSendSchedule(row.id);
      setSchedule(data || null);
    } catch (err: unknown) {
      message.error(getErrorMessage(err, t('msg.load_schedule_failed')));
      setSchedule(null);
    } finally {
      setScheduleLoading(false);
    }
  };

  const statusOptions = useMemo(
    () => [
      'draft',
      'pending_review',
      'approved_waiting_send',
      'published',
      'revoked',
      'send_canceled',
    ],
    [],
  );

  const listFilteredByKeyword = useMemo(() => {
    return filterReportsByKeyword(list, search);
  }, [list, search]);

  const revisionColumns: ColumnsType<RevisionItem> = [
    { title: t('revision.revision_id'), dataIndex: 'revision_id', width: 90 },
    { title: t('revision.editor'), dataIndex: 'editor', width: 120, ellipsis: true },
    {
      title: t('revision.edited_at'),
      dataIndex: 'edited_at',
      width: 170,
      render: (ts: number) => formatUnix(ts),
    },
    { title: t('revision.change_comment'), dataIndex: 'change_comment' },
  ];

  const columns: ColumnsType<RegularReportItem> = [
    {
      title: t('table.id'),
      dataIndex: 'id',
      width: 90,
    },
    {
      title: t('table.policy_id'),
      dataIndex: 'policy_id',
      width: 100,
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      width: 180,
      render: (status: string) => <Tag color={statusColor(status)}>{t(`status.${status}`) || status}</Tag>,
    },
    {
      title: t('table.edited'),
      dataIndex: 'edited',
      width: 90,
      render: (edited: boolean) => (edited ? t('common.yes') : t('common.no')),
    },
    {
      title: t('table.last_action_by'),
      dataIndex: 'last_action_by',
      width: 140,
      ellipsis: true,
    },
    {
      title: t('table.last_action_at'),
      dataIndex: 'last_action_at',
      width: 180,
      render: (ts: number) => formatUnix(ts),
    },
    {
      title: t('table.scheduled_send_at'),
      dataIndex: 'scheduled_send_at',
      width: 180,
      render: (ts: number) => formatUnix(ts),
    },
    {
      title: t('table.actions'),
      key: 'actions',
      width: 460,
      fixed: 'right',
      render: (_, row) => (
        <Space size={4} wrap>
          <Button size='small' disabled={!canApproveStatus(row.status)} onClick={() => openApprove(row)}>
            {t('actions.approve')}
          </Button>
          <Button size='small' onClick={() => openBind(row)}>
            {t('actions.bind_notify_rule')}
          </Button>
          <Button size='small' onClick={() => openEdit(row)}>
            {t('actions.edit_content')}
          </Button>
          <Button size='small' disabled={!canRevokeStatus(row.status)} onClick={() => handleAction(() => revokeReport(row.id), t('msg.revoke_ok'))}>
            {t('actions.revoke')}
          </Button>
          <Button size='small' disabled={!canUndoStatus(row.status)} onClick={() => handleAction(() => undoRevokeReport(row.id), t('msg.undo_ok'))}>
            {t('actions.undo')}
          </Button>
          <Button size='small' disabled={!canCancelSendStatus(row.status)} onClick={() => handleAction(() => cancelScheduledSend(row.id), t('msg.cancel_ok'))}>
            {t('actions.cancel_send')}
          </Button>
          <Button size='small' onClick={() => openRevisions(row)}>
            {t('actions.revisions')}
          </Button>
          <Button size='small' onClick={() => openSchedule(row)}>
            {t('actions.schedule')}
          </Button>
        </Space>
      ),
    },
  ];

  if (!_.includes(perms, '/regular-report')) {
    return <Page403 />;
  }

  return (
    <PageLayout title={t('title')}>
      <div className='fc-border alert-rules-list-container' style={{ height: '100%', overflowY: 'auto' }}>
        <div className='mb-2 flex items-center justify-between gap-2 px-3 pt-3'>
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              placeholder={t('filters.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              allowClear
              style={{ width: 220 }}
              placeholder={t('filters.status')}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              options={statusOptions.map((status) => ({ value: status, label: t(`status.${status}`) }))}
            />
            <Select
              style={{ width: 180 }}
              value={editedFilter}
              onChange={(v) => setEditedFilter(v)}
              options={[
                { value: 'all', label: t('filters.edited_all') },
                { value: 'yes', label: t('filters.edited_yes') },
                { value: 'no', label: t('filters.edited_no') },
              ]}
            />
          </Space>
          <Button onClick={loadData}>{t('actions.refresh')}</Button>
        </div>
        <Table
          rowKey='id'
          loading={loading}
          dataSource={listFilteredByKeyword}
          columns={columns}
          pagination={{ pageSize: 20 }}
          size='small'
          scroll={{ x: 1450 }}
        />
      </div>

      <Modal
        open={!!approveTarget}
        title={t('approve.title')}
        onCancel={() => setApproveTarget(null)}
        onOk={submitApprove}
        confirmLoading={approveLoading}
        destroyOnHidden
      >
        <Form layout='vertical' form={form}>
          <Form.Item name='notify_rule_id' label={t('approve.notify_rule_id')}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name='send_delay_seconds' label={t('approve.send_delay_seconds')}>
            <InputNumber min={0} max={604800} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!bindTarget}
        title={t('bind.title')}
        onCancel={() => setBindTarget(null)}
        onOk={submitBind}
        confirmLoading={bindLoading}
        destroyOnHidden
      >
        <Form layout='vertical' form={bindForm}>
          <Form.Item name='notify_rule_id' label={t('bind.notify_rule_id')} rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!editTarget}
        title={t('edit.title')}
        onCancel={() => setEditTarget(null)}
        onOk={submitEdit}
        confirmLoading={editLoading || editSeedLoading}
        destroyOnHidden
      >
        <Form layout='vertical' form={editForm}>
          <Form.Item name='brief_content' label={t('edit.brief_content')}>
            <Input placeholder={t('edit.brief_placeholder')} />
          </Form.Item>
          <Form.Item name='markdown_content' label={t('edit.markdown_content')}>
            <Input.TextArea rows={4} placeholder={t('edit.markdown_placeholder')} />
          </Form.Item>
          <Form.Item name='html_content' label={t('edit.html_content')}>
            <Input.TextArea rows={4} placeholder={t('edit.html_placeholder')} />
          </Form.Item>
          <Form.Item name='change_comment' label={t('edit.change_comment')} rules={[{ required: true }]}>
            <Input placeholder={t('edit.comment_placeholder')} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        open={!!revisionTarget}
        title={t('revision.title')}
        width={760}
        onClose={() => {
          setRevisionTarget(null);
          setRevisions([]);
        }}
        destroyOnClose
      >
        <Table rowKey='revision_id' loading={revisionLoading} dataSource={revisions} columns={revisionColumns} pagination={{ pageSize: 10 }} />
      </Drawer>

      <Modal
        open={!!scheduleTarget}
        title={t('schedule.title')}
        onCancel={() => {
          setScheduleTarget(null);
          setSchedule(null);
        }}
        footer={null}
        destroyOnHidden
      >
        {scheduleLoading ? (
          <div className='py-6 text-center'>
            <Spin size='small' />
          </div>
        ) : (
          <Space direction='vertical' size={8}>
            <div>
              <Text type='secondary'>{t('schedule.status')}</Text>: {t(`status.${schedule?.status || ''}`) || schedule?.status || '-'}
            </div>
            <div>
              <Text type='secondary'>{t('schedule.notify_rule_id')}</Text>: {schedule?.notify_rule_id ?? '-'}
            </div>
            <div>
              <Text type='secondary'>{t('schedule.allow_cancel_during_delay')}</Text>: {schedule?.allow_cancel_during_delay ? t('common.yes') : t('common.no')}
            </div>
            <div>
              <Text type='secondary'>{t('schedule.require_reapprove_after_edit')}</Text>: {schedule?.require_reapprove_after_edit ? t('common.yes') : t('common.no')}
            </div>
            <div>
              <Text type='secondary'>{t('schedule.scheduled_send_at')}</Text>: {formatUnix(schedule?.scheduled_send_at)}
            </div>
            <div>
              <Text type='secondary'>{t('schedule.remaining_seconds')}</Text>: {schedule?.remaining_seconds ?? '-'}
            </div>
            <div>
              <Text type='secondary'>{t('schedule.current_revision_id')}</Text>: {schedule?.current_revision_id ?? '-'}
            </div>
          </Space>
        )}
      </Modal>
    </PageLayout>
  );
}
