import React, { useState, useEffect } from 'react';
import { Tabs, Card } from 'antd';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

import PageLayout from '@/components/pageLayout';

import { getSSOConfigs } from './services';
import { SSOConfigType } from './types';
import Item, { documentMap } from './Item';
import './locale';

//@ts-ignore
import Global from 'plus:/parcels/SSOConfigs/Global';

export default function index() {
  const { t } = useTranslation('SSOConfigs');
  const [data, setData] = useState<SSOConfigType[]>([]);
  const [activeKey, setActiveKey] = useState<string>();

  useEffect(() => {
    getSSOConfigs().then((res) => {
      setData(res);
      setActiveKey(res?.[0]?.name);
    });
  }, []);

  return (
    <PageLayout title={t('title')} doc={activeKey ? documentMap[activeKey] : 'https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v8/usecase/sso/'}>
      <main className='p-4'>
        <Global SSOConfigs={data} />
        <Card
          variant='outlined'
          size='small'
          styles={{ body: { paddingTop: 2 } }}
        >
          <Tabs
            activeKey={activeKey}
            onChange={(activeKey) => {
              setActiveKey(activeKey);
            }}
            items={data.map((item) => ({
              key: item.name,
              label: t(item.name),
              children: <Item activeKey={activeKey} item={item} />,
            }))}
          />
        </Card>
      </main>
    </PageLayout>
  );
}
