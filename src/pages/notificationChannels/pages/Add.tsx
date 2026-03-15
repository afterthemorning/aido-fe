import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

import PageLayout from '@/components/pageLayout';

import { NS } from '../constants';
import { postItems } from '../services';
import { normalizeFormValues } from '../utils/normalizeValues';
import Form from './Form';

export default function Add() {
  const { t } = useTranslation(NS);
  const navigate = useNavigate();

  return (
    <PageLayout title={t('title')} showBack backPath={`/${NS}`} doc='https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v8/usecase/media/'>
      <div className='n9e'>
        <Form
          onOk={(values) => {
            postItems([normalizeFormValues(values)]).then(() => {
              message.success(t('common:success.add'));
              navigate({
                pathname: `/${NS}`,
              });
            });
          }}
        />
      </div>
    </PageLayout>
  );
}
