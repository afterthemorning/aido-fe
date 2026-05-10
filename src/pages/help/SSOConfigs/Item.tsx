import React, { useEffect, useState } from 'react';
import { Button, Space, Form, App, Switch, Input, Row, Col, Select, Alert } from 'antd';
import { DownOutlined, RightOutlined, CopyOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { useTranslation, Trans } from 'react-i18next';
import { EditorView } from '@codemirror/view';
import { copy2ClipBoard } from '@/utils';

import { SIZE } from '@/utils/constant';
import { getRoles } from '@/services/manage';
import CodeMirror from '@/components/CodeMirror';
import DocumentDrawer from '@/components/DocumentDrawer';

import { SSOConfigType } from './types';
import { putSSOConfig, testAzureSSOConnection } from './services';

export const documentMap = {
  OAuth2: 'https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v7/usage/system-configuration/sso/oauth2/',
  LDAP: 'https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v7/usage/system-configuration/sso/ldap/',
  CAS: 'https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v7/usage/system-configuration/sso/cas/',
  OIDC: 'https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v7/usage/system-configuration/sso/oidc/',
  dingtalk: 'https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v7/usage/system-configuration/sso/dingtalk',
  feishu: 'https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v7/usage/system-configuration/sso/feishu',
  azure: 'https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow',
};

interface Props {
  activeKey?: string;
  item: SSOConfigType;
}

export default function Item(props: Props) {
  const { t, i18n } = useTranslation('SSOConfigs');
  const { message } = App.useApp();
  const { activeKey, item } = props;
  const [form] = Form.useForm<SSOConfigType>();
  const [advancedSettingsVisible, setAdvancedSettingsVisible] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    getRoles()
      .then((res) => {
        const roleNames = _.map(res, 'name');
        const defaultRole = _.includes(roleNames, 'Standard') ? 'Standard' : roleNames[0];
        setRoles(roleNames);
        form.setFieldsValue({
          ...item,
          setting: {
            ...item.setting,
            default_roles: item.setting?.default_roles || [defaultRole],
          },
        });
      })
      .catch(() => {
        form.setFieldsValue(item);
      });
  }, []);

  return (
    <Form form={form} layout='vertical'>
      {item.name === 'feishu' ? (
        <>
          <Form.Item name={['setting', 'redirect_url']} label={t('callback_url')} initialValue={`${window.location.origin}/callback/feishu`}>
            <Space size={'small'}>
              {`${window.location.origin}/callback/feishu`} <CopyOutlined onClick={() => copy2ClipBoard(`${window.location.origin}/callback/feishu`)} />
            </Space>
          </Form.Item>
          <Form.Item label={t('dingtalk_setting.enable')} name={['setting', 'enable']} valuePropName='checked' initialValue={false}>
            <Switch size='small' />
          </Form.Item>
          <Form.Item label={t('dingtalk_setting.display_name')} name={['setting', 'display_name']} rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            label={'APP ID'}
            name={['setting', 'app_id']}
            rules={[{ required: true }]}
            tooltip={<Trans ns='SSOConfigs' i18nKey='feishu_setting.app_id_tip' components={{ 1: <a href='https://open.feishu.cn/app' target='_blank' /> }} />}
          >
            <Input />
          </Form.Item>
          <Form.Item label={'APP Secret'} name={['setting', 'app_secret']} rules={[{ required: true }]} tooltip={t('feishu_setting.app_secret_tip')}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            label={t('dingtalk_setting.cover_attributes')}
            tooltip={t('feishu_setting.cover_attributes_tip')}
            name={['setting', 'cover_attributes']}
            valuePropName='checked'
            initialValue={true}
          >
            <Switch size='small' />
          </Form.Item>
          <Row gutter={SIZE}>
            <Col span={12}>
              <Form.Item label={t('dingtalk_setting.username_field')} name={['setting', 'username_field']} rules={[{ required: true }]} initialValue='email'>
                <Select
                  options={[
                    {
                      label: t('dingtalk_setting.username_field_map.email'),
                      value: 'email',
                    },
                    {
                      label: t('dingtalk_setting.username_field_map.phone'),
                      value: 'phone',
                    },
                    {
                      label: t('dingtalk_setting.username_field_map.name'),
                      value: 'name',
                    },
                  ]}
                  optionFilterProp='label'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('dingtalk_setting.default_roles')} name={['setting', 'default_roles']} rules={[{ required: true }]}>
                <Select
                  mode='multiple'
                  options={_.map(roles, (item) => {
                    return { label: item, value: item };
                  })}
                  optionFilterProp='label'
                />
              </Form.Item>
            </Col>
          </Row>

          <div className='mb-4'>
            <Space className='cursor-pointer' onClick={() => setAdvancedSettingsVisible(!advancedSettingsVisible)}>
              {t('common:advanced_settings')}
              {advancedSettingsVisible ? <DownOutlined /> : <RightOutlined />}
            </Space>
          </div>
          <div
            style={{
              display: advancedSettingsVisible ? 'block' : 'none',
            }}
          >
            <Form.Item label={t('dingtalk_setting.auth_url')} name={['setting', 'auth_url']} initialValue={'https://accounts.feishu.cn/open-apis/authen/v1/authorize'}>
              <Input placeholder='https://accounts.feishu.cn/open-apis/authen/v1/authorize' />
            </Form.Item>
            <Form.Item label='Endpoint' name={['setting', 'feishu_endpoint']} initialValue={'https://open.feishu.cn'}>
              <Input placeholder='https://open.feishu.cn' />
            </Form.Item>
            <Form.Item label={t('dingtalk_setting.proxy')} name={['setting', 'proxy']}>
              <Input />
            </Form.Item>
          </div>
        </>
      ) : item.name === 'dingtalk' ? (
        <>
          <Form.Item name={['setting', 'redirect_url']} label={t('callback_url')} initialValue={`${window.location.origin}/callback/dingtalk`}>
            <Space size={'small'}>
              {`${window.location.origin}/callback/dingtalk`} <CopyOutlined onClick={() => copy2ClipBoard(`${window.location.origin}/callback/dingtalk`)} />
            </Space>
          </Form.Item>
          <Form.Item label={t('dingtalk_setting.enable')} name={['setting', 'enable']} valuePropName='checked' initialValue={false}>
            <Switch size='small' />
          </Form.Item>
          <Row gutter={SIZE}>
            <Col span={12}>
              <Form.Item label={t('dingtalk_setting.display_name')} name={['setting', 'display_name']} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('dingtalk_setting.corpId')} tooltip={t('dingtalk_setting.corpId_tip')} name={['setting', 'corpId']} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t('dingtalk_setting.client_id')} name={['setting', 'client_id']} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('dingtalk_setting.client_secret')} name={['setting', 'client_secret']} rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            label={t('dingtalk_setting.cover_attributes')}
            tooltip={t('dingtalk_setting.cover_attributes_tip')}
            name={['setting', 'cover_attributes']}
            valuePropName='checked'
            initialValue={true}
          >
            <Switch size='small' />
          </Form.Item>
          <Row gutter={SIZE}>
            <Col span={12}>
              <Form.Item label={t('dingtalk_setting.username_field')} name={['setting', 'username_field']} rules={[{ required: true }]}>
                <Select
                  options={[
                    {
                      label: t('dingtalk_setting.username_field_map.phone'),
                      value: 'phone',
                    },
                    {
                      label: t('dingtalk_setting.username_field_map.name'),
                      value: 'name',
                    },
                    {
                      label: t('dingtalk_setting.username_field_map.email'),
                      value: 'email',
                    },
                  ]}
                  optionFilterProp='label'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('dingtalk_setting.default_roles')} name={['setting', 'default_roles']} rules={[{ required: true }]}>
                <Select
                  mode='multiple'
                  options={_.map(roles, (item) => {
                    return { label: item, value: item };
                  })}
                  optionFilterProp='label'
                />
              </Form.Item>
            </Col>
          </Row>

          <div className='mb-4'>
            <Space className='cursor-pointer' onClick={() => setAdvancedSettingsVisible(!advancedSettingsVisible)}>
              {t('common:advanced_settings')}
              {advancedSettingsVisible ? <DownOutlined /> : <RightOutlined />}
            </Space>
          </div>
          <div
            style={{
              display: advancedSettingsVisible ? 'block' : 'none',
            }}
          >
            <Form.Item label={t('dingtalk_setting.auth_url')} name={['setting', 'auth_url']}>
              <Input placeholder='https://login.dingtalk.com/oauth2/auth' />
            </Form.Item>
            <Form.Item label='Endpoint' name={['setting', 'endpoint']}>
              <Input placeholder='https://api.dingtalk.com' />
            </Form.Item>
            <Form.Item label={t('dingtalk_setting.proxy')} name={['setting', 'proxy']}>
              <Input />
            </Form.Item>
            <Row gutter={SIZE}>
              <Col flex='none'>
                <Form.Item
                  label={t('dingtalk_setting.use_member_info')}
                  tooltip={t('dingtalk_setting.use_member_info_tip')}
                  name={['setting', 'use_member_info']}
                  valuePropName='checked'
                  initialValue={false}
                >
                  <Switch size='small' />
                </Form.Item>
              </Col>
              <Col flex='auto'>
                <Form.Item label={t('dingtalk_setting.dingtalk_api')} tooltip={t('dingtalk_setting.dingtalk_api_tip')} name={['setting', 'dingtalk_api']}>
                  <Input placeholder='https://oapi.dingtalk.com' />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </>
      ) : item.name === 'azure' ? (
        <>
          <Form.Item name={['setting', 'redirect_url']} label={t('callback_url')} initialValue={`${window.location.origin}/aido/callback/azure`}>
            <Space size={'small'}>
              {`${window.location.origin}/aido/callback/azure`} <CopyOutlined onClick={() => copy2ClipBoard(`${window.location.origin}/aido/callback/azure`)} />
            </Space>
          </Form.Item>
          <Form.Item label={t('azure_setting.enable')} name={['setting', 'enable']} valuePropName='checked' initialValue={false}>
            <Switch size='small' />
          </Form.Item>
          <Form.Item label={t('azure_setting.display_name')} name={['setting', 'display_name']} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={SIZE}>
            <Col span={12}>
              <Form.Item
                label='Tenant ID'
                name={['setting', 'tenant_id']}
                rules={[{ required: true }]}
                tooltip='Azure AD Directory (Tenant) ID'
              >
                <Input placeholder='00000000-0000-0000-0000-000000000000' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Client ID'
                name={['setting', 'client_id']}
                rules={[{ required: true }]}
                tooltip='Azure Application (Client) ID'
              >
                <Input placeholder='00000000-0000-0000-0000-000000000000' />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label='Client Secret'
            name={['setting', 'client_secret']}
            rules={[{ required: true }]}
            tooltip='Azure Application Client Secret (应用注册密钥)'
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label={t('azure_setting.cover_attributes')}
            tooltip={t('azure_setting.cover_attributes_tip')}
            name={['setting', 'cover_attributes']}
            valuePropName='checked'
            initialValue={true}
          >
            <Switch size='small' />
          </Form.Item>
          <Row gutter={SIZE}>
            <Col span={12}>
              <Form.Item label={t('azure_setting.username_field')} name={['setting', 'username_field']} rules={[{ required: true }]} initialValue='email'>
                <Select
                  options={[
                    { label: 'email (preferred_username)', value: 'email' },
                    { label: 'upn (userPrincipalName)', value: 'upn' },
                    { label: 'oid (Object ID)', value: 'oid' },
                    { label: 'name', value: 'name' },
                  ]}
                  optionFilterProp='label'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('azure_setting.default_roles')} name={['setting', 'default_roles']} rules={[{ required: true }]}>
                <Select
                  mode='multiple'
                  options={_.map(roles, (item) => ({ label: item, value: item }))}
                  optionFilterProp='label'
                />
              </Form.Item>
            </Col>
          </Row>

          <div className='mb-4'>
            <Space className='cursor-pointer' onClick={() => setAdvancedSettingsVisible(!advancedSettingsVisible)}>
              {t('common:advanced_settings')}
              {advancedSettingsVisible ? <DownOutlined /> : <RightOutlined />}
            </Space>
          </div>
          <div style={{ display: advancedSettingsVisible ? 'block' : 'none' }}>
            <Form.Item label={t('azure_setting.authority')} name={['setting', 'authority']} initialValue='https://login.microsoftonline.com/common'>
              <Input placeholder='https://login.microsoftonline.com/{tenant-id}' />
            </Form.Item>
            <Form.Item label={t('azure_setting.scopes')} name={['setting', 'scopes']} initialValue='openid,profile,email'>
              <Input placeholder='openid,profile,email' />
            </Form.Item>
            <Form.Item label={t('azure_setting.proxy')} name={['setting', 'proxy']}>
              <Input />
            </Form.Item>
          </div>

          {/* 测试连接按钮 + 状态反馈 */}
          {testResult && (
            <div style={{ marginBottom: 16 }}>
              <Alert
                type={testResult.success ? 'success' : 'error'}
                showIcon
                icon={testResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                message={testResult.success ? t('azure_test.success') : t('azure_test.failed')}
                description={testResult.message}
                closable
                onClose={() => setTestResult(null)}
              />
            </div>
          )}
          <Button
            type='default'
            icon={testLoading ? <LoadingOutlined /> : <CheckCircleOutlined />}
            disabled={testLoading}
            onClick={() => {
              form.validateFields().then((values) => {
                setTestLoading(true);
                setTestResult(null);
                const setting = values.setting || {};
                testAzureSSOConnection({
                  tenant_id: setting.tenant_id,
                  client_id: setting.client_id,
                  client_secret: setting.client_secret,
                  authority: setting.authority,
                  scopes: setting.scopes,
                  proxy: setting.proxy,
                })
                  .then((resp) => {
                    setTestResult({ success: true, message: resp.message || t('azure_test.success_default') });
                  })
                  .catch((err) => {
                    const errMsg = err.message || err.err || t('azure_test.failed_default');
                    setTestResult({ success: false, message: errMsg });
                  })
                  .finally(() => setTestLoading(false));
              });
            }}
          >
            {testLoading ? t('azure_test.testing') : t('azure_test.test_connection')}
          </Button>
        </>
      ) : (
        <Form.Item name='content'>
          <CodeMirror
            height='auto'
            basicSetup
            editable
            extensions={[
              EditorView.lineWrapping,
              EditorView.theme({
                '&': {
                  backgroundColor: '#F6F6F6 !important',
                },
                '&.cm-editor.cm-focused': {
                  outline: 'unset',
                },
              }),
            ]}
          />
        </Form.Item>
      )}
      <Space className='mt-4'>
        <Button
          type='primary'
          onClick={() => {
            form.validateFields().then((values) => {
              // fallback 配置（id=0）保存时去掉 id，由后端自动创建
              const { id, ...rest } = item;
              const payload = id && id > 0 ? { ...item, ...values } : { ...rest, ...values };
              putSSOConfig(payload).then(() => {
                message.success(t('common:success.save'));
              });
            });
          }}
        >
          {t('common:btn.save')}
        </Button>
        {activeKey && documentMap[activeKey] && (
          <Button
            type='link'
            onClick={() => {
              DocumentDrawer({
                language: i18n.language,
                title: t('common:document_link'),
                type: 'iframe',
                documentPath: documentMap[activeKey],
              });
            }}
          >
            {t('common:document_link')}
          </Button>
        )}
      </Space>
    </Form>
  );
}
