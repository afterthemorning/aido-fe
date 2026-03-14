import React, { useEffect, useState } from 'react';
import { Button, Col, InputNumber, Row, Space, Switch, message } from 'antd';

import { getSchedule, upsertSchedule } from './services';

interface Props {
  datasourceId?: number;
}

export default function ScheduleSettings({ datasourceId }: Props) {
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleInterval, setScheduleInterval] = useState(300);

  const loadSchedule = async () => {
    if (!datasourceId) {
      return;
    }
    setScheduleLoading(true);
    try {
      const res = await getSchedule(datasourceId);
      setScheduleEnabled(!!res.enabled);
      setScheduleInterval(res.interval_seconds || 300);
    } catch (e: any) {
      message.error(e.message || 'Load schedule failed');
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [datasourceId]);

  const saveSchedule = async () => {
    if (!datasourceId) {
      message.warning('Please save datasource first');
      return;
    }
    const interval = Math.max(30, Number(scheduleInterval) || 300);
    setScheduleSaving(true);
    try {
      const res = await upsertSchedule({
        datasource_id: datasourceId,
        enabled: scheduleEnabled,
        interval_seconds: interval,
      });
      setScheduleEnabled(!!res.enabled);
      setScheduleInterval(res.interval_seconds || interval);
      message.success('Auto import schedule saved');
    } catch (e: any) {
      message.error(e.message || 'Save schedule failed');
    } finally {
      setScheduleSaving(false);
    }
  };

  return (
    <>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}><b>Auto Import Schedule</b></Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 8 }}>
        <Col span={24}>Enabled:</Col>
        <Col span={24} className='second-color'>
          <Switch checked={scheduleEnabled} loading={scheduleLoading} onChange={setScheduleEnabled} />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 8 }}>
        <Col span={24}>Interval (seconds, min 30):</Col>
        <Col span={24} className='second-color'>
          <InputNumber
            min={30}
            step={30}
            value={scheduleInterval}
            disabled={scheduleLoading}
            onChange={(v) => setScheduleInterval(typeof v === 'number' ? v : 300)}
          />
        </Col>
      </Row>
      <div style={{ marginTop: 12 }}>
        <Space>
          <Button size='small' loading={scheduleLoading} onClick={loadSchedule}>Load Schedule</Button>
          <Button size='small' type='primary' loading={scheduleSaving} onClick={saveSchedule}>Save Schedule</Button>
        </Space>
      </div>
    </>
  );
}
