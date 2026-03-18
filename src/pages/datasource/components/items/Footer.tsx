import React from 'react';
import { Button, Space, Affix, Card, Form } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { flushSync } from 'react-dom';

import { useGlobalState } from '../../Form';

interface IProps {
  id?: number | string;
  submitLoading: boolean;
  extra?: React.ReactNode;
}

export default function Footer(props: IProps) {
  const { t } = useTranslation('datasourceManage');
  const navigate = useNavigate();
  const form = Form.useFormInstance();
  const { id, submitLoading, extra } = props;
  const [, setSaveMode] = useGlobalState('saveMode');

  return (
    <Affix offsetBottom={0}>
      <Card size='small' className='affix-bottom-shadow'>
        <Space>
          {id !== undefined ? (
            <Button
              onClick={() => {
                navigate(-1);
              }}
            >
              {t('common:btn.back')}
            </Button>
          ) : null}

          <Button
            type='primary'
            loading={submitLoading}
            onClick={() => {
              flushSync(() => {
                setSaveMode('saveAndTest');
              });
              form.submit();
            }}
          >
            {t('test_and_save_btn')}
          </Button>
          <Button
            loading={submitLoading}
            onClick={() => {
              flushSync(() => {
                setSaveMode('save');
              });
              form.submit();
            }}
          >
            {t('save_btn')}
          </Button>
          {extra}
        </Space>
      </Card>
    </Affix>
  );
}
