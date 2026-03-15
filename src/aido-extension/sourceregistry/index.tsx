import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/pageLayout';
import './locale';
import {
  AuditQuery,
  PolicyForm,
  SourceAPIKey,
  SourceAuditEvent,
  SourceRegistry,
  UpsertSourceForm,
  addKey,
  addSource,
  getAuditEvents,
  getKeys,
  getPolicy,
  getSources,
  revokeKey,
  updatePolicy,
  updateSource,
  updateSourceStatus,
} from './services';

const { Text } = Typography;

function unixToStr(ts: number) {
  if (!ts || ts <= 0) return '-';
  return dayjs.unix(ts).format('YYYY-MM-DD HH:mm:ss');
}

function statusColor(status: string) {
  if (status === 'enabled') return 'green';
  if (status === 'disabled') return 'red';
  return 'default';
}

function keyStatusColor(status: string) {
  if (status === 'active') return 'green';
  if (status === 'revoked') return 'orange';
  if (status === 'expired') return 'red';
  return 'default';
}

// ---- Source Form Modal ----
interface SourceFormProps {
  visible: boolean;
  editRecord?: SourceRegistry;
  onClose: () => void;
  onSaved: () => void;
}

function SourceFormModal({ visible, editRecord, onClose, onSaved }: SourceFormProps) {
  const { t } = useTranslation('sourceRegistry');
  const [form] = Form.useForm<UpsertSourceForm>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      if (editRecord) {
        form.setFieldsValue({
          source_name: editRecord.source_name,
          env: editRecord.env,
          agent_type: editRecord.agent_type,
          target_datasource_id: editRecord.target_datasource_id,
          owner_team_name: editRecord.owner_team_name,
          description: editRecord.description,
        });
      }
    }
  }, [visible, editRecord, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (editRecord) {
        await updateSource(editRecord.source_id, values);
      } else {
        await addSource(values);
      }
      message.success(t('msg.save_ok'));
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!editRecord;

  return (
    <Modal
      visible={visible}
      title={isEdit ? t('btn.edit') : t('btn.add')}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout='vertical' requiredMark={false}>
        {!isEdit && (
          <Form.Item name='source_id' label={t('source.source_id')} rules={[{ required: true }]}>
            <Input placeholder='e.g. prod-nginx-01' />
          </Form.Item>
        )}
        <Form.Item name='source_name' label={t('source.source_name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name='env' label={t('source.env')} rules={[{ required: true }]}>
              <Select options={[
                { value: 'prod', label: 'prod' },
                { value: 'staging', label: 'staging' },
                { value: 'dev', label: 'dev' },
              ]} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name='agent_type' label={t('source.agent_type')} rules={[{ required: true }]}>
              <Select options={[
                { value: 'categraf', label: 'categraf' },
                { value: 'otel', label: 'otel' },
              ]} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name='target_datasource_id' label={t('source.target_datasource')} rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={1} placeholder='Datasource ID' />
        </Form.Item>
        <Form.Item name='owner_team_name' label={t('source.owner_team')}>
          <Input />
        </Form.Item>
        <Form.Item name='description' label={t('source.description')}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ---- Keys Drawer ----
interface KeysDrawerProps {
  sourceId: string | null;
  onClose: () => void;
}

function KeysDrawer({ sourceId, onClose }: KeysDrawerProps) {
  const { t } = useTranslation('sourceRegistry');
  const [keys, setKeys] = useState<SourceAPIKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [expiresDays, setExpiresDays] = useState<number | undefined>(undefined);
  const [createdKey, setCreatedKey] = useState<{ key_id: string; api_key: string } | null>(null);

  const loadKeys = useCallback(async () => {
    if (!sourceId) return;
    setLoading(true);
    try {
      const list = await getKeys(sourceId);
      setKeys(list);
    } finally {
      setLoading(false);
    }
  }, [sourceId]);

  useEffect(() => {
    if (sourceId) loadKeys();
  }, [sourceId, loadKeys]);

  const handleRevoke = async (keyId: string) => {
    await revokeKey(keyId);
    message.success(t('msg.revoke_ok'));
    loadKeys();
  };

  const handleCreateKey = async () => {
    if (!sourceId) return;
    const expiresAt = expiresDays && expiresDays > 0
      ? Math.floor(Date.now() / 1000) + expiresDays * 86400
      : 0;
    const result = await addKey(sourceId, expiresAt);
    setCreatedKey(result);
    setCreateVisible(false);
    loadKeys();
  };

  const columns: ColumnsType<SourceAPIKey> = [
    { title: t('key.key_id'), dataIndex: 'key_id', width: 220, ellipsis: true },
    {
      title: t('key.status'),
      dataIndex: 'status',
      width: 80,
      render: (v) => <Tag color={keyStatusColor(v)}>{t(`key.${v}`) || v}</Tag>,
    },
    {
      title: t('key.expires_at'),
      dataIndex: 'expires_at',
      width: 160,
      render: (v) => v > 0 ? unixToStr(v) : t('key.never'),
    },
    {
      title: t('key.last_used_at'),
      dataIndex: 'last_used_at',
      width: 160,
      render: (v) => unixToStr(v),
    },
    {
      title: t('source.actions'),
      width: 80,
      render: (_, row) => (
        row.status === 'active' ? (
          <Popconfirm title={t('btn.confirm_revoke')} onConfirm={() => handleRevoke(row.key_id)}>
            <Button type='link' danger size='small'>{t('key.revoke')}</Button>
          </Popconfirm>
        ) : null
      ),
    },
  ];

  return (
    <Drawer
      visible={!!sourceId}
      title={`${t('source.keys')}: ${sourceId}`}
      width={640}
      onClose={onClose}
      extra={
        <Button type='primary' size='small' onClick={() => { setExpiresDays(undefined); setCreateVisible(true); }}>
          {t('key.create')}
        </Button>
      }
    >
      <Table
        rowKey='key_id'
        dataSource={keys}
        columns={columns}
        loading={loading}
        size='small'
        pagination={false}
      />

      <Modal
        visible={createVisible}
        title={t('key.create')}
        onCancel={() => setCreateVisible(false)}
        onOk={handleCreateKey}
        width={400}
        destroyOnClose
      >
        <Form layout='vertical'>
          <Form.Item label={t('key.expires_days')}>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              value={expiresDays}
              onChange={(v) => setExpiresDays(v ?? undefined)}
              placeholder='30'
            />
          </Form.Item>
        </Form>
      </Modal>

      {createdKey && (
        <Modal
          visible={!!createdKey}
          title={t('key.created_api_key')}
          onOk={() => setCreatedKey(null)}
          onCancel={() => setCreatedKey(null)}
          cancelButtonProps={{ style: { display: 'none' } }}
          width={480}
        >
          <Alert type='warning' message={t('msg.created_key_note')} style={{ marginBottom: 12 }} />
          <Text copyable code style={{ wordBreak: 'break-all' }}>{createdKey.api_key}</Text>
        </Modal>
      )}
    </Drawer>
  );
}

// ---- Policy Drawer ----
interface PolicyDrawerProps {
  sourceId: string | null;
  onClose: () => void;
}

function PolicyDrawer({ sourceId, onClose }: PolicyDrawerProps) {
  const { t } = useTranslation('sourceRegistry');
  const [form] = Form.useForm<PolicyForm>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!sourceId) return;
    setLoading(true);
    try {
      const policy = await getPolicy(sourceId);
      form.setFieldsValue({
        ...policy,
        ip_allowlist: policy.ip_allowlist || [],
        required_labels: policy.required_labels || [],
        allowed_labels: policy.allowed_labels || [],
        blocked_labels: policy.blocked_labels || [],
        allowed_protocols: policy.allowed_protocols || [],
      });
    } finally {
      setLoading(false);
    }
  }, [sourceId, form]);

  useEffect(() => {
    if (sourceId) load();
    else form.resetFields();
  }, [sourceId, load, form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await updatePolicy(sourceId!, values);
      message.success(t('msg.save_ok'));
    } finally {
      setSaving(false);
    }
  };

  const tagsField = (name: keyof PolicyForm, label: string) => (
    <Form.Item name={name} label={`${label}`}>
      <Select mode='tags' style={{ width: '100%' }} placeholder={t('policy.labels_hint')} />
    </Form.Item>
  );

  return (
    <Drawer
      visible={!!sourceId}
      title={`${t('policy.title')}: ${sourceId}`}
      width={480}
      onClose={onClose}
      extra={
        <Button type='primary' size='small' loading={saving} onClick={handleSave}>
          {t('btn.save')}
        </Button>
      }
    >
      <Form form={form} layout='vertical' requiredMark={false}>
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item name='qps_limit' label={t('policy.qps_limit')} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name='burst_limit' label={t('policy.burst_limit')} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name='cardinality_limit' label={t('policy.cardinality_limit')} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        {tagsField('allowed_protocols', t('policy.allowed_protocols'))}
        {tagsField('ip_allowlist', t('policy.ip_allowlist'))}
        {tagsField('required_labels', t('policy.required_labels'))}
        {tagsField('allowed_labels', t('policy.allowed_labels'))}
        {tagsField('blocked_labels', t('policy.blocked_labels'))}
      </Form>
    </Drawer>
  );
}

// ---- Sources Tab ----
function SourcesTab() {
  const { t } = useTranslation('sourceRegistry');
  const [sources, setSources] = useState<SourceRegistry[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<SourceRegistry | undefined>();
  const [keysSourceId, setKeysSourceId] = useState<string | null>(null);
  const [policySourceId, setPolicySourceId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getSources({ limit: 200 });
      setSources(resp.list || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async (record: SourceRegistry) => {
    const next = record.status === 'enabled' ? 'disabled' : 'enabled';
    await updateSourceStatus(record.source_id, next as 'enabled' | 'disabled');
    load();
  };

  const columns: ColumnsType<SourceRegistry> = [
    { title: t('source.source_id'), dataIndex: 'source_id', width: 180, ellipsis: true },
    { title: t('source.source_name'), dataIndex: 'source_name', width: 160 },
    { title: t('source.env'), dataIndex: 'env', width: 80 },
    { title: t('source.agent_type'), dataIndex: 'agent_type', width: 100 },
    { title: t('source.target_datasource'), dataIndex: 'target_datasource_id', width: 90 },
    { title: t('source.owner_team'), dataIndex: 'owner_team_name', width: 120, ellipsis: true },
    {
      title: t('source.status'),
      dataIndex: 'status',
      width: 80,
      render: (v) => <Badge color={statusColor(v)} text={t(`status.${v}`) || v} />,
    },
    {
      title: t('source.actions'),
      width: 240,
      render: (_, record) => (
        <Space size={4}>
          <Button type='link' size='small' onClick={() => { setEditRecord(record); setFormVisible(true); }}>
            {t('btn.edit')}
          </Button>
          <Button type='link' size='small' onClick={() => setKeysSourceId(record.source_id)}>
            {t('source.keys')}
          </Button>
          <Button type='link' size='small' onClick={() => setPolicySourceId(record.source_id)}>
            {t('source.policy')}
          </Button>
          <Popconfirm
            title={record.status === 'enabled' ? t('btn.confirm_disable') : t('btn.confirm_enable')}
            onConfirm={() => handleToggleStatus(record)}
          >
            <Button type='link' size='small' danger={record.status === 'enabled'}>
              {record.status === 'enabled' ? t('status.disabled') : t('status.enabled')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button
          type='primary'
          onClick={() => { setEditRecord(undefined); setFormVisible(true); }}
        >
          {t('btn.add')}
        </Button>
      </div>
      <Table
        rowKey='source_id'
        dataSource={sources}
        columns={columns}
        loading={loading}
        size='small'
        pagination={{ pageSize: 20 }}
      />
      <SourceFormModal
        visible={formVisible}
        editRecord={editRecord}
        onClose={() => setFormVisible(false)}
        onSaved={() => { setFormVisible(false); load(); }}
      />
      <KeysDrawer sourceId={keysSourceId} onClose={() => setKeysSourceId(null)} />
      <PolicyDrawer sourceId={policySourceId} onClose={() => setPolicySourceId(null)} />
    </>
  );
}

// ---- Audit Tab ----
function AuditTab() {
  const { t } = useTranslation('sourceRegistry');
  const [events, setEvents] = useState<SourceAuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<AuditQuery>({ p: 1, limit: 20 });
  const [filters, setFilters] = useState<Pick<AuditQuery, 'source_id' | 'action' | 'result'>>({});

  const load = useCallback(async (q: AuditQuery) => {
    setLoading(true);
    try {
      const resp = await getAuditEvents(q);
      setEvents(resp.list || []);
      setTotal(resp.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load({ ...filters, ...query });
  }, [query, filters, load]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    setQuery((prev) => ({ ...prev, p: 1 }));
  };

  const resultColor: Record<string, string> = { success: 'green', deny: 'orange', error: 'red' };

  const columns: ColumnsType<SourceAuditEvent> = [
    { title: t('audit.created_at'), dataIndex: 'created_at', width: 165, render: (v) => unixToStr(v) },
    { title: t('audit.source_id'), dataIndex: 'source_id', width: 160, ellipsis: true },
    { title: t('audit.actor'), dataIndex: 'actor', width: 100, ellipsis: true },
    { title: t('audit.action'), dataIndex: 'action', width: 160 },
    {
      title: t('audit.result'),
      dataIndex: 'result',
      width: 80,
      render: (v) => <Tag color={resultColor[v] || 'default'}>{v}</Tag>,
    },
    { title: t('audit.reason'), dataIndex: 'reason', ellipsis: true },
    { title: t('audit.request_ip'), dataIndex: 'request_ip', width: 130 },
  ];

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Input
          allowClear
          placeholder={t('audit.source_id')}
          style={{ width: 180 }}
          onChange={(e) => handleFilterChange('source_id', e.target.value)}
        />
        <Input
          allowClear
          placeholder={t('audit.action')}
          style={{ width: 160 }}
          onChange={(e) => handleFilterChange('action', e.target.value)}
        />
        <Select
          allowClear
          placeholder={t('audit.result')}
          style={{ width: 120 }}
          options={[
            { value: 'success', label: t('audit.result_success') },
            { value: 'deny', label: t('audit.result_deny') },
            { value: 'error', label: t('audit.result_error') },
          ]}
          onChange={(v) => handleFilterChange('result', v || '')}
        />
      </Space>
      <Table
        rowKey='id'
        dataSource={events}
        columns={columns}
        loading={loading}
        size='small'
        pagination={{
          total,
          current: query.p,
          pageSize: query.limit,
          onChange: (p, limit) => setQuery({ p, limit }),
        }}
      />
    </>
  );
}

// ---- Main Page ----
export default function SourceRegistryPage() {
  const { t } = useTranslation('sourceRegistry');
  const { TabPane } = Tabs;

  return (
    <PageLayout title={t('title')}>
      <div style={{ padding: 16 }}>
        <Tabs>
          <TabPane key='sources' tab={t('tabs.sources')}>
            <SourcesTab />
          </TabPane>
          <TabPane key='audit' tab={t('tabs.audit')}>
            <AuditTab />
          </TabPane>
        </Tabs>
      </div>
    </PageLayout>
  );
}
