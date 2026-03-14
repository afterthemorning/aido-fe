import React from 'react';
import _ from 'lodash';
import { Row, Col } from 'antd';

interface Props {
  data: any;
}

export default function Detail(props: Props) {
  const { data } = props;
  const cate = 'aido-excel';

  return (
    <div>
      <div className='page-title'>Excel Settings</div>
      <div className='flash-cat-block'>
        <Row gutter={16}>
          <Col span={24}>File Path:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.file_path`], '-')}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>Sheet Name:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.sheet_name`], '-')}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>Cluster:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.cluster_name`], '-')}
          </Col>
        </Row>
      </div>
    </div>
  );
}
