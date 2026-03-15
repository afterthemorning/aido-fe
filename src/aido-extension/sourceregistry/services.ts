import request from '@/utils/request';
import { RequestMethod } from '@/store/common';

const BASE = '/api/n9e/source-registry';

export interface SourceRegistry {
  id: number;
  source_id: string;
  source_name: string;
  owner_team_id: number;
  owner_team_name: string;
  env: string;
  agent_type: string;
  target_datasource_id: number;
  status: string;
  description: string;
  created_by: string;
  created_at: number;
  updated_by: string;
  updated_at: number;
}

export interface SourceAPIKey {
  id: number;
  key_id: string;
  source_id: string;
  status: string;
  expires_at: number;
  revoked_at: number;
  revoked_by: string;
  last_used_at: number;
  last_used_ip: string;
  created_by: string;
  created_at: number;
}

export interface SourcePolicy {
  source_id: string;
  qps_limit: number;
  burst_limit: number;
  cardinality_limit: number;
  allowed_protocols: string[];
  ip_allowlist: string[];
  required_labels: string[];
  allowed_labels: string[];
  blocked_labels: string[];
}

export interface SourceAuditEvent {
  id: number;
  event_id: string;
  source_id: string;
  key_id: string;
  actor: string;
  action: string;
  result: string;
  reason: string;
  request_path: string;
  request_method: string;
  request_ip: string;
  created_at: number;
}

export interface UpsertSourceForm {
  source_id?: string;
  source_name: string;
  owner_team_id?: number;
  owner_team_name?: string;
  env: string;
  agent_type: string;
  target_datasource_id: number;
  description?: string;
}

export interface PolicyForm {
  qps_limit: number;
  burst_limit: number;
  cardinality_limit: number;
  allowed_protocols: string[];
  ip_allowlist: string[];
  required_labels: string[];
  allowed_labels: string[];
  blocked_labels: string[];
}

export interface AuditQuery {
  source_id?: string;
  key_id?: string;
  action?: string;
  result?: string;
  p?: number;
  limit?: number;
}

export function getSources(params?: { p?: number; limit?: number }): Promise<{ list: SourceRegistry[]; total: number }> {
  return request(`${BASE}/sources`, {
    method: RequestMethod.Get,
    params,
  }).then((res) => res.dat || { list: [], total: 0 });
}

export function addSource(data: UpsertSourceForm): Promise<{ source_id: string }> {
  return request(`${BASE}/sources`, {
    method: RequestMethod.Post,
    data,
  }).then((res) => res.dat);
}

export function updateSource(sourceId: string, data: Omit<UpsertSourceForm, 'source_id'>): Promise<void> {
  return request(`${BASE}/sources/${sourceId}`, {
    method: RequestMethod.Put,
    data,
  }).then(() => undefined);
}

export function updateSourceStatus(sourceId: string, status: 'enabled' | 'disabled'): Promise<void> {
  return request(`${BASE}/sources/${sourceId}/status`, {
    method: RequestMethod.Post,
    data: { status },
  }).then(() => undefined);
}

export function getKeys(sourceId: string): Promise<SourceAPIKey[]> {
  return request(`${BASE}/sources/${sourceId}/keys`, {
    method: RequestMethod.Get,
  }).then((res) => {
    const d = res.dat;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.list)) return d.list;
    return [];
  });
}

export function addKey(sourceId: string, expiresAt?: number): Promise<{ key_id: string; api_key: string }> {
  return request(`${BASE}/sources/${sourceId}/keys`, {
    method: RequestMethod.Post,
    data: { expires_at: expiresAt || 0 },
  }).then((res) => res.dat);
}

export function revokeKey(keyId: string): Promise<void> {
  return request(`${BASE}/keys/${keyId}/revoke`, {
    method: RequestMethod.Post,
    data: {},
  }).then(() => undefined);
}

export function getPolicy(sourceId: string): Promise<SourcePolicy> {
  return request(`${BASE}/sources/${sourceId}/policy`, {
    method: RequestMethod.Get,
  }).then((res) => res.dat || {});
}

export function updatePolicy(sourceId: string, data: PolicyForm): Promise<void> {
  return request(`${BASE}/sources/${sourceId}/policy`, {
    method: RequestMethod.Put,
    data,
  }).then(() => undefined);
}

export function getAuditEvents(params: AuditQuery): Promise<{ list: SourceAuditEvent[]; total: number }> {
  return request(`${BASE}/audit`, {
    method: RequestMethod.Get,
    params,
  }).then((res) => res.dat || { list: [], total: 0 });
}
