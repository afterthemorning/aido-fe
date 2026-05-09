import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { Spin, message } from 'antd';
import _ from 'lodash';

import PageLayout from '@/components/pageLayout';

import { NS, CN } from '../constants';
import { getItem, putItem, RuleItem, postItems } from '../services';
import { normalizeInitialValues } from '../utils/normalizeValues';
import Form from './Form';

export default function Add() {
  const { t } = useTranslation(NS);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { search } = useLocation();
  const { mode } = queryString.parse(search);
  const [data, setData] = useState<RuleItem>();

  useEffect(() => {
    if (id) {
      getItem(_.toNumber(id)).then((res) => {
        setData(normalizeInitialValues(res));
      });
    }
  }, []);

  return (
    <PageLayout title={t('title')} showBack backPath={`/${NS}`} doc='https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v8/quickstart/notify-rules/'>
      <div className={`aido ${CN}`}>
        {data ? (
          <Form
            initialValues={data}
            onOk={(values) => {
              if (mode === 'clone') {
                postItems([_.omit(values, ['id']) as RuleItem]).then(() => {
                  message.success(t('common:success.add'));
                  navigate({
                    pathname: `/${NS}`,
                  });
                });
              } else {
                putItem(values).then(() => {
                  message.success(t('common:success.add'));
                  navigate({
                    pathname: `/${NS}`,
                  });
                });
              }
            }}
          />
        ) : (
          <div>
            <Spin spinning />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
