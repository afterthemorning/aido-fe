import React, { useEffect, useMemo, useState } from 'react';
import { Button, Col, Input, Row, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

import { queryAidoExcelLogs } from './services';
import {
  getAidoExcelSortOrder,
  getDisplayedDays,
  getKeywordFieldsLabel,
  getSortFieldFromSorter,
  getTagColorByDays,
} from './explorer-utils';

interface Props {
  datasourceValue: number;
}

function renderHighlightedText(input: unknown, keyword: string) {
  const text = String(input ?? '');
  const kw = keyword.trim();
  if (!kw) {
    return text;
  }
  const lower = text.toLowerCase();
  const lowerKw = kw.toLowerCase();
  const parts: React.ReactNode[] = [];
  let from = 0;
  let idx = lower.indexOf(lowerKw, from);
  while (idx >= 0) {
    if (idx > from) {
      parts.push(text.slice(from, idx));
    }
    parts.push(<mark key={`${idx}-${from}`}>{text.slice(idx, idx + kw.length)}</mark>);
    from = idx + kw.length;
    idx = lower.indexOf(lowerKw, from);
  }
  if (from < text.length) {
    parts.push(text.slice(from));
  }
  return <>{parts}</>;
}

export default function AidoExcelExplorer({ datasourceValue }: Props) {
  const { t } = useTranslation('explorer');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Array<Record<string, any>>>([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    showSizeChanger: true,
  });
  const [sortField, setSortField] = useState('expiry_days');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const searchFieldsLabel = useMemo(() => getKeywordFieldsLabel(t), [t]);

  const loadData = async (opts?: {
    page?: number;
    limit?: number;
    keyword?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    if (!datasourceValue) {
      return;
    }
    const page = opts?.page ?? pagination.current ?? 1;
    const limit = opts?.limit ?? pagination.pageSize ?? 20;
    const queryText = opts?.keyword ?? keyword;
    const currentSortField = opts?.sortField ?? sortField;
    const currentSortOrder = opts?.sortOrder ?? sortOrder;

    setLoading(true);
    try {
      const res = await queryAidoExcelLogs(datasourceValue, {
        page,
        limit,
        queryString: queryText,
        sortField: currentSortField,
        sortOrder: currentSortOrder,
      });
      setRows(Array.isArray(res.list) ? res.list : []);
      setTotal(_.toNumber(res.total) || 0);
      setLoadedAt(new Date());
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: limit,
      }));
    } catch (e: any) {
      setRows([]);
      setTotal(0);
      message.error(e.message || t('aido_excel.empty_no_data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Zero-click first query when switching to aido-excel datasource.
    setKeyword('');
    setSortField('expiry_days');
    setSortOrder('asc');
    setPagination((prev) => ({
      ...prev,
      current: 1,
      pageSize: 20,
    }));
    if (datasourceValue) {
      loadData({
        page: 1,
        limit: 20,
        keyword: '',
        sortField: 'expiry_days',
        sortOrder: 'asc',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasourceValue]);

  const columns: ColumnsType<Record<string, any>> = useMemo(() => {
    return [
      {
        title: t('aido_excel.columns.application_name'),
        dataIndex: 'application_name',
        key: 'application_name',
        width: 180,
        sorter: true,
        sortOrder: sortField === 'application_name' ? getAidoExcelSortOrder(sortOrder) : null,
        ellipsis: true,
        render: (v) => renderHighlightedText(v, keyword),
      },
      {
        title: t('aido_excel.columns.environment'),
        dataIndex: 'environment',
        key: 'environment',
        width: 120,
        sorter: true,
        sortOrder: sortField === 'environment' ? getAidoExcelSortOrder(sortOrder) : null,
        ellipsis: true,
        render: (v) => renderHighlightedText(v, keyword),
      },
      {
        title: t('aido_excel.columns.category'),
        dataIndex: 'category',
        key: 'category',
        width: 120,
        sorter: true,
        sortOrder: sortField === 'category' ? getAidoExcelSortOrder(sortOrder) : null,
        ellipsis: true,
        render: (v) => renderHighlightedText(v, keyword),
      },
      {
        title: t('aido_excel.columns.support_owner'),
        dataIndex: 'support_owner',
        key: 'support_owner',
        width: 130,
        sorter: true,
        sortOrder: sortField === 'support_owner' ? getAidoExcelSortOrder(sortOrder) : null,
        ellipsis: true,
        render: (v) => renderHighlightedText(v, keyword),
      },
      {
        title: t('aido_excel.columns.email'),
        dataIndex: 'email',
        key: 'email',
        width: 180,
        sorter: true,
        sortOrder: sortField === 'email' ? getAidoExcelSortOrder(sortOrder) : null,
        ellipsis: true,
        render: (v) => renderHighlightedText(v, keyword),
      },
      {
        title: t('aido_excel.columns.next_expiry_date'),
        dataIndex: 'next_expiry_date',
        key: 'next_expiry_date',
        width: 140,
        sorter: true,
        sortOrder: sortField === 'next_expiry_date' ? getAidoExcelSortOrder(sortOrder) : null,
        ellipsis: true,
        render: (v) => renderHighlightedText(v, keyword),
      },
      {
        title: t('aido_excel.columns.expiry_days'),
        dataIndex: 'expiry_days',
        key: 'expiry_days',
        width: 120,
        sorter: true,
        sortOrder: sortField === 'expiry_days' ? getAidoExcelSortOrder(sortOrder) : null,
        render: (_, row) => {
          const days = getDisplayedDays(row.expiry_days, row.next_expiry_date);
          if (days === null) {
            return t('aido_excel.na');
          }
          return <Tag color={getTagColorByDays(days)}>{t('aido_excel.days_tag', { count: days })}</Tag>;
        },
      },
      {
        title: t('aido_excel.columns.status'),
        dataIndex: 'disabled',
        key: 'status',
        width: 110,
        render: (disabled) => {
          const isDisabled = Boolean(disabled);
          return (
            <Tag color={isDisabled ? 'default' : 'success'}>{isDisabled ? t('aido_excel.status.disabled') : t('aido_excel.status.enabled')}</Tag>
          );
        },
      },
    ];
  }, [keyword, sortField, sortOrder, t]);

  const handleTableChange = (newPagination: TablePaginationConfig, _filters: any, sorter: SorterResult<Record<string, any>> | SorterResult<Record<string, any>>[]) => {
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const nextSortField = getSortFieldFromSorter(currentSorter) || sortField;
    const nextSortOrder = currentSorter?.order === 'descend' ? 'desc' : 'asc';
    setSortField(nextSortField);
    setSortOrder(nextSortOrder);
    loadData({
      page: newPagination.current || 1,
      limit: newPagination.pageSize || 20,
      keyword,
      sortField: nextSortField,
      sortOrder: nextSortOrder,
    });
  };

  return (
    <div>
      <Row gutter={8} style={{ marginBottom: 8 }}>
        <Col flex='none'>
          <Button
            type='primary'
            onClick={() => {
              loadData({
                page: 1,
                limit: pagination.pageSize || 20,
                keyword,
                sortField,
                sortOrder,
              });
            }}
            loading={loading}
          >
            {t('query_btn')}
          </Button>
        </Col>
        <Col flex='320px'>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => {
              loadData({
                page: 1,
                limit: pagination.pageSize || 20,
                keyword,
                sortField,
                sortOrder,
              });
            }}
            placeholder={t('aido_excel.search_placeholder')}
            allowClear
          />
        </Col>
        <Col flex='auto'>
          <Space direction='vertical' size={0} className='second-color'>
            <span>{t('aido_excel.total_tip', { total })}</span>
            <span>{t('aido_excel.keyword_fields_tip', { fields: searchFieldsLabel })}</span>
            {loadedAt && <span>{t('aido_excel.last_loaded_at', { time: loadedAt.toLocaleString() })}</span>}
          </Space>
        </Col>
      </Row>
      <Table<Record<string, any>>
        rowKey={(row, idx) => String(_.get(row, 'record_key') || idx)}
        size='small'
        loading={loading}
        columns={columns}
        dataSource={rows}
        scroll={{ x: true, y: 560 }}
        onChange={handleTableChange}
        pagination={{
          ...pagination,
          total,
          showTotal: (all) => t('aido_excel.pagination_total', { total: all }),
        }}
        locale={{
          emptyText: loadedAt ? t('aido_excel.empty_no_data') : t('aido_excel.empty_click_query'),
        }}
      />
    </div>
  );
}
