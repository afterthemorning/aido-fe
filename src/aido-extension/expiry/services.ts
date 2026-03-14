import request from '@/utils/request';
import { RequestMethod } from '@/store/common';
import { AidoExcelLogQueryParams, buildAidoExcelLogQuery } from './explorer-utils';

export interface ExpirySchedule {
  datasource_id: number;
  enabled: boolean;
  interval_seconds: number;
}

export async function getSchedule(datasourceId: number): Promise<ExpirySchedule> {
  return request('/api/n9e/expiry/schedule', {
    method: RequestMethod.Get,
    params: { datasource_id: datasourceId },
  }).then((res) => res.dat || {
    datasource_id: datasourceId,
    enabled: false,
    interval_seconds: 300,
  });
}

export async function upsertSchedule(payload: {
  datasource_id: number;
  enabled: boolean;
  interval_seconds: number;
}): Promise<ExpirySchedule> {
  return request('/api/n9e/expiry/schedule/upsert', {
    method: RequestMethod.Post,
    data: payload,
  }).then((res) => res.dat);
}

export interface ExpiryLogQueryResp {
  total: number;
  list: Array<Record<string, any>>;
}

export async function queryAidoExcelLogs(datasourceId: number, params?: AidoExcelLogQueryParams): Promise<ExpiryLogQueryResp> {
  const query = buildAidoExcelLogQuery(params);
  return request('/api/n9e/logs-query', {
    method: RequestMethod.Post,
    data: {
      cate: 'aido-excel',
      datasource_id: datasourceId,
      query: [query],
    },
  }).then((res) => res.dat || { total: 0, list: [] });
}
