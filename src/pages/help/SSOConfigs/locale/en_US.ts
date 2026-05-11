const en_US = {
  title: 'Single Sign-On settings',
  LDAP: 'LDAP',
  CAS: 'CAS',
  OIDC: 'OIDC',
  OAuth2: 'OAuth2',
  dingtalk: 'DingTalk',
  feishu: 'Feishu',
  azure: 'Azure AD',
  callback_url: 'Callback URL',
  feishu_setting: {
    app_id_tip:
      'Feishu Open Platform application unique identifier, generated automatically when the application is created, and users cannot modify it themselves. You can view the app_id in the Credentials and Basic Information page of the <1>Developer Backend</1>',
    app_secret_tip: 'Application secret. Generated automatically when the application is created',
    cover_attributes_tip:
      'After each login, if user information has changed, the user information from Feishu will overwrite the user information in AIDO (phone number, email)',
  },
  dingtalk_setting: {
    enable: 'Enable',
    display_name: 'Display Name',
    corpId: 'Corporation ID',
    corpId_tip: 'Corporation ID, you can find the CorpId on the homepage of the DingTalk Open Platform',
    client_id: 'Client ID',
    client_secret: 'Client Secret',
    cover_attributes: 'Update User Information',
    cover_attributes_tip:
      'After each login, if user information has changed, the user information from DingTalk will overwrite the user information in AIDO (phone number, email)',
    username_field: 'Username Field',
    username_field_map: {
      phone: 'Phone Number',
      name: 'Name',
      email: 'Email',
    },
    default_roles: 'Default Roles',
    auth_url: 'Authentication URL',
    proxy: 'Proxy Address',
    use_member_info: 'User Details',
    use_member_info_tip:
      'This feature needs to be enabled when you need to access employee emails and phone numbers in your address book. Enabling this feature requires granting the "Address Book User Details" permission. Please add the corresponding permission on the DingTalk Open Platform',
    dingtalk_api: 'DingTalk API',
    dingtalk_api_tip: 'Set the API endpoint for querying employee information in the address book',
  },
  azure_setting: {
    enable: 'Enable',
    display_name: 'Display Name',
    cover_attributes: 'Update User Information',
    cover_attributes_tip: 'Synchronize Azure AD user attributes (email, display name) to local account on each login',
    username_field: 'Username Field',
    default_roles: 'Default Roles',
    authority: 'Authority URL',
    scopes: 'Scopes',
    proxy: 'Proxy Address',
  },
  azure_test: {
    test_connection: 'Test Connection',
    testing: 'Testing...',
    success: 'Connection Test Passed',
    failed: 'Connection Test Failed',
    success_default: 'Azure AD configuration verified successfully. Token obtained.',
    failed_default: 'Connection test failed. Please verify your configuration parameters.',
  },
};
export default en_US;
