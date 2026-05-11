/*
 * Copyright 2026 AIDO Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import React, { useState, useContext } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Select, Result, Space, Button } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import PageLayout, { HelpLink } from '@/components/pageLayout';
import { IRawTimeRange } from '@/components/TimeRangePicker';
import { CommonStateContext } from '@/App';
import { getDefaultDatasourceValue, setDefaultDatasourceValue } from '@/utils';
import { DatasourceCateEnum, IS_ENT } from '@/utils/constant';
import { IMatch } from './types';
import List from './metricViews/List';
import LabelsValues from './metricViews/LabelsValues';
import Metrics from './metricViews/Metrics';
import './locale';
import './style.less';

export default function index() {
  const { t } = useTranslation('objectExplorer');
  const [match, setMatch] = useState<IMatch>();
  const [range, setRange] = useState<IRawTimeRange>({
    start: 'now-1h',
    end: 'now',
  });
  const { groupedDatasourceList, profile } = useContext(CommonStateContext);
  const metricDatasourceCates = [DatasourceCateEnum.prometheus, DatasourceCateEnum.aidoUptimeKuma];
  const datasources = _.flatMap(metricDatasourceCates, (cate) => groupedDatasourceList[cate] || []);
  const getInitialDatasourceValue = () => {
    for (const cate of metricDatasourceCates) {
      const value = getDefaultDatasourceValue(cate, groupedDatasourceList);
      if (_.find(datasources, { id: value })) {
        return value;
      }
    }
    return _.get(datasources, '[0].id');
  };
  const [datasourceValue, setDatasourceValue] = useState<number | undefined>(getInitialDatasourceValue());
  const isAdmin = _.includes(profile?.roles, 'Admin');
  const datasourceConfigUrl = IS_ENT ? '/settings/datasource/add/prometheus' : '/datasources/add/prometheus';

  if (!datasourceValue) {
    return (
      <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Result
          title={t('common:datasource.empty_modal.title')}
          subTitle={t('empty.subtitle')}
          extra={
            <Space orientation='vertical' size={8}>
              {isAdmin ? (
                <Link to={datasourceConfigUrl}>
                  <Button type='primary'>{t('common:datasource.empty_modal.btn1')}</Button>
                </Link>
              ) : (
                <span>{t('empty.contact_admin')}</span>
              )}
              <span>
                {t('empty.path_label')}: <strong>{datasourceConfigUrl}</strong>
              </span>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <PageLayout
      title={<Space>{t('title')}</Space>}
      icon={<LineChartOutlined />}
      doc='https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v7/usage/time-series/quick-view/'
      rightArea={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {t('common:datasource.name')}：
          <Select
            popupMatchSelectWidth={false}
            value={datasourceValue}
            onChange={(val) => {
              setDatasourceValue(val);
              const datasource = _.find(datasources, { id: val });
              if (datasource?.plugin_type) {
                setDefaultDatasourceValue(datasource.plugin_type, _.toString(val));
              }
              setMatch(undefined);
            }}
          >
            {_.map(datasources, (item) => {
              return (
                <Select.Option key={item.id} value={item.id}>
                  {item.name}
                </Select.Option>
              );
            })}
          </Select>
        </div>
      }
    >
      <div className='aido-metric-views'>
        <List
          datasourceValue={datasourceValue}
          onSelect={(record: IMatch) => {
            setMatch(record);
          }}
          range={range}
        />
        {match ? (
          <>
            <LabelsValues
              datasourceValue={datasourceValue}
              range={range}
              value={match}
              onChange={(val) => {
                setMatch(val);
              }}
            />
            <Metrics datasourceValue={datasourceValue} range={range} setRange={setRange} match={match} />
          </>
        ) : null}
      </div>
    </PageLayout>
  );
}
