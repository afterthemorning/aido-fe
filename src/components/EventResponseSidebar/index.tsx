import React, { useEffect, useState, useCallback } from 'react';
import { Drawer, Descriptions, Tag, Button, Space, Input, message, Spin, Timeline, Typography, Divider, Popconfirm } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, UserOutlined, MessageOutlined, HistoryOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ackEvents, getEventById } from '@/pages/alertCurEvent/services';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface AlertEvent {
  id: number;
  rule_name?: string;
  rule_id?: number;
  cate?: string;
  severity?: number;
  status?: number;
  tags?: Array<{ key: string; value: string }>;
  trigger_time?: number;
  trigger_value?: string;
  target_ident?: string;
  datasource_name?: string;
  claim_user?: string;
  note?: string;
  [key: string]: any;
}

interface Props {
  eventId: number | null;
  onClose: () => void;
}

const severityMap: Record<number, { label: string; color: string }> = {
  1: { label: 'S1 Critical', color: 'red' },
  2: { label: 'S2 Warning', color: 'orange' },
  3: { label: 'S3 Info', color: 'yellow' },
};

export default function EventResponseSidebar({ eventId, onClose }: Props) {
  const [event, setEvent] = useState<AlertEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const resp = await getEventById(eventId);
      setEvent(resp?.dat || null);
    } catch {
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { if (eventId) { loadEvent(); setNoteText(''); } }, [eventId, loadEvent]);

  const doAction = async (action: string, successMsg: string) => {
    if (!eventId) return;
    setActionLoading(action);
    try {
      await ackEvents([eventId], action);
      message.success(successMsg);
      loadEvent();
    } catch (e: any) {
      message.error(e.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddNote = async () => {
    if (!eventId || !noteText.trim()) return;
    setActionLoading('note');
    try {
      await ackEvents([eventId], 'note');
      message.success('Note added');
      setNoteText('');
      loadEvent();
    } catch (e: any) {
      message.error(e.message || 'Failed to add note');
    } finally {
      setActionLoading(null);
    }
  };

  const sev = event?.severity ? severityMap[event.severity] : null;
  const isClaimed = !!event?.claim_user;

  return (
    <Drawer
      open={!!eventId}
      title={event ? `Event #${event.id}` : 'Event Detail'}
      width={520}
      onClose={onClose}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
      ) : !event ? (
        <Text type="secondary">Event not found</Text>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ margin: 0 }}>{event.rule_name || 'Alert Rule'}</Title>
              {sev && <Tag color={sev.color} style={{ marginTop: 4 }}>{sev.label}</Tag>}
            </div>
            <div>
              {!isClaimed ? (
                <Button
                  type="primary"
                  size="small"
                  icon={<UserOutlined />}
                  loading={actionLoading === 'claim'}
                  onClick={() => doAction('claim', 'Event claimed')}
                >
                  Claim
                </Button>
              ) : (
                <Tag icon={<UserOutlined />} color="blue">{event.claim_user}</Tag>
              )}
            </div>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* Details */}
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Rule ID">{event.rule_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="Category">{event.cate || '-'}</Descriptions.Item>
            <Descriptions.Item label="Trigger Value">{event.trigger_value || '-'}</Descriptions.Item>
            <Descriptions.Item label="Target">{event.target_ident || '-'}</Descriptions.Item>
            <Descriptions.Item label="Datasource">{event.datasource_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Triggered">
              {event.trigger_time ? dayjs.unix(event.trigger_time).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Tags</Text>
              <Space wrap size={4}>
                {event.tags.map((t, i) => (
                  <Tag key={i}>{t.key}={t.value}</Tag>
                ))}
              </Space>
            </div>
          )}

          {/* Actions */}
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Actions</Text>
            <Space wrap>
              {!isClaimed ? (
                <Button icon={<ThunderboltOutlined />} size="small" loading={actionLoading === 'ack'} onClick={() => doAction('ack', 'Event acknowledged')}>
                  Acknowledge
                </Button>
              ) : (
                <>
                  <Popconfirm title="Resolve this event?" onConfirm={() => doAction('resolve', 'Event resolved')}>
                    <Button size="small" icon={<CheckCircleOutlined />} loading={actionLoading === 'resolve'}>
                      Resolve
                    </Button>
                  </Popconfirm>
                  <Popconfirm title="Close this event?" onConfirm={() => doAction('close', 'Event closed')}>
                    <Button size="small" danger icon={<CloseCircleOutlined />} loading={actionLoading === 'close'}>
                      Close
                    </Button>
                  </Popconfirm>
                </>
              )}
            </Space>
          </div>

          {/* Notes */}
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              <MessageOutlined style={{ marginRight: 4 }} />Notes
            </Text>
            <Space.Compact style={{ width: '100%' }}>
              <TextArea rows={2} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..." />
              <Button type="primary" loading={actionLoading === 'note'} onClick={handleAddNote} style={{ height: 'auto' }}>
                Add
              </Button>
            </Space.Compact>
          </div>

          {/* Timeline */}
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              <HistoryOutlined style={{ marginRight: 4 }} />Timeline
            </Text>
            <Timeline
              items={[
                { color: 'red', children: <Text style={{ fontSize: 12 }}>Triggered at {event.trigger_time ? dayjs.unix(event.trigger_time).format('YYYY-MM-DD HH:mm:ss') : '-'}</Text> },
                ...(isClaimed ? [{ color: 'blue', children: <Text style={{ fontSize: 12 }}>Claimed by {event.claim_user}</Text> }] : []),
              ]}
            />
          </div>
        </Space>
      )}
    </Drawer>
  );
}
