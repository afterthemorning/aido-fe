import React, { useEffect, useState, createContext, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Empty, Modal, Spin, Layout, theme } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import enUS from 'antd/lib/locale/en_US';
import ruRU from 'antd/lib/locale/ru_RU';
import 'antd/dist/reset.css';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';

import TaskOutput from '@/pages/taskOutput';
import TaskHostOutput from '@/pages/taskOutput/host';
import { getAuthorizedDatasourceCates, Cate } from '@/components/AdvancedWrap';
import { GetProfile } from '@/services/account';
import { getBusiGroups, getDatasourceBriefList, getMenuPerm, getInstallDate } from '@/services/common';
import { getLicense } from '@/components/AdvancedWrap';
import { getVersions } from '@/components/pageLayout/Version/services';
import { getCleanBusinessGroupIds, getDefaultBusiness, getVaildBusinessGroup } from '@/components/BusinessGroup';
import Feedback from '@/components/Feedback';
import { IRawTimeRange } from '@/components/TimeRangePicker';
import { getN9eConfig } from '@/pages/siteSettings/services';
import { getDarkMode, updateDarkMode } from '@/utils/darkMode';
import { AccessTokenKey } from '@/utils/constant';
import SharedDetail from '@/pages/event/DetailNG/SharedDetail';
import HocRenderer from './components/HocRenderer';
import HeaderMenu from './components/SideMenu';
import Content from './routers';

// @ts-ignore
import useIsPlus from 'plus:/components/useIsPlus';

import './App.less';

const { Content: AntContent } = Layout;

interface IProfile {
  admin?: boolean;
  nickname: string;
  role: string;
  roles: string[];
  username: string;
  email: string;
  phone: string;
  id: number;
  portrait: string;
  contacts: { string?: string };
}

interface Datasource {
  id: number;
  name: string;
  plugin_type: string;
  is_default: boolean;
  identifier?: string;
  status?: string | number | boolean;
}

function isDatasourceEnabled(item: Datasource) {
  if (item.status === undefined || item.status === null) return true;
  if (item.status === 'enabled' || item.status === 1 || item.status === true) return true;
  return false;
}

function normalizeDatasourceList(datasourceList: Datasource[]) {
  return _.filter(datasourceList, isDatasourceEnabled);
}

export interface ICommonState {
  datasourceCateOptions: Cate[];
  groupedDatasourceList: { [index: string]: Datasource[] };
  reloadGroupedDatasourceList: () => void;
  datasourceList: Datasource[];
  setDatasourceList: (list: Datasource[]) => void;
  reloadDatasourceList: () => void;
  busiGroups: { name: string; id: number; label_value?: string }[];
  setBusiGroups: (groups: { name: string; id: number }[]) => void;
  curBusiId: number;
  setCurBusiId: (id: number) => void;
  businessGroup: { key?: string; ids?: string; id?: number; isLeaf?: boolean };
  setBusiGroup: (group: { key?: string; ids?: string; id?: number; isLeaf?: boolean }) => void;
  getVaildBusinessGroup: (busiGroups: any[], businessGroupKey: { key?: string; ids?: string; id?: number; isLeaf?: boolean }) => void;
  businessGroupOnChange: (key: string) => void;
  profile: IProfile;
  setProfile: (profile: IProfile) => void;
  licenseRulesRemaining?: number;
  licenseExpireDays?: number;
  licenseExpired: boolean;
  versions: { version: string; github_verison: string; newVersion: boolean };
  feats?: { fcBrain: boolean; plugins: any[] };
  isPlus: boolean;
  siteInfo?: { [index: string]: string };
  sideMenuBgMode: string;
  setSideMenuBgMode: (color: string) => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
  dashboardDefaultRangeIndex?: string;
  esIndexMode: string;
  dashboardSaveMode: 'auto' | 'manual';
  perms?: string[];
  screenTemplates?: string[];
  tablePaginationPosition?: string;
  installTs: number;
  i18nList?: string[];
  rangePickerShowSecond?: boolean;
  logsDefaultRange: IRawTimeRange;
  reloadPerms: () => void;
}

export const basePrefix = import.meta.env.VITE_PREFIX || '';

const anonymousRoutes = [
  `${basePrefix}/login`, `${basePrefix}/callback`,
  `${basePrefix}/chart`, `${basePrefix}/dashboards/share/`,
  `${basePrefix}/share/alert-his-events/`,
];

