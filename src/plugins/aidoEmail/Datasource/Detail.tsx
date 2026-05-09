import React from 'react';
import _ from 'lodash';
import { Row, Col, Tabs } from 'antd';

interface Props {
  data: any;
}

export default function Detail(props: Props) {
  const { data } = props;
  const cate = 'aido-email';

  const block = (items: Array<{ label: string; value: React.ReactNode }>) => (
    <div className='flash-cat-block'>
      {items.map((item, idx) => (
        <Row gutter={16} style={idx > 0 ? { marginTop: 8 } : undefined} key={item.label}>
          <Col span={24}>{item.label}:</Col>
          <Col span={24} className='second-color'>
            {item.value}
          </Col>
        </Row>
      ))}
    </div>
  );

  return (
    <div>
      <div className='page-title'>Email Settings</div>
      <Tabs
        destroyInactiveTabPane={false}
        items={[
          {
            key: 'connection',
            label: 'Connection',
            children: block([
              { label: 'Source Type', value: _.get(data, ['settings', `${cate}.source_type`], 'imap') },
              { label: 'IMAP Host', value: _.get(data, ['settings', `${cate}.imap.host`], '-') },
              { label: 'IMAP Port', value: _.get(data, ['settings', `${cate}.imap.port`], '-') },
              { label: 'Use TLS', value: _.get(data, ['settings', `${cate}.imap.use_tls`], true) ? 'true' : 'false' },
              { label: 'IMAP Username', value: _.get(data, ['settings', `${cate}.imap.username`], '-') },
              { label: 'IMAP Password', value: '******' },
              { label: 'IMAP Folder', value: _.get(data, ['settings', `${cate}.imap.folder`], 'INBOX') },
            ]),
          },
          {
            key: 'strategy',
            label: 'Read & Storage',
            children: block([
              { label: 'Read Method', value: _.get(data, ['settings', `${cate}.read_method`], 'unread_only') },
              { label: 'Read Frequency (seconds)', value: _.get(data, ['settings', `${cate}.read_frequency_seconds`], 300) },
              { label: 'Storage Mode', value: _.get(data, ['settings', `${cate}.storage_mode`], 'structured_json') },
              { label: 'Retention Days', value: _.get(data, ['settings', `${cate}.retention_days`], 90) },
            ]),
          },
          {
            key: 'recipient',
            label: 'Recipients',
            children: block([
              { label: 'Email Addresses', value: _.get(data, ['settings', `${cate}.address_list`], '-') },
              { label: 'Address Separator', value: _.get(data, ['settings', `${cate}.address_split`], '-') },
              { label: 'Cluster', value: _.get(data, ['settings', `${cate}.cluster_name`], '-') },
            ]),
          },
        ]}
      />
    </div>
  );
}
