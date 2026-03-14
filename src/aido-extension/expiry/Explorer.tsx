import React, { useMemo, useState } from 'react';
import { Button, Col, Input, Row, Space, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import _ from 'lodash';

import { queryAidoExcelLogs } from './services';

interface Props {
  datasourceValue: number;
}

export default function AidoExcelExplorer({ datasourceValue }: Props) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Array<Record<string, any>>>([]);
  const [keyword, setKeyword] = useState('');

  const loadData = async () => {
    if (!datasourceValue) {
      return;
    }
    setLoading(true);
    try {
      const res = await queryAidoExcelLogs(datasourceValue);
      setRows(Array.isArray(res.list) ? res.list : []);
    } catch (e: any) {
      message.error(e.message || 'Load datasource logs failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    if (!keyword.trim()) {
      return rows;
    }
    const kw = keyword.trim().toLowerCase();
    return rows.filter((row) => {
      return Object.values(row || {}).some((v) => String(v ?? '').toLowerCase().includes(kw));
    });
  }, [rows, keyword]);

  const columns: ColumnsType<Record<string, any>> = useMemo(() => {
    const keySet = new Set<string>();
    filteredRows.forEach((row) => {
      Object.keys(row || {}).forEach((k) => keySet.add(k));
    });
    return Array.from(keySet).map((k) => ({
      title: k,
      dataIndex: k,
      key: k,
      width: 180,
      ellipsis: true,
      render: (v) => (_.isObject(v) ? JSON.stringify(v) : String(v ?? '')),
    }));
  }, [filteredRows]);

  return (
    <div>
      <Row gutter={8} style={{ marginBottom: 8 }}>
        <Col flex='none'>
          <Button type='primary' onClick={loadData} loading={loading}>Load Imported Data</Button>
        </Col>
        <Col flex='320px'>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder='Search in loaded rows'
            allowClear
          />
        </Col>
        <Col flex='auto'>
          <Space className='second-color'>
            Rows: {filteredRows.length}
          </Space>
        </Col>
      </Row>
      <Table<Record<string, any>>
        rowKey={(row, idx) => String(_.get(row, 'record_key') || idx)}
        size='small'
        loading={loading}
        columns={columns}
        dataSource={filteredRows}
        scroll={{ x: true, y: 560 }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />
    </div>
  );
}
