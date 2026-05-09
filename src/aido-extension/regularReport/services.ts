import request from '@/utils/request';
import { RequestMethod } from '@/store/common';

export interface RegularReportItem {
  id: number;
  policy_id: number;
  notify_rule_id?: number;
  status: string;
  summary_source?: string;
  prompt_version?: string;
  window_start?: number;
  window_end?: number;
  current_revision_id: number;
  edited: boolean;
  last_action_by: string;
  last_action_at: number;
  scheduled_send_at: number;
}

export interface O365SourceConfig {
  tenant_id: string;
  client_id: string;
  client_secret?: string;
  mailbox: string;
  folder?: string;
  timezone?: string;
  graph_endpoint?: string;
  has_client_secret?: boolean;
}

export interface RegularReportAIConfig {
  endpoint?: string;
  api_key?: string;
  model?: string;
  system_prompt?: string;
  timeout_seconds?: number;
  has_api_key?: boolean;
}

export interface RegularReportScheduleConfig {
  enabled?: boolean;
  hour?: number;
  minute?: number;
  lookback_hours?: number;
  ai_enabled?: boolean;
  auto_approve?: boolean;
}

export interface RegularReportOutput {
  metadata: {
    report_id: number;
    policy_id: number;
    status: string;
    window_start: number;
    window_end: number;
    summary_source: string;
    prompt_version: string;
    current_revision: number;
  };
  digest: {
    overview?: string;
    key_highlights?: string[];
    risks?: string[];
    actions?: string[];
    stats?: Record<string, string>;
  };
  content: {
    brief?: string;
    markdown?: string;
    html?: string;
  };
}

export interface ExecutionItem {
  id: number;
  policy_id: number;
  report_id: number;
  trigger_mode: string;
  status: string;
  mail_count: number;
  duration_ms: number;
  summary_source: string;
  prompt_version: string;
  window_start: number;
  window_end: number;
  error_message?: string;
  created_at: number;
  finished_at: number;
  operator: string;
}

export interface DigestInputPreview {
  metadata: {
    policy_id: number;
    report_id: number;
    window_start: number;
    window_end: number;
    summary_source: string;
    prompt_version: string;
    current_revision: number;
  };
  highlights: string[];
}

export interface DeliveryItem {
  id: number;
  report_id: number;
  policy_id: number;
  notify_rule_id: number;
  status: string;
  channel: string;
  result_message: string;
  sent_at: number;
  operator: string;
}

export interface SendScheduleItem {
  report_id: string;
  status: string;
  notify_rule_id?: number;
  allow_cancel_during_delay?: boolean;
  require_reapprove_after_edit?: boolean;
  scheduled_send_at?: number;
  remaining_seconds?: number;
  current_revision_id?: number;
}

export interface RevisionItem {
  revision_id: number;
  report_id: number;
  editor: string;
  edited_at: number;
  change_comment: string;
  brief_content: string;
  markdown_content: string;
  html_content: string;
}

export function getReportHistory(params?: { status?: string; edited?: boolean }) {
  return request('/api/n9e/regular-report/reports/history', {
    method: RequestMethod.Get,
    params,
  }).then((res) => res.dat ?? { list: [], total: 0 });
}

export function bindPolicyNotifyRule(policyId: number, notifyRuleId: number) {
  return request(`/api/n9e/regular-report/policies/${policyId}/notify-rule`, {
    method: RequestMethod.Put,
    data: {
      notify_rule_id: notifyRuleId,
    },
  }).then((res) => res.dat);
}

export function getReportRevisions(id: number): Promise<RevisionItem[]> {
  return request(`/api/n9e/regular-report/reports/${id}/revisions`, {
    method: RequestMethod.Get,
  }).then((res) => res.dat ?? []);
}

export function updateReportContent(
  id: number,
  data: { brief_content?: string; markdown_content?: string; html_content?: string; change_comment: string },
) {
  return request(`/api/n9e/regular-report/reports/${id}/content`, {
    method: RequestMethod.Put,
    data,
  }).then((res) => res.dat);
}

export function approveReport(id: number, data: { send_delay_seconds?: number; notify_rule_id?: number }) {
  return request(`/api/n9e/regular-report/reports/${id}/approve`, {
    method: RequestMethod.Post,
    data,
  }).then((res) => res.dat);
}

