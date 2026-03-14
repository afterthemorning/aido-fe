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

export interface ExpiryPreviewResp {
  total_rows: number;
  sample_rows: Array<Record<string, string>>;
  missing_application: number;
  missing_environment: number;
  missing_category: number;
  missing_next_expiry_date: number;
  invalid_next_expiry_date: number;
  suggested_rule_query: string;
  suggested_urgent_query: string;
}

export interface ExpiryImportJob {
  id: number;
  datasource_id: number;
  status: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  message: string;
  triggered_by: string;
  trigger_source: string;
  started_at: number;
  finished_at: number;
  created_at: number;
  updated_at: number;
}


export async function listRecords(datasourceId: number): Promise<ExpiryRecord[]> {
  return request('/api/n9e/expiry/records', {
    method: RequestMethod.Get,
    params: { datasource_id: datasourceId },
  }).then((res) => res.dat || []);
}

export async function previewRecords(datasourceId: number, limit = 20): Promise<ExpiryPreviewResp> {
  return request('/api/n9e/expiry/preview', {
    method: RequestMethod.Get,
    params: { datasource_id: datasourceId, limit },
  }).then((res) => res.dat || {
    total_rows: 0,
    sample_rows: [],
    missing_application: 0,
    missing_environment: 0,
    missing_category: 0,
    missing_next_expiry_date: 0,
    invalid_next_expiry_date: 0,
    suggested_rule_query: 'expiry_days < 0',
    suggested_urgent_query: 'expiry_days <= 7 and expiry_days >= 0',
  });
}

export async function triggerImport(datasourceId: number): Promise<ExpiryImportJob> {
  return request('/api/n9e/expiry/import/trigger', {
    method: RequestMethod.Post,
    data: { datasource_id: datasourceId },
  }).then((res) => res.dat);
}

export async function listImportJobs(datasourceId: number, limit = 20): Promise<ExpiryImportJob[]> {
  return request('/api/n9e/expiry/import/jobs', {
    method: RequestMethod.Get,
    params: { datasource_id: datasourceId, limit },
  }).then((res) => res.dat || []);
}

export async function getImportJob(id: number): Promise<ExpiryImportJob> {
  return request(`/api/n9e/expiry/import/job/${id}`, {
    method: RequestMethod.Get,
  }).then((res) => res.dat);
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

