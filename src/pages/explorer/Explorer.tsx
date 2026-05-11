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
/**
 * querystring
 * data_source_name: string
 * data_source_id: string
 */
import React, { useRef, useContext, useEffect } from 'react';
import { Form, Row, Col } from 'antd';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { DatasourceSelectV3 } from '@/components/DatasourceSelect';
import FieldGroupV2 from '@/components/FieldGroupV2';
import { DatasourceCateEnum, IS_PLUS } from '@/utils/constant';
import { getDefaultDatasourceValue, setDefaultDatasourceValue } from '@/utils';
import { CommonStateContext } from '@/App';
import { Explorer as TDengine } from '@/plugins/TDengine';
import { Explorer as CK } from '@/plugins/clickHouse';
import AidoExcelExplorer from '@/aido-extension/expiry/Explorer';
import UptimeKumaExplorer from '@/aido-extension/uptimeKuma/Explorer';
import { allCates } from '@/components/AdvancedWrap/utils';
// import ViewSelect from '@/components/ViewSelect';

import { useGlobalState } from './globalState';
import Prometheus from './Prometheus';
import Elasticsearch from './Elasticsearch';
import Loki from './Loki';
import Help from './components/Help';
import './index.less';

// @ts-ignore
import PlusExplorer from 'plus:/parcels/Explorer';

type Type = 'logging' | 'metric';

const PROMQL_CATES = [DatasourceCateEnum.prometheus, DatasourceCateEnum.aidoUptimeKuma];

interface IProps {
  tabKey: string;
  type: Type;
  defaultCate: string;
  panelIdx?: number;
  defaultFormValuesControl?: {
    isInited?: boolean;
    setIsInited: () => void;
    defaultFormValues?: any;
    setDefaultFormValues?: (query: any) => void;
  };
}

function getDefaultDatasourceCate(datasourceList, defaultCate) {
  // 如果 defaultCate 存在于 datasourceList 中，直接返回
  if (_.find(datasourceList, { plugin_type: defaultCate })) {
    return defaultCate;
  }
  const findResult = _.find(datasourceList, (item) => {
    const cateObj = _.find(allCates, { value: item.plugin_type });
    if (cateObj && _.includes(cateObj.type, 'logging')) {
      return true;
    }
  });
  if (findResult) {
    return findResult.plugin_type;
  }
  return defaultCate;
}

function isDatasourceEnabled(item: { status?: string | number | boolean }) {
  if (item.status === undefined || item.status === null) return true;
  if (item.status === 'enabled' || item.status === 1 || item.status === true) return true;
  return false;
}