export function revokeReport(id: number, undo_window_minutes = 30) {
  return request(`/api/n9e/regular-report/reports/${id}/revoke`, {
    method: RequestMethod.Post,
    data: { undo_window_minutes },
  }).then((res) => res.dat);
}

export function undoRevokeReport(id: number) {
  return request(`/api/n9e/regular-report/reports/${id}/revoke/undo`, {
    method: RequestMethod.Post,
  }).then((res) => res.dat);
}

export function cancelScheduledSend(id: number) {
  return request(`/api/n9e/regular-report/reports/${id}/send/cancel`, {
    method: RequestMethod.Post,
  }).then((res) => res.dat);
}

export function getSendSchedule(id: number): Promise<SendScheduleItem> {
  return request(`/api/n9e/regular-report/reports/${id}/send-schedule`, {
    method: RequestMethod.Get,
  }).then((res) => res.dat);
}

export function getO365Source(): Promise<O365SourceConfig> {
  return request('/api/n9e/regular-report/sources/o365', {
    method: RequestMethod.Get,
  }).then((res) => res.dat ?? {});
}

export function saveO365Source(data: O365SourceConfig) {
  return request('/api/n9e/regular-report/sources/o365', {
    method: RequestMethod.Put,
    data,
  }).then((res) => res.dat);
}

export function testO365Source(data?: Partial<O365SourceConfig>) {
  return request('/api/n9e/regular-report/sources/o365/test', {
    method: RequestMethod.Post,
    data: data || {},
  }).then((res) => res.dat);
}

export function getRegularReportAIConfig(): Promise<RegularReportAIConfig> {
  return request('/api/n9e/regular-report/ai/config', {
    method: RequestMethod.Get,
  }).then((res) => res.dat ?? {});
}

export function saveRegularReportAIConfig(data: RegularReportAIConfig) {
  return request('/api/n9e/regular-report/ai/config', {
    method: RequestMethod.Put,
    data,
  }).then((res) => res.dat);
}

export function getRegularReportSchedule(policyId: number): Promise<RegularReportScheduleConfig> {
  return request(`/api/n9e/regular-report/policies/${policyId}/schedule`, {
    method: RequestMethod.Get,
  }).then((res) => res.dat ?? {});
}

export function saveRegularReportSchedule(policyId: number, data: RegularReportScheduleConfig) {
  return request(`/api/n9e/regular-report/policies/${policyId}/schedule`, {
    method: RequestMethod.Put,
    data,
  }).then((res) => res.dat);
}

export function runPolicyNow(policyId: number, data?: { lookback_hours?: number; ai_enabled?: boolean }) {
  return request(`/api/n9e/regular-report/policies/${policyId}/run`, {
    method: RequestMethod.Post,
    data: data || {},
  }).then((res) => res.dat);
}

export function getExecutions(params?: { limit?: number }) {
  return request('/api/n9e/regular-report/executions', {
    method: RequestMethod.Get,
    params,
  }).then((res) => res.dat ?? { list: [], total: 0 });
}

export function getDigestInputPreview(reportId: number): Promise<DigestInputPreview> {
  return request(`/api/n9e/regular-report/reports/${reportId}/digest-input-preview`, {
    method: RequestMethod.Get,
  }).then((res) => res.dat ?? { metadata: {}, highlights: [] });
}

export function getDeliveries(reportId: number, params?: { limit?: number }) {
  return request(`/api/n9e/regular-report/reports/${reportId}/deliveries`, {
    method: RequestMethod.Get,
    params,
  }).then((res) => res.dat ?? { list: [], total: 0 });
}

export function getRegularReportOutput(reportId: number): Promise<RegularReportOutput> {
  return request(`/api/n9e/regular-report/reports/${reportId}/output`, {
    method: RequestMethod.Get,
  }).then((res) => res.dat ?? { metadata: {}, digest: {}, content: {} });
}

export function resendReport(reportId: number) {
  return request(`/api/n9e/regular-report/reports/${reportId}/resend`, {
    method: RequestMethod.Post,
  }).then((res) => res.dat);
}
