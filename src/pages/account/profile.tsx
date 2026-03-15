/*
 * Copyright 2022 Nightingale Team
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
import React from 'react';
import { Tabs } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/pageLayout';
import ChangePassword from './changePassword';
import Token from './Token';
import Info from './info';
import './profile.less';
import './locale';

export default function Profile() {
  const { t } = useTranslation('account');
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();

  const handleChange = (tab) => {
    navigate('/account/profile/' + tab);
  };

  return (
    <PageLayout title={t('title')}>
      <div>
        <div>
          <Tabs activeKey={tab} className='profile' onChange={handleChange} items={[
            {
            key: 'info',
            label: t('profile.title'),
            children: (
              <>
                <Info />
              </>
            ),
          },
            {
            key: 'pwd',
            label: t('password.title'),
            children: (
              <>
                <ChangePassword />
              </>
            ),
          },
            {
            key: 'token',
            label: t('token.title'),
            children: (
              <>
                <Token />
              </>
            ),
          }
          ]} />
        </div>
      </div>
    </PageLayout>
  );
}
