import request from '@/utils/request';
import { RequestMethod } from '@/store/common';
import { SSOConfigType } from './types';

export const getSSOConfigs = function (): Promise<SSOConfigType[]> {
  return request('/api/n9e/sso-configs', {
    method: RequestMethod.Get,
  }).then((res) => {
    return res.dat || [];
  });
};

export const putSSOConfig = function (data: SSOConfigType) {
  return request('/api/n9e/sso-config', {
    method: RequestMethod.Put,
    data,
  }).then((res) => {
    return res.dat || [];
  });
};

export const testAzureSSOConnection = function (data: {
  tenant_id: string;
  client_id: string;
  client_secret: string;
  authority?: string;
  scopes?: string;
  proxy?: string;
}): Promise<{ success: boolean; message: string }> {
  return request('/api/n9e/sso/azure/test', {
    method: RequestMethod.Post,
    data,
  });
};
