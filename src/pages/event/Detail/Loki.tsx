import React from 'react';
import _ from 'lodash';
import { Row, Col, Button, Space } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import queryString from 'query-string';
import moment from 'moment';
import PromQLInput from '@/components/PromQLInput';

interface IProps {
  eventDetail: any;
  navigate: (path: any, opts?: any) => void;
}

export default function LokiDetail(props: IProps) {
  const { eventDetail, navigate } = props;

  return [
    {
      label: 'LogQL',
      key: 'rule_config',
      render(ruleConfig) {
        const queries = _.get(ruleConfig, 'queries', []);
        return (
          <div style={{ width: '100%' }}>
            {_.map(queries, (query) => {
              const { prom_ql } = query;
              return (
                <Space align='baseline' size={2}>
                  <Button
                    className='p-0'
                    style={{
                      position: 'relative',
                      top: 1,
                    }}
                    type='link'
                    onClick={() => {
                      navigate({
                        pathname: '/log/explorer',
                        search: queryString.stringify({
                          query: prom_ql,
                          data_source_name: 'loki',
                          data_source_id: eventDetail.datasource_id,
                          start: moment.unix(eventDetail.trigger_time).subtract(30, 'minutes').valueOf(),
                          end: moment.unix(eventDetail.trigger_time).add(30, 'minutes').valueOf(),
                        }),
                      });
                    }}
                  >
                    <PlayCircleOutlined />
                  </Button>
                  <PromQLInput value={prom_ql} readonly />
                </Space>
              );
            })}
          </div>
        );
      },
    },
  ];
}
