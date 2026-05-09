import React, { useEffect, useMemo, useRef, useState, useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import _ from 'lodash';
import querystring from 'query-string';
import { useTranslation } from 'react-i18next';

import { CommonStateContext } from '@/App';
import { IS_ENT } from '@/utils/constant';
import { getEmbeddedProducts } from '@/pages/embeddedProduct/services';
import { eventBus, EVENT_KEYS } from '@/pages/embeddedProduct/eventBus';
import { DETAIL_PATH as embeddedProductDetailPath } from '@/pages/embeddedProduct/constants';
import { V8_BETA_14_TS } from '@/utils/constant';
import { usePermissionsRefresh } from '@/utils/usePermissionsRefresh';

import { cn, getCurrentMenuList, getSavedPath } from './utils';
import SideMenuHeader from './Header';
import { IMenuItem } from './types';

const { Sider } = Layout;

const calcUrlPath = (url: string) => url.split('?')[0];

interface SideMenuProps {
  topExtra?: React.ReactElement;
  getMenuList?: (embeddedProductMenu?: IMenuItem[], hideDeprecatedMenus?: boolean) => IMenuItem[];
  onMenuClick?: (key: string) => void;
  isGoldTheme?: boolean;
}

const SideMenu = (props: SideMenuProps) => {
  const { t } = useTranslation('sideMenu');
  const { darkMode, perms, installTs } = useContext(CommonStateContext);
  const { topExtra, getMenuList = getCurrentMenuList, onMenuClick, isGoldTheme } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const query = querystring.parse(location.search);
  const [collapsed, setCollapsed] = useState<boolean>(Number(localStorage.getItem('menuCollapsed')) === 1);
  const [responsiveCollapsed, setResponsiveCollapsed] = useState(false);
  const quickMenuRef = useRef<{ open: () => void }>({ open: () => {} });
  const [embeddedProductMenu, setEmbeddedProductMenu] = useState<IMenuItem[]>([]);

  const hideSideMenu = useMemo(() => {
    if (
      sessionStorage.getItem('menuHide') === '1' || query?.menu === 'hide' ||
      location.pathname === '/login' || location.pathname.startsWith('/chart/') ||
      location.pathname.startsWith('/events/screen/') || location.pathname.startsWith('/dashboards/share/') ||
      location.pathname.startsWith('/callback') ||
      location.pathname.indexOf('/polaris/screen-v2/detail') === 0 ||
      location.pathname.indexOf('/polaris/screen/detail') === 0 ||
      location.pathname.indexOf('/firemap/screen/') === 0 ||
      location.pathname.indexOf('/firemap/screen-detail') === 0 ||
      location.pathname.indexOf('/topology-v2/detail') === 0 ||
      location.pathname.indexOf('/jiesuan/detail') === 0 ||
      location.pathname.indexOf('/template/screens/detail') === 0
    ) return true;
    if (location.pathname.indexOf('/dashboard') === 0 || location.pathname.indexOf('/embedded-dashboards') === 0 || location.pathname.indexOf('/components/dashboard/detail') === 0) {
      return querystring.parse(location.search)?.viewMode === 'fullscreen';
    }
    return false;
  }, [location.pathname, location.search, query?.menu]);

  const hideDeprecatedMenus = installTs > V8_BETA_14_TS;

  // 启动权限自动刷新（事件驱动 + 30s 兜底轮询）
  usePermissionsRefresh();

  const fetchEmbeddedProducts = useCallback(() => {
    if (hideSideMenu) return;
    getEmbeddedProducts().then((res) => {
      if (res) {
        setEmbeddedProductMenu(res.map((product) => ({
          key: `${embeddedProductDetailPath}/${product.id}`,
          label: product.name,
          children: [],
        })));
      }
    });
  }, [hideSideMenu]);

  useEffect(() => {
    fetchEmbeddedProducts();
    eventBus.on(EVENT_KEYS.EMBEDDED_PRODUCT_UPDATED, fetchEmbeddedProducts);
    return () => { eventBus.off(EVENT_KEYS.EMBEDDED_PRODUCT_UPDATED, fetchEmbeddedProducts); };
  }, [fetchEmbeddedProducts]);

  const menus = useMemo(() => {
    const currentMenuList = getMenuList(embeddedProductMenu, hideDeprecatedMenus);
    return currentMenuList
      .map((menu: any) => {
        const filteredChildren = (menu.children || [])
          .map((child: any) => {
            if (child.key.startsWith(`${embeddedProductDetailPath}/`)) return child;
            if (menu.key === '/flashduty') return perms?.includes('/flashduty') ? child : null;
            if (child.type === 'tabs' && child.children) {
              const filteredTabs = child.children.filter((tab) => perms?.includes(tab.key));
              return filteredTabs.length > 0 ? { ...child, children: filteredTabs } : null;
            }
            return perms?.includes(calcUrlPath(child.key)) ? child : null;
          })
          .filter(Boolean);
        return filteredChildren.length > 0 ? { ...menu, children: filteredChildren } : null;
      })
      .filter(Boolean) as IMenuItem[];
  }, [embeddedProductMenu, perms, hideDeprecatedMenus, getMenuList]);

  const selectedKeys = useMemo(() => {
    let finalPath = [''];
    menus.forEach((menu) => {
      if (!menu.children) return;
      menu.children.forEach((child) => {
        const path = calcUrlPath(child.key);
        if (location.pathname.startsWith(path) && path.length > finalPath[0].length) {
          finalPath = [child.key];
        }
        if (child.type === 'tabs' && child.children) {
          child.children.forEach((tab) => {
            const tabPath = calcUrlPath(tab.key);
            if (location.pathname.startsWith(tabPath) && tabPath.length > finalPath[0].length) {
              finalPath = [tab.key];
            }
          });
        }
      });
    });
    return finalPath;
  }, [menus, location.pathname]);

  const openKeys = useMemo(() => {
    const keys: string[] = [];
    menus.forEach((menu: any) => {
      if ((menu.children || []).some((c: any) => selectedKeys.includes(c.key) || (c.children || []).some((t: any) => selectedKeys.includes(t.key)))) {
        keys.push(menu.key);
      }
    });
    return keys;
  }, [menus, selectedKeys]);

  const buildMenuItems = (items: IMenuItem[]): any[] => {
    return items.map((item) => {
      if (item.pathType === 'absolute') {
        return {
          key: item.key,
          label: (
            <a href={item.path} target={item.target} rel="noopener noreferrer">
              {t(item.label)}
              {item.beta && <span style={{ fontSize: 10, color: '#faad14', marginLeft: 4 }}>Beta</span>}
            </a>
          ),
          icon: item.icon,
        };
      }
      if (item.children && item.children.length > 0) {
        return {
          key: item.key,
          label: t(item.label),
          icon: item.icon,
          children: item.children.map((child) => {
            const childPath = child.type === 'tabs' && child.children?.[0] ? getSavedPath(child.key) || child.children[0].key : child.key;
            return {
              key: child.key,
              label: t(child.label),
            };
          }),
        };
      }
      return {
        key: item.key,
        label: t(item.label),
        icon: item.icon,
      };
    });
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    onMenuClick?.(key);
    const findPath = (items: IMenuItem[]): string | null => {
      for (const item of items) {
        if (item.key === key) {
          if (item.type === 'tabs' && item.children?.[0]) return item.children[0].key;
          return item.key;
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.key === key) {
              if (child.type === 'tabs' && child.children?.[0]) return child.children[0].key;
              return child.key;
            }
          }
        }
      }
      return null;
    };
    const path = findPath(menus);
    if (path) navigate(path);
  };

  const handleBreakpoint = (broken: boolean) => {
    setResponsiveCollapsed(broken);
  };

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('menuCollapsed', next ? '1' : '0');
  };

  if (hideSideMenu) return null;

  const effectiveCollapsed = collapsed || responsiveCollapsed;

  return (
    <Sider
      collapsible
      collapsed={effectiveCollapsed}
      onCollapse={toggleCollapse}
      breakpoint="lg"
      onBreakpoint={handleBreakpoint}
      collapsedWidth={64}
      width={200}
      theme={darkMode ? 'dark' : 'light'}
      className="side-menu"
      trigger={null}
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        overflow: 'auto',
        borderRight: '1px solid var(--fc-border-color)',
      }}
    >
      <SideMenuHeader collapsed={effectiveCollapsed} />
      <div
        onClick={() => quickMenuRef.current.open()}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          margin: '0 8px 8px',
          borderRadius: 6,
          cursor: 'pointer',
          color: 'var(--fc-text-4)',
          fontSize: effectiveCollapsed ? 16 : 14,
        }}
        className="side-menu-search-trigger"
      >
        <SearchOutlined style={{ marginRight: effectiveCollapsed ? 0 : 8 }} />
        {!effectiveCollapsed && <span>{t('quickJump')}</span>}
      </div>
      {topExtra}
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        defaultOpenKeys={openKeys}
        onClick={handleMenuClick}
        items={buildMenuItems(menus)}
        theme={darkMode ? 'dark' : 'light'}
        style={{ border: 'none' }}
      />
      <div
        onClick={toggleCollapse}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 40,
          cursor: 'pointer',
          borderTop: '1px solid var(--fc-border-color)',
          marginTop: 'auto',
          color: 'var(--fc-text-4)',
        }}
      >
        {effectiveCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </div>
    </Sider>
  );
};

export default SideMenu;