const anonymous = _.some(anonymousRoutes, (route) => location.pathname.startsWith(route));
export const CommonStateContext = createContext({} as ICommonState);

function App() {
  const { t, i18n } = useTranslation(['common', 'datasource']);
  const isPlus = useIsPlus();
  const initialized = useRef(false);
  const [commonState, setCommonState] = useState<ICommonState>({
    datasourceCateOptions: [],
    groupedDatasourceList: {},
    reloadGroupedDatasourceList: async () => {
      const datasourceList = normalizeDatasourceList(await getDatasourceBriefList());
      setCommonState((state) => ({ ...state, groupedDatasourceList: _.groupBy(datasourceList, 'plugin_type') }));
    },
    datasourceList: [],
    setDatasourceList: (datasourceList) => {
      datasourceList = normalizeDatasourceList(datasourceList);
      setCommonState((state) => ({ ...state, datasourceList, groupedDatasourceList: _.groupBy(datasourceList, 'plugin_type') }));
    },
    reloadDatasourceList: async () => {
      const { feats } = await getLicense(t);
      const datasourceList = normalizeDatasourceList(await getDatasourceBriefList());
      const datasourceCateOptions = getAuthorizedDatasourceCates(feats, isPlus, (cate) => {
        const groupedDatasourceList = _.groupBy(datasourceList, 'plugin_type');
        return !_.isEmpty(groupedDatasourceList[cate.value]);
      });
      setCommonState((state) => ({ ...state, datasourceList, groupedDatasourceList: _.groupBy(datasourceList, 'plugin_type'), datasourceCateOptions }));
    },
    busiGroups: [],
    setBusiGroups: (busiGroups) => setCommonState((state) => ({ ...state, busiGroups })),
    curBusiId: window.localStorage.getItem('curBusiId') ? Number(window.localStorage.getItem('curBusiId')) : 0,
    setCurBusiId: (id: number) => {
      window.localStorage.setItem('curBusiId', String(id));
      setCommonState((state) => ({ ...state, curBusiId: id }));
    },
    businessGroup: {},
    setBusiGroup: (businessGroup) => setCommonState((state) => ({ ...state, businessGroup })),
    getVaildBusinessGroup,
    businessGroupOnChange: (key: string) => {
      window.localStorage.setItem('businessGroupKey', key);
      const ids = getCleanBusinessGroupIds(key);
      setCommonState((state) => ({ ...state, businessGroup: { key, ids, id: _.map(_.split(ids, ','), _.toNumber)?.[0], isLeaf: !_.startsWith(key, 'group,') } }));
    },
    profile: {} as IProfile,
    setProfile: (profile: IProfile) => setCommonState((state) => ({ ...state, profile })),
    reloadPerms: async () => {
      const { dat: perms } = (await getMenuPerm()) || {};
      setCommonState((state) => ({ ...state, perms }));
    },
    licenseExpired: false,
    versions: { version: '', github_verison: '', newVersion: false },
    isPlus,
    sideMenuBgMode: localStorage.getItem('sideMenuBgMode') || 'light',
    setSideMenuBgMode: (mode: string) => {
      window.localStorage.setItem('sideMenuBgMode', mode);
      setCommonState((state) => ({ ...state, sideMenuBgMode: mode }));
    },
    darkMode: getDarkMode(),
    setDarkMode: (mode: boolean) => {
      updateDarkMode(mode);
      setCommonState((state) => ({ ...state, darkMode: mode }));
    },
    esIndexMode: 'all',
    dashboardSaveMode: 'manual',
    screenTemplates: [],
    installTs: 0,
    logsDefaultRange: { start: 'now-1h', end: 'now' },
  });

  const removePreloader = () => {
    const preloader = document.querySelector('.preloader');
    if (preloader) preloader.remove();
  };

  useEffect(() => {
    if (location.pathname === '/out-of-service') {
      initialized.current = true;
      removePreloader();
      return;
    }
    if (!anonymous && !localStorage.getItem(AccessTokenKey) && !localStorage.getItem('refresh_token')) {
      const redirect = `${basePrefix}/login${location.pathname !== `${basePrefix}/` ? `?redirect=${encodeURIComponent(location.pathname + location.search)}` : ''}`;
      location.href = redirect;
      return;
    }
    (async () => {
      const iconLink = document.querySelector("link[rel~='icon']") as any;
      let siteInfo;
      const siteInfoStr = await getN9eConfig('site_info');
      if (siteInfoStr) {
        try { siteInfo = JSON.parse(siteInfoStr); } catch (e) { console.error(e); }
      }
      document.title = siteInfo?.page_title || 'AIDO';
      if (iconLink) {
        const favicon = siteInfo?.favicon_url || '/image/favicon.ico';
        if (/^(https?:)?\/\//.test(favicon) || favicon.startsWith('data:')) {
          iconLink.href = favicon;
        } else if (basePrefix && favicon.startsWith('/') && !favicon.startsWith(`${basePrefix}/`)) {
          iconLink.href = `${basePrefix}${favicon}`;
        } else {
          iconLink.href = favicon;
        }
      }
      if (siteInfo?.font_family) document.body.style.fontFamily = siteInfo.font_family;
      if (!anonymous) {
        const installTs = await getInstallDate();
        const { dat: profile } = (await GetProfile()) || {};
        const { dat: busiGroups } = (await getBusiGroups()) || {};
        const { dat: perms } = (await getMenuPerm()) || {};
        const datasourceList = normalizeDatasourceList(await getDatasourceBriefList());
        const { licenseRulesRemaining, licenseExpireDays, feats } = await getLicense(t);
        let versions = { version: '', github_verison: '', newVersion: false };
        if (!isPlus) versions = (await getVersions()) || versions;
        const defaultBusiId = busiGroups?.[0]?.id;
        window.localStorage.setItem('curBusiId', String(defaultBusiId));
        initialized.current = true;
        removePreloader();
        setCommonState((state) => ({
          ...state, installTs, profile, busiGroups,
          businessGroup: getDefaultBusiness(busiGroups),
          datasourceCateOptions: getAuthorizedDatasourceCates(feats, isPlus, (cate) => {
            const groupedDatasourceList = _.groupBy(datasourceList, 'plugin_type');
            return !_.isEmpty(groupedDatasourceList[cate.value]);
          }),
          groupedDatasourceList: _.groupBy(datasourceList, 'plugin_type'),
          datasourceList, curBusiId: defaultBusiId,
          licenseRulesRemaining, licenseExpireDays,
          licenseExpired: licenseExpireDays !== undefined && licenseExpireDays <= 0,
          versions, feats, siteInfo, perms,
        }));
      } else {
        const datasourceList = !_.some(
          [`${basePrefix}/login`, `${basePrefix}/callback`, `${basePrefix}/share/alert-his-events/`],
          (route) => location.pathname.startsWith(route),
        ) ? normalizeDatasourceList(await getDatasourceBriefList()) : [];
        removePreloader();
        initialized.current = true;
        setCommonState((state) => ({ ...state, groupedDatasourceList: _.groupBy(datasourceList, 'plugin_type'), datasourceList, siteInfo }));
      }
    })();
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith('/login')) {
      document.body.className = commonState.darkMode ? 'theme-dark' : 'theme-light';
      localStorage.setItem('aido-dark-mode', _.toString(commonState.darkMode));
      window.dispatchEvent(new Event('aido-dark-mode-update'));
    }
  }, [commonState.darkMode]);

  if (!initialized.current) return null;

  return (
    <ConfigProvider
      locale={i18n.language == 'en_US' ? enUS : i18n.language == 'ru_RU' ? ruRU : zhCN}
      empty={{ image: Empty.PRESENTED_IMAGE_DEFAULT }}
      warning={{ strict: false }}
      theme={{ algorithm: commonState.darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}
    >
      <CommonStateContext.Provider value={commonState}>
        <Router basename={basePrefix}>
          <Layout style={{ minHeight: '100vh' }}>
            <Routes>
              <Route path='/job-task/:busiId/output/:taskId/:outputType' element={<TaskOutput />} />
              <Route path='/job-task/:busiId/output/:taskId/:host/:outputType' element={<TaskHostOutput />} />
              <Route path='/share/alert-his-events/:eventId' element={<SharedDetail />} />
              <Route path='*' element={
                <Layout style={{ minHeight: '100vh' }}>
                  <HeaderMenu />
                  <AntContent style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                    <Content />
                    <HocRenderer />
                  </AntContent>
                </Layout>
              } />
            </Routes>
            <Feedback />
          </Layout>
        </Router>
      </CommonStateContext.Provider>
    </ConfigProvider>
  );
}

export default App;
