import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import queryString from 'query-string';
import { Input, Drawer, Space, Tabs, Button, Modal, Tooltip } from 'antd';
import { SafetyCertificateOutlined, SearchOutlined, CloseOutlined, EditOutlined, DeleteOutlined, StopOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/pageLayout';
import AuthorizationWrapper from '@/components/AuthorizationWrapper';
import { IS_PLUS } from '@/utils/constant';
import Instructions from './Instructions';
import AlertRules from './AlertRules';
import CollectTpls from './CollectTpls';
import Metrics from './Metrics';
import Dashboards from './Dashboards';
import { getComponents, Component, deleteComponents, putComponent } from './services';
import ComponentFormModal from './components/ComponentFormModal';
import { IS_ENT } from '@/utils/constant';

// @ts-ignore
import Firemap from 'plus:/parcels/builtInComponents/Firemap';

const LIST_SEARCH_VALUE = 'builtin-list-search-value';
const BUILT_IN_ACTIVE_TAB_KEY = 'builtin-drawer-active-tab';

export default function index() {
  const { t } = useTranslation('builtInComponents');
  const navigate = useNavigate();
  const { search } = useLocation();
  const query = queryString.parse(search);
  const defaultComponent = query.component as string;
  const [searchValue, setSearchValue] = useState(localStorage.getItem(LIST_SEARCH_VALUE) || '');
  const [data, setData] = useState<Component[]>([]);
  const [activeComponent, setActiveComponent] = useState<Component>();
  const [readme, setReadme] = useState('');
  const [activeTab, setActiveTab] = useState(localStorage.getItem(BUILT_IN_ACTIVE_TAB_KEY) || 'tab_instructions');
  const [readmeEditabled, setReadmeEditabled] = useState(false);
  const fetchData = () => {
    return getComponents().then((res) => {
      setData(res);
      return res;
    });
  };

  useEffect(() => {
    fetchData().then((res) => {
      if (defaultComponent) {
        const component = _.find(res, { ident: defaultComponent });
        if (component) {
          setActiveComponent(component);
          setReadme(component.readme);
        }
      }
    });
  }, []);

  return (
    <PageLayout title={t('title')} icon={<SafetyCertificateOutlined />}>
      <div>
        <div style={{ background: 'unset' }}>
          <div className='mb-4' style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Input
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                localStorage.setItem(LIST_SEARCH_VALUE, e.target.value);
              }}
              allowClear
              placeholder={t('common:search_placeholder')}
            />
            <AuthorizationWrapper allowedPerms={['/components/add']}>
              <Button
                type='primary'
                onClick={() => {
                  ComponentFormModal({
                    components: data,
                    action: 'create',
                    onOk: () => {
                      fetchData();
                    },
                  });
                }}
              >
                {t('common:btn.create')}
              </Button>
            </AuthorizationWrapper>
          </div>
          <div className='builtin-cates-grid'>
            {_.map(
              _.filter(data, (item) => {
                return _.includes(_.toUpper(item.ident), _.toUpper(searchValue));
              }),
              (item) => {
                return (
                  <div
                    key={item.ident}
                    className='builtin-cates-grid-item'
                    onClick={() => {
                      navigate({
                        search: queryString.stringify({
                          ...query,
                          component: item.ident,
                        }),
                      }, { replace: true });
                      setActiveComponent(item);
                      setReadme(item.readme);
                    }}
                  >
                    <img src={item.logo} style={{ height: 42, maxWidth: '60%' }} />
                    <div>{item.ident}</div>
                    <div className='builtin-cates-grid-item-operations'>
                      <Space size={0}>
                        <AuthorizationWrapper allowedPerms={['/components/put']}>
                          <Button
                            size='small'
                            type='link'
                            className='p-0'
                            onClick={(e) => {
                              e.stopPropagation();
                              ComponentFormModal({
                                components: data,
                                action: 'edit',
                                initialValues: item,
                                onOk: () => {
                                  fetchData();
                                },
                              });
                            }}
                            icon={<EditOutlined />}
                          />
                        </AuthorizationWrapper>
                        <AuthorizationWrapper allowedPerms={['/components/del']}>
                          <Button
                            size='small'
                            type='link'
                            danger
                            className='p-0'
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              Modal.confirm({
                                title: t('common:confirm.delete'),
                                onOk: () => {
                                  deleteComponents([item.id]).then(() => {
                                    fetchData();
                                  });
                                },
                              });
                            }}
                          />
                        </AuthorizationWrapper>
                      </Space>
                    </div>
                    {item.disabled === 1 && (
                      <Tooltip title={t('disabled')}>
                        <div className='builtin-cates-grid-item-status'>
                          <StopOutlined />
                        </div>
                      </Tooltip>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>
      <Drawer
        width='90%'
        open={!!activeComponent}
        closable={false}
        destroyOnClose
        title={
          <Space>
            <img src={activeComponent?.logo} style={{ height: 24, width: 24 }} />
            <div>{activeComponent?.ident}</div>
          </Space>
        }
        extra={
          <CloseOutlined
            onClick={() => {
              navigate({
                search: queryString.stringify({
                  ...query,
                  component: undefined,
                }),
              }, { replace: true });
              setActiveComponent(undefined);
              setReadmeEditabled(false);
              setReadme(activeComponent?.readme || '');
            }}
          />
        }
        onClose={() => {
          navigate({
            search: queryString.stringify({
              ...query,
              component: undefined,
            }),
          }, { replace: true });
          setActiveComponent(undefined);
          setReadmeEditabled(false);
          setReadme(activeComponent?.readme || '');
        }}
        footer={
          activeTab === 'tab_instructions' &&
          (readmeEditabled ? (
            <Space>
              <Button
                type='primary'
                onClick={() => {
                  if (activeComponent) {
                    putComponent({ ...activeComponent, readme }).then(() => {
                      fetchData();
                    });
                    setReadmeEditabled(!readmeEditabled);
                  }
                }}
              >
                {t('common:btn.save')}
              </Button>
              <Button
                onClick={() => {
                  setReadmeEditabled(!readmeEditabled);
                  setReadme(activeComponent?.readme || '');
                }}
              >
                {t('common:btn.cancel')}
              </Button>
            </Space>
          ) : (
            <AuthorizationWrapper allowedPerms={['/components/put']}>
              <Button
                type='primary'
                onClick={() => {
                  setReadmeEditabled(!readmeEditabled);
                }}
              >
                {t('common:btn.edit')}
              </Button>
            </AuthorizationWrapper>
          ))
        }
      >
        {activeComponent && (
          <Tabs
            className='builtin-drawer-tabs'
            activeKey={activeTab}
            onChange={(activeKey) => {
              setActiveTab(activeKey);
              localStorage.setItem(BUILT_IN_ACTIVE_TAB_KEY, activeKey);
            }}
            items={[
              {
                key: 'tab_instructions',
                label: t('tab_instructions'),
                children: (
                  <Instructions
                    value={readme}
                    onChange={(newValue) => {
                      setReadme(newValue);
                    }}
                    editabled={readmeEditabled}
                    setReadmeEditabled={setReadmeEditabled}
                  />
                ),
              },
              ...(IS_PLUS
                ? [
                    {
                      key: 'tab_collectTpls',
                      label: t('tab_collectTpls'),
                      children: <CollectTpls component={activeComponent.ident} component_id={activeComponent.id} />,
                    },
                  ]
                : []),
              {
                key: 'tab_metrics',
                label: t('tab_metrics'),
                children: <Metrics component={activeComponent.ident} />,
              },
              {
                key: 'tab_dashboards',
                label: t('tab_dashboards'),
                children: <Dashboards component_id={activeComponent.id} />,
              },
              {
                key: 'tab_alertRules',
                label: t('tab_alertRules'),
                children: <AlertRules component_id={activeComponent.id} />,
              },
              ...(IS_ENT
                ? [
                    {
                      key: 'tab_firemap',
                      label: t('tab_firemap'),
                      children: <Firemap component_id={activeComponent.id} />,
                    },
                  ]
                : []),
            ]}
          />
        )}
      </Drawer>
    </PageLayout>
  );
}
