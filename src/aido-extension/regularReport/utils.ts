import { RegularReportItem } from './services';

export const canApproveStatus = (status: string): boolean => ['draft', 'pending_review', 'send_canceled', 'revoked'].includes(status);

export const canRevokeStatus = (status: string): boolean => ['approved_waiting_send', 'published'].includes(status);

export const canUndoStatus = (status: string): boolean => status === 'revoked';

export const canCancelSendStatus = (status: string): boolean => status === 'approved_waiting_send';

export const filterReportsByKeyword = (list: RegularReportItem[], keyword?: string): RegularReportItem[] => {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase();
  if (!normalizedKeyword) return list;

  return list.filter((item) => {
    return (
      String(item.id).includes(normalizedKeyword) ||
      String(item.policy_id).includes(normalizedKeyword) ||
      String(item.status || '').toLowerCase().includes(normalizedKeyword) ||
      String(item.last_action_by || '').toLowerCase().includes(normalizedKeyword)
    );
  });
};
