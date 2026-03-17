import _ from 'lodash';
import request from '@/utils/request';
import { RequestMethod } from '@/store/common';

export interface DatasourceItem {
  sub_id?: number;
  channel: string;
  target: string;
  username: string;
  status: number;
  detail: string;
}

interface AlertRulesRecords {
  [key: string]: {
    target: string;
    username: string;
    status: number;
    detail: string;
  }[];
}

interface AlertSubscribesRecord {
  sub_id: number;
  notifies: AlertRulesRecords;
}

export function getEventNotifyRecords(eventId: string | number): Promise<{
  sub_rules: AlertSubscribesRecord[];
  notifies: AlertRulesRecords | DatasourceItem[];
}> {
  return request(`/api/n9e/event-notify-records/${eventId}`, {
    method: RequestMethod.Get,
  }).then((res) => {
    const payload = res?.dat ?? res?.data ?? res ?? {};
    const sub_rules = _.isArray(payload?.sub_rules) ? payload.sub_rules : _.isArray(payload?.subRules) ? payload.subRules : [];
    const notifies = _.isPlainObject(payload?.notifies) || _.isArray(payload?.notifies) ? payload.notifies : _.isPlainObject(payload?.notify_records) || _.isArray(payload?.notify_records) ? payload.notify_records : {};

    return {
      sub_rules,
      notifies,
    };
  });
}
