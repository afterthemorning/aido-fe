/**
 * Aido Email Datasource – API service calls
 *
 * Endpoints served by aido center at /api/n9e/aido-email/...
 */

import request from '@/utils/request';
import { RequestMethod } from '@/store/common';

export interface IMAPConfig {
  host: string;
  port: number;
  use_tls: boolean;
  username: string;
  password?: string;
  folder?: string;
}

export interface EmailSourceSettings {
  source_type: 'imap';
  imap: IMAPConfig;
  read_method: 'unread_only' | 'latest_window' | 'all';
  read_frequency_seconds: number;
  storage_mode: 'structured_json' | 'raw_mime' | 'hybrid';
  retention_days: number;
  address_list: string;
  address_split: string;
  cluster_name?: string;
}

export interface EmailSourceTestResult {
  success: boolean;
  message: string;
  folder_count?: number;
  recent_message_count?: number;
}

export interface EmailSourceStats {
  total_messages: number;
  processed_messages: number;
  failed_messages: number;
  last_sync_at?: number;
}

/**
 * Test IMAP connection with given configuration
 */
export async function testIMAPConnection(settings: IMAPConfig): Promise<EmailSourceTestResult> {
  return request('/api/n9e/aido-email/test-connection', {
    method: RequestMethod.Post,
    data: settings,
  }).then((res) => res.dat ?? { success: false, message: 'Unknown error' });
}

/**
 * Get email source configuration
 */
export async function getEmailSourceConfig(datasourceId: number): Promise<Partial<EmailSourceSettings>> {
  return request(`/api/n9e/aido-email/datasource/${datasourceId}`, {
    method: RequestMethod.Get,
  }).then((res) => res.dat ?? {});
}

/**
 * Save email source configuration
 */
export async function saveEmailSourceConfig(
  datasourceId: number,
  settings: EmailSourceSettings,
): Promise<void> {
  return request(`/api/n9e/aido-email/datasource/${datasourceId}`, {
    method: RequestMethod.Put,
    data: settings,
  }).then((res) => res.dat);
}

/**
 * Get email source statistics
 */
export async function getEmailSourceStats(datasourceId: number): Promise<EmailSourceStats> {
  return request(`/api/n9e/aido-email/datasource/${datasourceId}/stats`, {
    method: RequestMethod.Get,
  }).then((res) => res.dat ?? {
    total_messages: 0,
    processed_messages: 0,
    failed_messages: 0,
  });
}

/**
 * Trigger manual sync for email source
 */
export async function triggerEmailSync(datasourceId: number): Promise<void> {
  return request(`/api/n9e/aido-email/datasource/${datasourceId}/sync`, {
    method: RequestMethod.Post,
  }).then((res) => res.dat);
}
