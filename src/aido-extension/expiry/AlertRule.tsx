import React, { useEffect } from 'react';
import { Form } from 'antd';

import Triggers from '@/pages/alertRules/Form/components/Triggers';

interface Props {
  datasourceValue?: number;
}

export default function AidoExcelAlertRule(_props: Props) {
  const form = Form.useFormInstance();

  useEffect(() => {
    const existing = form.getFieldValue(['rule_config', 'queries']);
    if (!existing || existing.length === 0) {
      form.setFieldsValue({ rule_config: { queries: [{ ref: 'A', query: 'expiry_days' }] } });
    }
  }, [form]);

  return (
    <Form.Item shouldUpdate noStyle>
      {({ getFieldValue }) => {
        const queries = getFieldValue(['rule_config', 'queries']);
        return <Triggers prefixName={['rule_config']} queries={queries} />;
      }}
    </Form.Item>
  );
}
