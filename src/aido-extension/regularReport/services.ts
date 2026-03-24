import request from '@/utils/request';
import { RequestMethod } from '@/store/common';

export interface RegularReportItem {
  id: number;
  policy_id: number;
  notify_rule_id?: number;
  status: string;
  current_revision_id: number;
  edited: boolean;
  last_action_by: string;
  last_action_at: number;
  scheduled_send_at: number;
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
