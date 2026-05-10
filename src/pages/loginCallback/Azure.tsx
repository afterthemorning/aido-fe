import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './locale';

/**
 * Azure SSO 回调页面
 *
 * 设计原则：
 * 1. 静默降级 — 任何异常不阻塞页面渲染，错误仅本地记录
 * 2. 无循环依赖 — 不引用 @/App，直接使用 import.meta.env 获取前缀
 * 3. 错误隔离 — try-catch 包裹所有异步逻辑
 */

const getBasePrefix = (): string => {
  try {
    return (import.meta as any)?.env?.VITE_PREFIX || '';
  } catch {
    return '';
  }
};

/** 构造带 basePrefix 的路径 */
const withPrefix = (path: string): string => {
  const prefix = getBasePrefix();
  if (!prefix) return path;
  const joined = prefix.endsWith('/') || path.startsWith('/') ? `${prefix}${path}` : `${prefix}/${path}`;
  return joined.replace(/([^:])\/+/g, '$1/');
};

export default function AzureCallback() {
  const { t } = useTranslation('loginCallback');
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const redirectParam = params.get('redirect');

        if (!code) {
          if (!cancelled) setErr(t('azure.missing_code'));
          return;
        }

        const { authCallbackAzure } = await import('@/services/login');
        const { AccessTokenKey } = await import('@/utils/constant');

        const res = await authCallbackAzure({
          code,
          state: state || '',
          redirect: redirectParam || withPrefix('/'),
        });

        if (cancelled) return;

        if (res?.err === '' && res?.dat?.access_token && res?.dat?.refresh_token) {
          try {
            localStorage.setItem(AccessTokenKey, res.dat.access_token);
            localStorage.setItem('refresh_token', res.dat.refresh_token);
          } catch (e) {
            console.warn('[AzureCallback] localStorage write failed:', e);
          }
          // 登录成功，跳转到后端指定的 redirect 或首页
          window.location.href = res.dat.redirect || withPrefix('/');
        } else if (res?.err) {
          if (!cancelled) setErr(res.err);
        } else {
          console.warn('[AzureCallback] unexpected response:', res?.dat);
          if (!cancelled) setErr(t('azure.unexpected'));
        }
      } catch (e: any) {
        console.warn('[AzureCallback] callback error:', e?.message || e);
        if (!cancelled) setErr(e?.message || t('azure.exception'));
      }
    };

    handleCallback();
    return () => { cancelled = true; };
  }, [t]);

  // 未出错时返回空，由路由框架渲染空白过渡
  if (err === undefined) return null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div>
        <h1>{t('azure.failed_title')}</h1>
        <div style={{ fontSize: 14, marginTop: 12, color: '#999' }}>{err}</div>
        <div style={{ marginTop: 24 }}>
          <a href={withPrefix('/login')}>{t('azure.back_to_login')}</a>
        </div>
      </div>
    </div>
  );
}
