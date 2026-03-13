import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, Menu, Form, Drawer, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import _ from 'lodash';

import OperateFormBase from '@/pages/recordingRules/components/operateForm';

import { NAME_SPACE } from '../../constants';

// ── local compatibility shim (plus edition not available in OSS build) ────────

interface RecordingRuleFormProps {
  form?: FormInstance;
  initialValues?: any;
  type?: number;
}

function RecordingRuleForm({ initialValues, type }: RecordingRuleFormProps) {
  return <OperateFormBase initialValues={initialValues} type={type} />;
}

interface ActionButtonsProps {
  form: FormInstance;
  onOk: () => void;
  onCancel: () => void;
}

function ActionButtons({ form, onOk, onCancel }: ActionButtonsProps) {
  const { t } = useTranslation();
  return (
    <Space>
      <Button
        type='primary'
        onClick={() => {
          form.validateFields().then(() => {
            form.submit();
            onOk();
          });
        }}
      >
        {t('common:btn.save')}
      </Button>
      <Button onClick={onCancel}>{t('common:btn.cancel')}</Button>
    </Space>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AddTo() {
  const { t } = useTranslation(NAME_SPACE);
  const form = Form.useFormInstance();
  const datasourceValue = form.getFieldValue(['datasourceValue']);
  const sql = form.getFieldValue(['query', 'sql']);
  const valueKey = form.getFieldValue(['query', 'keys', 'valueKey']);
  const labelKey = form.getFieldValue(['query', 'keys', 'labelKey']);

  const [recordingRuleForm] = Form.useForm();
  const [addToRecordingRuleModalState, setAddToRecordingRuleModalState] = useState<{
    visible: boolean;
  }>({
    visible: false,
  });

  return (
    <>
      <Dropdown
        placement='bottomRight'
        overlay={
          <Menu
            items={[
              {
                label: t('query.add_to.recording_rule'),
                key: 'recording_rule',
              },
            ]}
            onClick={({ key }) => {
              if (key === 'recording_rule') {
                setAddToRecordingRuleModalState({
                  visible: true,
                });
              }
            }}
          />
        }
      >
        <Button size='small' type='primary' icon={<PlusOutlined />}>
          {t('query.add_to.btn')}
        </Button>
      </Dropdown>
      <Drawer
        title={t('query.add_to.add_recording_rule_title')}
        width='80%'
        visible={addToRecordingRuleModalState.visible}
        onClose={() => {
          setAddToRecordingRuleModalState({
            visible: false,
          });
        }}
        footer={
          <ActionButtons
            form={recordingRuleForm}
            onOk={() => {
              setAddToRecordingRuleModalState({
                visible: false,
              });
            }}
            onCancel={() => {
              setAddToRecordingRuleModalState({
                visible: false,
              });
            }}
          />
        }
      >
        {addToRecordingRuleModalState.visible && (
          <RecordingRuleForm
            form={recordingRuleForm}
            initialValues={{
              cron_pattern: '@every 60s',
              query_configs: !_.isEmpty(valueKey)
                ? _.map(valueKey, (item) => {
                    return {
                      exp: '$A',
                      queries: [
                        {
                          cate: 'doris',
                          datasource_queries: [{ match_type: 0, op: 'in', values: [datasourceValue] }],
                          config: {
                            ref: 'A',
                            sql,
                            keys: {
                              valueKey: [item],
                              labelKey,
                            },
                          },
                        },
                      ],
                    };
                  })
                : [
                    {
                      exp: '$A',
                      queries: [
                        {
                          cate: 'doris',
                          datasource_queries: [{ match_type: 0, op: 'in', values: [datasourceValue] }],
                          config: {
                            ref: 'A',
                            sql,
                            keys: {
                              labelKey,
                            },
                          },
                        },
                      ],
                    },
                  ],
            }}
          />
        )}
      </Drawer>
    </>
  );
}
