/*
 * Copyright 2026 AIDO Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import React, { useEffect, useContext } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { CommonStateContext } from '@/App';
import Page403 from '@/pages/notFound/Page403';
import OutOfService from '@/pages/notFound/OutOfService';
import NotFound from '@/pages/notFound';
import Login from '@/pages/login';
import Overview from '@/pages/login/overview';
import LoginCallback from '@/pages/loginCallback';
import LoginCallbackCAS from '@/pages/loginCallback/cas';
import LoginCallbackOAuth from '@/pages/loginCallback/oauth';
import LoginCallbackCustom from '@/pages/loginCallback/Custom';
import LoginCallbackDingTalk from '@/pages/loginCallback/DingTalk';
import LoginCallbackFeishu from '@/pages/loginCallback/Feishu';
import AlertRules, { Add as AlertRuleAdd, Edit as AlertRuleEdit } from '@/pages/alertRules';
import Profile from '@/pages/account/profile';
import { List as Dashboard, Detail as DashboardDetail, Share as DashboardShare } from '@/pages/dashboard';
import Chart from '@/pages/chart';
import Groups from '@/pages/user/groups';
import Users from '@/pages/user/users';
import Business from '@/pages/user/business';
import { Metric as MetricExplore, Log as LogExplore } from '@/pages/explorer';
import IndexPatterns from '@/pages/log/IndexPatterns';
import ObjectExplore from '@/pages/monitor/object';
import Shield, { Add as AddShield, Edit as ShieldEdit } from '@/pages/warning/shield';
import Subscribe, { Add as SubscribeAdd, Edit as SubscribeEdit } from '@/pages/warning/subscribe';
import EventDetail from '@/pages/event/detail';
import HistoryEvents from '@/pages/historyEvents';
import Targets from '@/pages/targets';
import Demo from '@/pages/demo';
import TaskTpl from '@/pages/taskTpl';
import TaskTplAdd from '@/pages/taskTpl/add';
import TaskTplDetail from '@/pages/taskTpl/detail';
import TaskTplModify from '@/pages/taskTpl/modify';
import TaskTplClone from '@/pages/taskTpl/clone';
import Task from '@/pages/task';
import TaskAdd from '@/pages/task/add';
import TaskResult from '@/pages/task/result';
import TaskDetail from '@/pages/task/detail';
import Version from '@/pages/help/version';
import Servers from '@/pages/help/servers';
import Datasource, { Form as DatasourceAdd } from '@/pages/datasource';
import RecordingRule, { Add as RecordingRuleAdd, Edit as RecordingRuleEdit } from '@/pages/recordingRules';
import TraceExplorer, { Dependencies as TraceDependencies } from '@/pages/traceCpt/Explorer';
import Permissions from '@/pages/permissions';
import SSOConfigs from '@/pages/help/SSOConfigs';
import NotificationTpls from '@/pages/help/NotificationTpls';
import NotificationSettings from '@/pages/help/NotificationSettings';
import MigrateDashboards from '@/pages/help/migrate';
import VariableConfigs from '@/pages/variableConfigs';
import SiteSettings from '@/pages/siteSettings';
import SourceRegistry from '@/aido-extension/sourceregistry';
import RegularReport from '@/aido-extension/regularReport';
import RUMOverview from '@/aido-extension/rum/Overview';
import { dynamicPackages, Entry, dynamicPages } from '@/utils';
// @ts-ignore
import { Jobs as StrategyBrain } from 'plus:/datasource/anomaly';
// @ts-ignore
import plusLoader from 'plus:/utils/loader';
// @ts-ignore
import useIsPlus from 'plus:/components/useIsPlus';

const Packages = dynamicPackages();
const lazyRoutes = Packages.reduce((result: Entry['routes'], module: Entry) => {
  return (result = result.concat(module.routes));
}, [] as Entry['routes']);

const lazyPagesRoutes = _.reduce(
  dynamicPages(),
  (result: Entry['routes'], module: Entry) => {
    return (result = result.concat(module.routes));
  },
  [] as Entry['routes'],
);

function renderRouteWithSubRoutes(route: Entry['routes'][number], key: string | number) {
  const Component = route.component as unknown as React.ComponentType<{ routes?: unknown }>;
  const childRoutes = (route as Entry['routes'][number] & { routes?: unknown }).routes;
  return <Route key={key} path={route.path} element={<Component routes={childRoutes} />} />;
}

export default function Content() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPlus = useIsPlus();
  const { profile, siteInfo, perms } = useContext(CommonStateContext);

  useEffect(() => {
    /**
     * 这里是一个很脆弱的权限控制，期望的效果是菜单配置的路径和权限点匹配，如果没有权限则重定向到 403 页面
     * 但是目前无法把菜单配置和perms权限点一一对应
     * 所以这里现在只能通过白名单的方式来单独处理个别未配置权限点的路径
     */
    if (
      profile?.roles?.length > 0 &&
      !_.includes(['/', '/account/profile/info', '/account/profile/pwd', '/account/profile/token', '/alert-aggr-events'], location.pathname) &&
      !location.pathname.includes('/settings/datasource/edit/') &&
      !location.pathname.includes('/settings/infrastructure/add') &&
      !location.pathname.includes('/settings/source/')
    ) {
      if (profile?.roles.indexOf('Admin') === -1) {
        // 如果没有权限则重定向到 403 页面
        if (
          _.every(perms, (item) => {
            return location.pathname.indexOf(item) === -1;
          })
        ) {
          navigate('/403');
        }
      }
    }
  }, [location.pathname, navigate, perms, profile?.roles]);

  return (
    <div className='content'>
      <Routes>
        <Route path='/demo/*' element={<Demo />} />
        <Route path='/overview' element={<Overview />} />
        <Route path='/login' element={<Login />} />
        <Route path='/callback' element={<LoginCallback />} />
        <Route path='/callback/cas' element={<LoginCallbackCAS />} />
        <Route path='/callback/oauth' element={<LoginCallbackOAuth />} />
        <Route path='/callback/custom' element={<LoginCallbackCustom />} />
        <Route path='/callback/dingtalk' element={<LoginCallbackDingTalk />} />
        <Route path='/callback/feishu' element={<LoginCallbackFeishu />} />
        <Route path='/metric/explorer' element={<MetricExplore />} />
        <Route path='/log/explorer' element={<LogExplore />} />
        <Route path='/log/index-patterns' element={<IndexPatterns />} />
        <Route path='/object/explorer' element={<ObjectExplore />} />
        <Route path='/busi-groups/*' element={<Business />} />
        <Route path='/users/*' element={<Users />} />
        <Route path='/user-groups/*' element={<Groups />} />
        <Route path='/account/profile/:tab' element={<Profile />} />

        <Route path='/dashboard/:id' element={<DashboardDetail />} />
        <Route path='/dashboards/share/:id' element={<DashboardShare />} />
        <Route path='/dashboards/:id' element={<DashboardDetail />} />
        <Route path='/dashboards' element={<Dashboard />} />
        <Route path='/chart/:ids' element={<Chart />} />

        <Route path='/alert-rules/add/:bgid' element={<AlertRuleAdd />} />
        <Route path='/alert-rules/edit/:id' element={<AlertRuleEdit />} />
        <Route path='/alert-rules/brain/:id' element={<StrategyBrain />} />
        <Route path='/alert-rules' element={<AlertRules />} />
        <Route path='/alert-mutes/add/:from?' element={<AddShield />} />
        <Route path='/alert-mutes/edit/:id' element={<ShieldEdit />} />
        <Route path='/alert-mutes' element={<Shield />} />
        <Route path='/alert-subscribes/add' element={<SubscribeAdd />} />
        <Route path='/alert-subscribes/edit/:id' element={<SubscribeEdit />} />
        <Route path='/alert-subscribes' element={<Subscribe />} />

        {!isPlus && [
          <Route key='recording-rules-add' path='/recording-rules/add/:group_id' element={<RecordingRuleAdd />} />,
          <Route key='recording-rules-edit' path='/recording-rules/edit/:id' element={<RecordingRuleEdit />} />,
          <Route key='recording-rules' path='/recording-rules/:id?' element={<RecordingRule />} />,
        ]}

        <Route path='/alert-his-events/:eventId' element={<EventDetail />} />
        <Route path='/alert-cur-events/:eventId' element={<EventDetail />} />
        <Route path='/alert-his-events' element={<HistoryEvents />} />
        <Route path='/targets' element={<Targets />} />

        <Route path='/job-tpls/add/task' element={<TaskAdd />} />
        <Route path='/job-tpls/add' element={<TaskTplAdd />} />
        <Route path='/job-tpls/:id/detail' element={<TaskTplDetail />} />
        <Route path='/job-tpls/:id/modify' element={<TaskTplModify />} />
        <Route path='/job-tpls/:id/clone' element={<TaskTplClone />} />
        <Route path='/job-tpls' element={<TaskTpl />} />
        <Route path='/job-tasks/add' element={<TaskAdd />} />
        <Route path='/job-tasks/:id/result' element={<TaskResult />} />
        <Route path='/job-tasks/:id/detail' element={<TaskDetail />} />
        <Route path='/job-tasks' element={<Task />} />

        <Route path='/system/version' element={<Version />} />
        <Route path='/system/alerting-engines' element={<Servers />} />
        <Route path='/source-registry' element={<SourceRegistry />} />
        <Route path='/regular-report' element={<RegularReport />} />
        <Route path='/rum' element={<RUMOverview />} />
        <Route path='/datasources/:action/:type/:id' element={<DatasourceAdd />} />
        <Route path='/datasources/:action/:type' element={<DatasourceAdd />} />
        <Route path='/datasources' element={<Datasource />} />
        <Route path='/system/sso-settings' element={<SSOConfigs />} />
        <Route path='/help/notification-tpls' element={<NotificationTpls />} />
        <Route path='/help/notification-settings' element={<NotificationSettings />} />
        <Route path='/help/migrate' element={<MigrateDashboards />} />
        <Route path='/system/variable-settings' element={<VariableConfigs />} />

        <Route path='/trace/explorer' element={<TraceExplorer />} />
        <Route path='/trace/dependencies' element={<TraceDependencies />} />

        <Route path='/roles' element={<Permissions />} />

        {import.meta.env.VITE_IS_ENT !== 'true' && <Route path='/system/site-settings' element={<SiteSettings />} />}

        {lazyRoutes.map((route, i) => renderRouteWithSubRoutes(route, i))}
        {_.map(lazyPagesRoutes, (route, i) => renderRouteWithSubRoutes(route, `lazy-page-${i}`))}
        {_.map(plusLoader.routes, (route, i) => renderRouteWithSubRoutes(route, `plus-${i}`))}
        <Route path='/' element={<Navigate to={siteInfo?.home_page_url || '/metric/explorer'} replace />} />
        <Route path='/403' element={<Page403 />} />
        <Route path='/404' element={<NotFound />} />
        <Route path='/out-of-service' element={<OutOfService />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </div>
  );
}
