import React from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Form, Space, Row, Col, InputNumber } from 'antd';

import { SIZE } from '@/utils/constant';
import FieldGroupV2 from '@/components/FieldGroupV2';

import { NAME_SPACE } from '../constants';
import QueryInput from './components/QueryInput';

interface Props {
  executeQuery: () => void;
}

export default function QueryBuilder(props: Props) {
  const { t } = useTranslation(NAME_SPACE);
  const { executeQuery } = props;

  return (
    <div>
      <Row gutter={SIZE}>
        <Col flex='auto'>
          <FieldGroupV2 label={<Space>{t('explorer.query')}</Space>}>
            <Form.Item
              name={['query', 'query']}
              rules={[
                {
                  required: true,
                  message: t('explorer.query_required'),
                },
              ]}
              initialValue='*'
            >
              <QueryInput onChange={executeQuery} />
            </Form.Item>
          </FieldGroupV2>
        </Col>
        <Col flex='none'>
          <FieldGroupV2 label={<Space>{t('explorer.limit')}</Space>}>
            <Form.Item name={['query', 'limit']} initialValue={500}>
              <InputNumber min={0} controls={false} />
            </Form.Item>
          </FieldGroupV2>
        </Col>
      </Row>
    </div>
  );
}
