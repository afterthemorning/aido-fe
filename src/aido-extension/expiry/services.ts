import request from '@/utils/request';
import { RequestMethod } from '@/store/common';

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

export async function queryAidoExcelLogs(datasourceId: number): Promise<ExpiryLogQueryResp> {
  return request('/api/n9e/logs-query', {
    method: RequestMethod.Post,
    data: {
      cate: 'aido-excel',
      datasource_id: datasourceId,
      queries: [{}],
    },
  }).then((res) => res.dat || { total: 0, list: [] });
}
