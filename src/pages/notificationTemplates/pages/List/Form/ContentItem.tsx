import React from 'react';
import { FormListFieldData } from 'antd/lib/form/FormList';
import { Form } from 'antd';
import { MinusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { CN, NS } from '../../../constants';
import Text from '../Editor/Text';
import HTML from '../Editor/HTML';
import Markdown from '../Editor/Markdown';
import ContentItemKey from './ContentItemKey';

interface Props {
  field: FormListFieldData;
  remove: (name: number) => void;
  isEmailType: boolean;
}

export default function ContentItem(props: Props) {
  const { t } = useTranslation(NS);
  const { field, remove, isEmailType } = props;
  const { key: fieldReactKey, ...restField } = field;
  const form = Form.useFormInstance();
  const fieldKey = Form.useWatch(['content', field.name, 'key']);

  return (
    <div className={`${CN}-main-content-item`}>
      <Form.Item {...restField} name={[field.name, 'key']} hidden>
        <div />
      </Form.Item>
      {isEmailType ? (
        <>
          {fieldKey === 'content' && (
            <Form.Item key={`${fieldReactKey}-content-value`} {...restField} name={[field.name, 'value']}>
              <HTML
                label={
                  <ContentItemKey
                    value={fieldKey}
                    hideEdit
                  />
                }
              />
            </Form.Item>
          )}
          {fieldKey === 'subject' && (
            <Form.Item key={`${fieldReactKey}-subject-value`} {...restField} name={[field.name, 'value']}>
              <Text
                label={
                  <ContentItemKey
                    value={fieldKey}
                    hideEdit
                  />
                }
              />
            </Form.Item>
          )}
        </>
      ) : (
        <Form.Item key={`${fieldReactKey}-markdown-value`} {...restField} name={[field.name, 'value']} rules={[{ required: true, message: t('content.value_msg') }]}>
          <Markdown
            label={
              <ContentItemKey
                value={fieldKey}
                onChange={(newKey) => {
                  form.setFieldValue(['content', field.name, 'key'], newKey);
                }}
              />
            }
            extra={
              <MinusCircleOutlined
                onClick={() => {
                  remove(field.name);
                }}
              />
            }
          />
        </Form.Item>
      )}
    </div>
  );
}
