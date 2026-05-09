import { useEffect, useContext, useRef } from 'react';
import { CommonStateContext } from '@/App';

const PERMS_REFRESH_INTERVAL = 30000; // 30s
const PERMS_CHANGE_EVENT = 'aido-perms-changed';

/**
 * 自动监听权限变更，触发菜单动态刷新。
 * - 监听自定义 DOM 事件（保存权限时由操作页面触发）
 * - 兜底：30s 定时轮询
 * - 页面不可见时暂停轮询
 */
export function usePermissionsRefresh() {
  const { reloadPerms } = useContext(CommonStateContext);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 1. 监听自定义事件 — 权限保存操作触发即时刷新
    const handlePermsChange = () => { reloadPerms(); };
    window.addEventListener(PERMS_CHANGE_EVENT, handlePermsChange);

    // 2. 兜底定时轮询 — 仅在页面可见时运行
    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        reloadPerms();
      }, PERMS_REFRESH_INTERVAL);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    startPolling();

    return () => {
      window.removeEventListener(PERMS_CHANGE_EVENT, handlePermsChange);
      document.removeEventListener('visibilitychange', handleVisibility);
      stopPolling();
    };
  }, [reloadPerms]);
}

/**
 * 触发权限刷新 — 保存权限操作后调用此函数通知菜单刷新。
 */
export function notifyPermsChanged() {
  window.dispatchEvent(new Event('aido-perms-changed'));
}
