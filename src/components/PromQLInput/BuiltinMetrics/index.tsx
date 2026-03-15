import React, { useState } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { RightOutlined, DownOutlined } from '@ant-design/icons';
import { Space, Dropdown, Modal } from 'antd';
import { Record } from '@/pages/metricsBuiltin/services';
import Content from './Content';
import './style.less';

import DropdownCompat from '@/components/AntdDropdownCompat';

interface Props {
  addonClassName?: string;
  mode: 'dropdown' | 'modal';
  onSelect: (expression: string, metric: Record) => void;
}

export default function index(props: Props) {
  const { t } = useTranslation('promQLInput');
  const { mode, onSelect } = props;
  const [open, setOpen] = useState(false);

  if (mode === 'dropdown') {
    return (
      <DropdownCompat
        open={open}
        trigger={['click']}
        overlay={<Content onSelect={onSelect} setOpen={setOpen} />}
        onOpenChange={(visible) => {
          setOpen(visible);
        }}
      >
        <div className={`ant-input-group-addon ${props.addonClassName || ''}`}>
          <Space style={{ cursor: 'pointer' }}>
            <span>{t('builtinMetrics.btn')}</span>
            {open ? <DownOutlined /> : <RightOutlined />}
          </Space>
        </div>
      </DropdownCompat>
    );
  }
  return (
    <>
      <div
        className='ant-input-group-addon'
        onClick={() => {
          setOpen(true);
        }}
      >
        <Space style={{ cursor: 'pointer' }}>
          <span>{t('builtinMetrics.btn')}</span>
        </Space>
      </div>
      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
        }}
      >
        <Content onSelect={onSelect} setOpen={setOpen} />
      </Modal>
    </>
  );
}
