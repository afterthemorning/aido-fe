import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Popover, Space, InputNumber, Tooltip, Form } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import moment from 'moment';

import FieldGroupV2 from '@/components/FieldGroupV2';
import TimeRangePicker, { isMathString } from '@/components/TimeRangePicker';

interface Props {
  panelWidth?: number;
}

export default function QueryOptions({ panelWidth }: Props) {
  const { t } = useTranslation('dashboard');
  const content = (
    <div>
      <FieldGroupV2
        label={
          <Space>
            {t('query.options_max_data_points')}
            <Tooltip title={t('query.options_max_data_points_tip')}>
              <InfoCircleOutlined />
            </Tooltip>
          </Space>
        }
      >
        <Form.Item
          name={['maxDataPoints']}
          trigger='onBlur'
          validateTrigger='onBlur'
          getValueFromEvent={(e) => {
            const raw = e.target.value;
            if (raw === '' || raw === undefined || raw === null) return undefined;
            const num = Number(raw);
            return Number.isFinite(num) ? num : undefined;
          }}
        >
          <InputNumber className='w-full' placeholder={_.toString(panelWidth ?? 240)} min={1} />
        </Form.Item>
      </FieldGroupV2>
      <FieldGroupV2
        label={
          <Space>
            {t('query.options_time')}
            <Tooltip title={t('query.options_time_tip')}>
              <InfoCircleOutlined />
            </Tooltip>
          </Space>
        }
      >
        <Form.Item
          name={['queryOptionsTime']}
          normalize={(val) => {
            if (val === undefined || val === null || val === '') return undefined;
            return {
              start: isMathString(val.start) ? val.start : moment(val.start).format('YYYY-MM-DD HH:mm:ss'),
              end: isMathString(val.end) ? val.end : moment(val.end).format('YYYY-MM-DD HH:mm:ss'),
            };
          }}
        >
          <TimeRangePicker style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }} dateFormat='YYYY-MM-DD HH:mm:ss' allowClear />
        </Form.Item>
      </FieldGroupV2>
    </div>
  );

  return (
    <>
      <div className='hidden'>{content}</div>
      <Popover trigger='click' placement='bottom' title={t('query.options')} content={content}>
        <Button>{t('query.options')}</Button>
      </Popover>
    </>
  );
}
