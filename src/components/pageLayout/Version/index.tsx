import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Tooltip } from 'antd';
import { Trans } from 'react-i18next';
import { CommonStateContext } from '@/App';
// @ts-ignore
import useIsPlus from 'plus:/components/useIsPlus';
import pkgJson from '../../../../package.json';
import './locale';
export interface Versions {
  github_verison: string;
  version: string;
}

export default function Version() {
  const isPlus = useIsPlus();
  const navigate = useNavigate();
  const { versions } = useContext(CommonStateContext);
  const safeVersions = versions || { version: '', github_verison: '', newVersion: false };

  if (!isPlus) {
    return (
      <div style={{ marginRight: 16 }}>
        <Tooltip
          title={
            safeVersions.newVersion ? (
              <Trans
                ns='headerVersion'
                i18nKey='newVersion'
                values={{ version: safeVersions.github_verison }}
                components={{ a: <a style={{ color: '#b7a6e5' }} href='https://github.com/ccfos/nightingale/releases' target='_blank' /> }}
              />
            ) : 'v' + pkgJson.version
          }
        >
          <Badge dot={safeVersions.newVersion}>
            <span
              onClick={() => navigate('/system/version')}
              style={{ cursor: 'pointer', fontSize: 12 }}
            >
              {'v' + pkgJson.version}
            </span>
          </Badge>
        </Tooltip>
      </div>
    );
  }
  return null;
}
