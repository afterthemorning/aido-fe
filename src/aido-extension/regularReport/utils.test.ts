import {
  canApproveStatus,
  canCancelSendStatus,
  canRevokeStatus,
  canUndoStatus,
  filterReportsByKeyword,
} from './utils';

describe('regular report utils', () => {
  it('returns expected action availability by status', () => {
    expect(canApproveStatus('draft')).toBe(true);
    expect(canApproveStatus('pending_review')).toBe(true);
    expect(canApproveStatus('published')).toBe(false);

    expect(canRevokeStatus('approved_waiting_send')).toBe(true);
    expect(canRevokeStatus('published')).toBe(true);
    expect(canRevokeStatus('draft')).toBe(false);

    expect(canUndoStatus('revoked')).toBe(true);
    expect(canUndoStatus('pending_review')).toBe(false);

    expect(canCancelSendStatus('approved_waiting_send')).toBe(true);
    expect(canCancelSendStatus('published')).toBe(false);
  });

  it('filters reports by keyword against id, policy, status and operator', () => {
    const list = [
      {
        id: 1001,
        policy_id: 2001,
        status: 'pending_review',
        current_revision_id: 1,
        edited: false,
        last_action_by: 'alice',
        last_action_at: 1710000000,
        scheduled_send_at: 0,
      },
      {
        id: 1002,
        policy_id: 2002,
        status: 'published',
        current_revision_id: 2,
        edited: true,
        last_action_by: 'bob',
        last_action_at: 1710000100,
        scheduled_send_at: 1710000200,
      },
    ];

    expect(filterReportsByKeyword(list, '1002')).toHaveLength(1);
    expect(filterReportsByKeyword(list, '2001')[0].id).toBe(1001);
    expect(filterReportsByKeyword(list, 'PUBLISHED')[0].id).toBe(1002);
    expect(filterReportsByKeyword(list, 'alice')[0].id).toBe(1001);
    expect(filterReportsByKeyword(list, '   ')).toHaveLength(2);
  });
});
