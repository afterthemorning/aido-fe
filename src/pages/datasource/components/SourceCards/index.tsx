import React from 'react';
import { Row, Col, Button } from 'antd';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import './index.less';
import DatasourceIcon from '@/components/DatasourceIcon';

interface Props {
  sourceMap: any;
  urlPrefix?: string;
}

export default function SourceCard(props: Props) {
  const { t } = useTranslation('datasourceManage');
  const { sourceMap, urlPrefix = 'settings' } = props;

  return (
    <Row className='settings-datasource' gutter={[16, 16]}>
      {_.map(sourceMap, (item) => {
        return (
          <Col span={4} key={item.name}>
            <Link to={`/${urlPrefix}/add/${item.type.includes('.') ? _.toLower(item.type).split('.')[0] : _.toLower(item.type)}`}>
              <div className='builtin-cates-grid-item'>
                <DatasourceIcon logo={item.logo} label={item.name} ident={item.type} size={48} />
                <div>{item.name}</div>
              </div>
            </Link>
          </Col>
        );
      })}
    </Row>
  );
}