const Panel = (props: IProps) => {
  const { t } = useTranslation('explorer');
  const { type, defaultCate, panelIdx = 0, defaultFormValuesControl } = props;
  const { datasourceCateOptions, datasourceList, groupedDatasourceList } = useContext(CommonStateContext);
  const [tabKey, setTabKey] = useGlobalState('tabKey');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const headerExtraRef = useRef<HTMLDivElement>(null);
  const params = new URLSearchParams(location.search);
  const defaultDatasourceCate = params.get('data_source_name') || getDefaultDatasourceCate(datasourceList, defaultCate);
  const defaultDatasourceValue = params.get('data_source_id') ? _.toNumber(params.get('data_source_id')) : getDefaultDatasourceValue(defaultDatasourceCate, groupedDatasourceList);
  const datasourceCate = Form.useWatch('datasourceCate', form);
  const explorerContainerRef = useRef<HTMLDivElement>(null);
  const [promql, setPromql] = React.useState<string>();
  const isMetricExplorer = type === 'metric';

  useEffect(() => {
    setTabKey(props.tabKey);
  }, [props.tabKey]);

  const handleDatasourceChange = (val: number, nextDatasourceCate: string) => {
    setDefaultDatasourceValue(nextDatasourceCate, val);
    if (!_.includes(PROMQL_CATES, nextDatasourceCate)) {
      // Clear query first to avoid stale fields from previous datasource type.
      form.setFieldsValue({
        datasourceCate: nextDatasourceCate,
        query: undefined,
      });
      form.setFieldsValue({
        query: {
          range: {
            start: 'now-1h',
            end: 'now',
          },
        },
      });
    } else {
      form.setFieldsValue({
        datasourceCate: nextDatasourceCate,
      });
    }

    if (panelIdx === 0) {
      navigate(
        {
          search: `?data_source_name=${nextDatasourceCate}&data_source_id=${val}`,
        },
        { replace: true },
      );
    }
  };

  const filterDatasourceList = (list) => {
    return _.filter(list, (item) => {
      if (!isDatasourceEnabled(item)) {
        return false;
      }
      const cateData = _.find(datasourceCateOptions, { value: item.plugin_type });
      if (cateData && _.includes(cateData.type, type)) {
        return cateData.graphPro ? IS_PLUS : true;
      }
      return false;
    });
  };

  useEffect(() => {
    const currentDatasourceValue = form.getFieldValue('datasourceValue');
    const currentDatasourceCate = form.getFieldValue('datasourceCate');
    const availableDatasourceList = filterDatasourceList(datasourceList);
    if (_.isEmpty(availableDatasourceList)) {
      return;
    }
    const currentDatasource = _.find(availableDatasourceList, { id: currentDatasourceValue });
    if (currentDatasource) {
      return;
    }
    const fallbackDatasource = _.find(availableDatasourceList, { plugin_type: currentDatasourceCate }) || availableDatasourceList[0];
    if (!fallbackDatasource) {
      return;
    }
    handleDatasourceChange(fallbackDatasource.id, fallbackDatasource.plugin_type);
  }, [datasourceList, datasourceCateOptions, type]);

  return (
    <div className={`explorer-container explorer-container-${tabKey}`} ref={explorerContainerRef}>
      <Form
        form={form}
        initialValues={{
          datasourceCate: defaultDatasourceCate,
          datasourceValue: defaultDatasourceValue,
        }}
      >
        <div className={`explorer-content ${isMetricExplorer ? 'explorer-content-metric' : ''}`}>
          {isMetricExplorer ? (
            <Row gutter={8}>
              <Col flex='none'>
                <>
                  <Form.Item name='datasourceCate' hidden>
                    <div />
                  </Form.Item>
                  <FieldGroupV2 className='metric-explorer-ds-group' label={t('common:datasource.id')} addonAfterWithContainer={<Help datasourceCate={datasourceCate} />}>
                    <Form.Item
                      name='datasourceValue'
                      rules={[
                        {
                          required: true,
                          message: t('common:datasource.id_required'),
                        },
                      ]}
                    >
                      <DatasourceSelectV3
                        style={{ minWidth: 220 }}
                        datasourceCateList={datasourceCateOptions}
                        ajustDatasourceList={filterDatasourceList}
                        onChange={(value: any, datasourceCateOrOption: any) => {
                          if (typeof datasourceCateOrOption === 'string') {
                            handleDatasourceChange(_.toNumber(value), datasourceCateOrOption);
                          }
                        }}
                      />
                    </Form.Item>
                  </FieldGroupV2>
                </>
              </Col>
              <Col flex='auto'>
                <div ref={headerExtraRef} />
              </Col>
            </Row>
          ) : (
            <div className='explorer-form-shell'>
              <Form.Item name='datasourceCate' hidden>
                <div />
              </Form.Item>
              <div className='explorer-form-main'>
                <div className='explorer-form-control'>
                  <div className='explorer-ds-field'>
                    <span className='explorer-ds-label'>{t('common:datasource.id')}</span>
                    <Form.Item
                      className='explorer-ds-item'
                      name='datasourceValue'
                      rules={[
                        {
                          required: true,
                          message: t('common:datasource.id_required'),
                        },
                      ]}
                    >
                      <DatasourceSelectV3
                        style={{ width: '100%', minWidth: 220 }}
                        datasourceCateList={datasourceCateOptions}
                        ajustDatasourceList={filterDatasourceList}
                        onChange={(value: any, datasourceCateOrOption: any) => {
                          if (typeof datasourceCateOrOption === 'string') {
                            handleDatasourceChange(_.toNumber(value), datasourceCateOrOption);
                          }
                        }}
                      />
                    </Form.Item>
                    <Help datasourceCate={datasourceCate} />
                  </div>
                </div>
                <div className='explorer-form-extra' ref={headerExtraRef} />
              </div>
            </div>
          )}
          <div style={{ minHeight: 0, height: '100%' }}>
            <Form.Item shouldUpdate noStyle>
              {({ getFieldValue }) => {
                const datasourceCate = getFieldValue('datasourceCate');
                const datasourceValue = getFieldValue('datasourceValue');
                if (datasourceCate === DatasourceCateEnum.elasticsearch) {
                  return <Elasticsearch headerExtra={headerExtraRef.current} datasourceValue={datasourceValue} form={form} defaultFormValuesControl={defaultFormValuesControl} />;
                } else if (_.includes(PROMQL_CATES, datasourceCate)) {
                  if (datasourceCate === DatasourceCateEnum.aidoUptimeKuma) {
                    return <UptimeKumaExplorer headerExtra={headerExtraRef.current} datasourceValue={datasourceValue} form={form} panelIdx={panelIdx} />;
                  }
                  return (
                    <Prometheus
                      promQL={promql}
                      onChange={(newPromQL) => {
                        setPromql(newPromQL);
                      }}
                      headerExtra={headerExtraRef.current}
                      datasourceValue={datasourceValue}
                      form={form}
                      panelIdx={panelIdx}
                      allowReplaceHistory
                      showBuilder={false}
                    />
                  );
                } else if (datasourceCate === DatasourceCateEnum.tdengine) {
                  return <TDengine datasourceValue={datasourceValue} form={form} />;
                } else if (datasourceCate === DatasourceCateEnum.loki) {
                  return <Loki datasourceValue={datasourceValue} headerExtra={headerExtraRef.current} form={form} defaultFormValuesControl={defaultFormValuesControl} />;
                } else if (datasourceCate === DatasourceCateEnum.ck) {
                  return <CK datasourceValue={datasourceValue} headerExtra={headerExtraRef.current} />;
                } else if (datasourceCate === DatasourceCateEnum.aidoExcel) {
                  return <AidoExcelExplorer datasourceValue={datasourceValue} />;
                }
                return (
                  <PlusExplorer
                    datasourceCate={datasourceCate}
                    datasourceValue={datasourceValue}
                    headerExtraRef={headerExtraRef}
                    form={form}
                    defaultFormValuesControl={defaultFormValuesControl}
                  />
                );
              }}
            </Form.Item>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default Panel;
