/**
 * Expiry Reminder – API service calls
 *
 * The extension adapter runs as a sidecar.
 * Base URL is read from the global window config injected at build/runtime,
 * falling back to the env variable, then localhost default for development.
 */

declare global {
  interface Window {
    EXPIRY_ADAPTER_URL?: string;
  }
}

function baseUrl(): string {
  return (
    window.EXPIRY_ADAPTER_URL ||
    (import.meta as any).env?.VITE_EXPIRY_ADAPTER_URL ||
    'http://127.0.0.1:9109'
  );
}

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
  disabled?: boolean;
  reason?: string;
  operator?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.error || 'request failed');
  return json.data as T;
}

export async function listRecords(): Promise<ExpiryRecord[]> {
  return request<ExpiryRecord[]>('/api/v1/records');
}

export async function uploadExcel(file: File): Promise<{ imported: number; skipped: number }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${baseUrl()}/api/v1/import/upload`, {
    method: 'POST',
    body: form,
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.error || 'upload failed');
  return json.data;
}

export async function overrideUpsert(payload: OverridePayload): Promise<void> {
  return request('/api/v1/override/upsert', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function overrideClear(app: string, env: string, category: string, operator?: string): Promise<void> {
  return request('/api/v1/override/clear', {
    method: 'POST',
    body: JSON.stringify({ application_name: app, environment: env, category, operator }),
  });
}

export async function recordDisable(app: string, env: string, category: string, disabled: boolean, operator?: string): Promise<void> {
  return request('/api/v1/record/disable', {
    method: 'POST',
    body: JSON.stringify({ application_name: app, environment: env, category, disabled, operator }),
  });
}
