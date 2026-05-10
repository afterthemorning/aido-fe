import React, { useState, useEffect, useRef } from 'react';
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

/** 前端保证始终显示的 SSO 配置类型（即使后端未返回） */
const FALLBACK_TYPES: SSOConfigType[] = [
  {
    id: 0,
    name: 'azure',
    content: '',
    setting: {
      enable: false,
      display_name: 'Azure AD',
      tenant_id: '',
      client_id: '',
      client_secret: '',
      cover_attributes: true,
      username_field: 'email',
      default_roles: [],
      authority: 'https://login.microsoftonline.com/common',
      scopes: 'openid,profile,email',
      proxy: '',
    },
  },
];

export default function index() {
  const { t } = useTranslation('SSOConfigs');
  const [data, setData] = useState<SSOConfigType[]>([]);
  const [activeKey, setActiveKey] = useState<string>();
  const initialDataLoaded = useRef(false);

  useEffect(() => {
    getSSOConfigs().then((res) => {
      const existingNames = new Set(_.map(res, 'name'));
      // 补充前端定义但后端未返回的 fallback 类型
      const supplemented = [...res];
      FALLBACK_TYPES.forEach((fb) => {
        if (!existingNames.has(fb.name)) {
          supplemented.push(fb);
        }
      });
      setData(supplemented);
      if (!initialDataLoaded.current) {
        setActiveKey(supplemented?.[0]?.name);
        initialDataLoaded.current = true;
      }
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
