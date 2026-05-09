import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Button, Space, Tooltip } from 'antd';
import { DownOutlined, RollbackOutlined, HistoryOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import querystring from 'query-string';
import _ from 'lodash';

import { Logout } from '@/services/login';
import AdvancedWrap, { License } from '@/components/AdvancedWrap';
import { CommonStateContext } from '@/App';
import { AccessTokenKey, IS_ENT, IS_PLUS } from '@/utils/constant';
import DarkModeSelect from '@/components/DarkModeSelect';
import DropdownCompat from '@/components/AntdDropdownCompat';
import Version from '../Version';
import HelpLink from '../HelpLink';
import DocLink from './DocLink';
import '../locale';

import LanguageIcon from '../icons/LanguageIcon';
import DocIcon from '../icons/DocIcon';

export { HelpLink };

interface IPageLayoutProps {
  icon?: React.ReactNode;
  title?: string | JSX.Element;
  children?: React.ReactNode;
  rightArea?: React.ReactNode;
  customArea?: React.ReactNode;
  showBack?: boolean;
  backPath?: string;
  doc?: string;
}

const i18nMap: Record<string, string> = {
  zh_CN: '简体',
  en_US: 'En',
};

const PageLayout: React.FC<IPageLayoutProps> = ({ icon, title, rightArea, children, customArea, showBack, backPath, doc }) => {
  const { t, i18n } = useTranslation('pageLayout');
  const navigate = useNavigate();
  const location = useLocation();
  const query = querystring.parse(location.search);
  const { profile, siteInfo } = useContext(CommonStateContext);
  const embed = localStorage.getItem('embed') === '1' && window.self !== window.top;

  const userMenuItems = [
    { key: 'profile', label: t('profile'), onClick: () => navigate('/account/profile/info') },
    ...(!IS_ENT ? [] as any : []),
    { type: 'divider' as const },
    { key: 'logout', label: t('logout'), danger: true, onClick: async () => { await Logout(); localStorage.removeItem(AccessTokenKey); localStorage.removeItem('refresh_token'); localStorage.removeItem('curBusiId'); navigate('/login'); } },
  ];

  const langMenuItems = Object.keys(i18nMap).map((el) => ({
    key: el,
    label: i18nMap[el],
    onClick: () => { i18n.changeLanguage(el); localStorage.setItem('language', el); },
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!embed && !customArea && (
        <div
          style={{
            display: query.viewMode === 'fullscreen' ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 48,
            padding: '0 16px',
            borderBottom: '1px solid var(--fc-border-color, #f0f0f0)',
            background: 'var(--fc-fill-2, #fafafa)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
            {showBack && window.history.state && (
              <RollbackOutlined style={{ cursor: 'pointer', fontSize: 14, flexShrink: 0 }} onClick={() => (backPath ? navigate(backPath) : navigate(-1))} />
            )}
            {icon}
            {title && <span style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>}
            {IS_ENT && doc && <DocLink link={doc} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Version />
            <span style={{ fontSize: 12 }}>{rightArea}</span>
            <AdvancedWrap var="VITE_IS_PRO,VITE_IS_ENT">
              <License />
            </AdvancedWrap>
            {!IS_ENT && IS_PLUS && (
              <Button type="text" size="small" href={siteInfo?.document_url || 'https://flashcat.cloud/docs'} target="_blank">
                <Tooltip title={t('docs')}>
                  <DocIcon style={{ fontSize: 12 }} />
                </Tooltip>
              </Button>
            )}
            {!IS_ENT && (
              <Tooltip title="Changelog">
                <Button size="small" type="text" icon={<HistoryOutlined />} className="product-changelog" />
              </Tooltip>
            )}
            <DropdownCompat menu={{ items: langMenuItems }} trigger={['click']}>
              <Button size="small" type="text"><LanguageIcon /></Button>
            </DropdownCompat>
            <DarkModeSelect />
            <DropdownCompat menu={{ items: userMenuItems }} trigger={['click']}>
              <Space style={{ cursor: 'pointer', gap: 6 }}>
                <Avatar size={24} src={profile?.portrait || '/image/avatar1.png'} />
                <span style={{ fontSize: 13 }}>{profile?.nickname || profile?.username}</span>
                <DownOutlined style={{ fontSize: 10 }} />
              </Space>
            </DropdownCompat>
          </div>
        </div>
      )}
      {customArea}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
