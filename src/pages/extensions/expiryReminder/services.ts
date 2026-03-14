/**
 * Expiry Reminder – API service calls (aido center backend)
 *
 * All endpoints are served by the aido center at /api/n9e/expiry/...
 * The caller must pass the id of a configured aido-excel datasource.
 */

import request from '@/utils/request';
import { RequestMethod } from '@/store/common';

export interface ExpiryRecord {
  record_key: string;
  application_name: string;
  category: string;
  environment: string;
  support_owner: string;
  email: string;
  next_expiry_date: string;
  expiry_days: number;
  disabled: boolean;
}

export interface OverridePayload {
  application_name: string;
  category: string;
  environment: string;
  support_owner?: string;
  email?: string;
  next_expiry_date?: string;
  reason?: string;
  operator?: string;
}

export async function listRecords(datasourceId: number): Promise<ExpiryRecord[]> {
  return request('/api/n9e/expiry/records', {
    method: RequestMethod.Get,
    params: { datasource_id: datasourceId },
  }).then((res) => res.dat || []);
}

export async function overrideUpsert(payload: OverridePayload): Promise<void> {
  return request('/api/n9e/expiry/override/upsert', {
    method: RequestMethod.Post,
    data: payload,
  });
}

export async function overrideClear(app: string, env: string, category: string): Promise<void> {
  return request('/api/n9e/expiry/override/clear', {
    method: RequestMethod.Post,
    data: { application_name: app, environment: env, category },
  });
}

export async function recordDisable(app: string, env: string, category: string, disabled: boolean): Promise<void> {
  return request('/api/n9e/expiry/record/disable', {
    method: RequestMethod.Post,
    data: { application_name: app, environment: env, category, disabled },
  });
}

