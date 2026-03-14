import React from 'react';
import _ from 'lodash';
import { Row, Col } from 'antd';

interface Props {
  data: any;
}

export default function Detail(props: Props) {
  const { data } = props;
  const cate = 'aido-sharepoint';

  return (
    <div>
      <div className='page-title'>SharePoint Settings</div>
      <div className='flash-cat-block'>
        <Row gutter={16}>
          <Col span={24}>Site URL:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.site_url`], '-')}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>List Name:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.list_name`], '-')}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>Tenant ID:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.tenant_id`], '-')}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>Client ID:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.client_id`], '-')}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={24}>Client Secret:</Col>
          <Col span={24} className='second-color'>
            {_.get(data, ['settings', `${cate}.client_secret`]) ? '******' : '-'}
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
