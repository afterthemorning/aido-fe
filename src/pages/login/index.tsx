import React, { useState, useEffect, useRef, useContext } from 'react';
import { Form, Input, Button, message, Space, Divider, Typography, Card, Grid } from 'antd';
import { useLocation } from 'react-router-dom';
import { UserOutlined, LockOutlined, PictureOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';

import {
  ifShowCaptcha, getCaptcha, getSsoConfig,
  getRedirectURL, getRedirectURLCAS, getRedirectURLOAuth,
  getRedirectURLCustom, getRedirectURLDingtalk, getRedirectURLFeishu,
  getRedirectURLAzure, authLogin, getRSAConfig,
} from '@/services/login';
import { RsaEncry } from '@/utils/rsa';
import { CommonStateContext, basePrefix } from '@/App';
import { AccessTokenKey } from '@/utils/constant';

import useSsoWay from 'plus:/parcels/SSOConfigs/useSsoWay';
import { NAME_SPACE } from './constants';
import './locale';
import './login.less';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const i18nMap: Record<string, string> = {
  zh_CN: '简体',
  en_US: 'EN',
};

export interface DisplayName {
  oidc: string; cas: string; oauth: string;
  custom?: string; dingTalk?: string; feishu?: string; azure?: string;
}

export default function Login() {
  const { t, i18n } = useTranslation(NAME_SPACE);
  const [form] = Form.useForm();
  const location = useLocation();
  const { siteInfo } = useContext(CommonStateContext);
  const screens = useBreakpoint();
  const redirect = (location.search && new URLSearchParams(location.search).get('redirect')) || '';
  const isMobile = !screens.md;

  const [displayName, setDis] = useState<DisplayName>({
    oidc: '', cas: '', oauth: '', custom: '', dingTalk: '', feishu: '', azure: '',
  });
  const [showcaptcha, setShowcaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  const verifyimgRef = useRef<HTMLImageElement>(null);
  const captchaidRef = useRef<string>();

  const refreshCaptcha = () => {
    getCaptcha().then((res) => {
      if (res.dat && verifyimgRef.current) {
        verifyimgRef.current.src = res.dat.imgdata;
        captchaidRef.current = res.dat.captchaid;
      }
    });
  };

  useSsoWay(redirect);

  useEffect(() => {
    getSsoConfig().then((res) => {
      if (res.dat) {
        setDis({
          oidc: res.dat.oidcDisplayName || '',
          cas: res.dat.casDisplayName || '',
          oauth: res.dat.oauthDisplayName || '',
          custom: res.dat.customDisplayName || '',
          dingTalk: res.dat.dingTalkDisplayName || '',
          feishu: res.dat.feishuDisplayName || '',
          azure: res.dat.azureDisplayName || '',
        });
      }
    });
    ifShowCaptcha().then((res) => {
      setShowcaptcha(res?.dat?.show);
      if (res?.dat?.show) refreshCaptcha();
    });
  }, []);

  const handleSubmit = () => form.validateFields().then(() => login());

  const login = async () => {
    setLoading(true);
    try {
      const { username, password, verifyvalue } = form.getFieldsValue();
      const rsaConf = await getRSAConfig();
      const authPassWord = rsaConf?.dat?.OpenRSA ? RsaEncry(password, rsaConf.dat.RSAPublicKey) : password;
      const res = await authLogin(username, authPassWord, captchaidRef.current!, verifyvalue);
      const { access_token, refresh_token } = res.dat || {};
      if (access_token && refresh_token) {
        localStorage.setItem(AccessTokenKey, access_token);
        localStorage.setItem('refresh_token', refresh_token);
        window.location.href = redirect || `${basePrefix}/`;
      }
    } catch {
      if (showcaptcha) refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const ssoProviders = [
    { key: 'oidc', name: displayName.oidc, onClick: () => getRedirectURL(redirect).then((r) => { if (r.dat) window.location.href = r.dat; }) },
    { key: 'cas', name: displayName.cas, onClick: () => getRedirectURLCAS(redirect).then((r) => { if (r.dat) { localStorage.setItem('CAS_state', r.dat.state); window.location.href = r.dat.redirect; } }) },
    { key: 'oauth', name: displayName.oauth, onClick: () => getRedirectURLOAuth(redirect).then((r) => { if (r.dat) window.location.href = r.dat; }) },
    { key: 'custom', name: displayName.custom, onClick: () => getRedirectURLCustom(redirect).then((r) => { if (r.dat) window.location.href = r.dat; }) },
    { key: 'dingTalk', name: displayName.dingTalk, onClick: () => getRedirectURLDingtalk(redirect).then((r) => { if (r.dat) window.location.href = r.dat; }) },
    { key: 'feishu', name: displayName.feishu, onClick: () => getRedirectURLFeishu(redirect).then((r) => { if (r.dat) window.location.href = r.dat; }) },
    { key: 'azure', name: displayName.azure, onClick: () => getRedirectURLAzure(redirect).then((r) => { if (r.dat) window.location.href = r.dat; }) },
  ].filter((p) => p.name);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5',
      padding: 24,
    }}>
      <Card
        style={{
          width: isMobile ? '100%' : 420,
          maxWidth: '100%',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: 8 }}>
          <SafetyCertificateOutlined style={{ fontSize: 48, color: '#6C53B1', marginBottom: 8 }} />
          <Title level={3} style={{ margin: 0, fontWeight: 600 }}>AIDO</Title>
          <Text type='secondary' style={{ fontSize: 13 }}>{t('login')}</Text>
        </div>

        <Form form={form} layout='vertical' requiredMark={false} size='large'>
          <Form.Item name='username' rules={[{ required: true, message: t('username_required') }]}>
            <Input prefix={<UserOutlined />} placeholder={t('username')} autoFocus />
          </Form.Item>
          <Form.Item name='password' rules={[{ required: true, message: t('password_required') }]}>
            <Input.Password prefix={<LockOutlined />} placeholder={t('password')} onPressEnter={handleSubmit} />
          </Form.Item>

          {showcaptcha && (
            <Form.Item name='verifyvalue' rules={[{ required: true, message: t('verifyvalue_required') }]}>
              <Space style={{ width: '100%' }}>
                <Input prefix={<PictureOutlined />} placeholder={t('verifyvalue')} onPressEnter={handleSubmit} />
                <img ref={verifyimgRef} onClick={refreshCaptcha} alt='captcha' style={{ height: 40, cursor: 'pointer', borderRadius: 4 }} />
              </Space>
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 12 }}>
            <Button type='primary' block loading={loading} onClick={handleSubmit} style={{ height: 44 }}>
              {t('login')}
            </Button>
          </Form.Item>
        </Form>

        {ssoProviders.length > 0 && (
          <>
            <Divider plain style={{ fontSize: 12, margin: '8px 0' }}>
              <Text type='secondary'>{t('other_types')}</Text>
            </Divider>
            <Space wrap style={{ justifyContent: 'center', width: '100%' }}>
              {ssoProviders.map((p) => (
                <Button key={p.key} size='small' onClick={p.onClick}>{p.name}</Button>
              ))}
            </Space>
          </>
        )}

        <Divider plain style={{ fontSize: 12, margin: '16px 0 0' }}>
          <Text type='secondary'>{t('language')}</Text>
        </Divider>
        <Space style={{ justifyContent: 'center', width: '100%' }}>
          {Object.entries(i18nMap).map(([lang, label]) => (
            <Button
              key={lang}
              type='link'
              size='small'
              disabled={i18n.language === lang}
              onClick={() => { i18n.changeLanguage(lang); localStorage.setItem('language', lang); }}
            >
              {label}
            </Button>
          ))}
        </Space>
      </Card>
    </div>
  );
}
