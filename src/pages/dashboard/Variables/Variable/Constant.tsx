import React, { useEffect } from 'react';
import { Input } from 'antd';
import _ from 'lodash';

import FieldGroupV2 from '@/components/FieldGroupV2';

import { IVariable } from '../types';
import getValueByOptions from '../utils/getValueByOptions';
import { Props } from './types';

export default function Constant(props: Props) {
  const { item, variableValueFixed, onChange, value } = props;
  const { name, label, definition } = item;
  const latestItemRef = React.useRef<IVariable>(item);

  useEffect(() => {
    latestItemRef.current = item;
  });

  useEffect(() => {
    const itemClone = _.cloneDeep(latestItemRef.current);

    onChange({
      value: getValueByOptions({
        variableValueFixed,
        variable: {
          ...itemClone,
          value: itemClone.definition,
        },
      }),
    });
  }, [JSON.stringify(item.definition)]);

  return (
    <div>
      <FieldGroupV2 label={label || name}>
        <Input disabled value={definition} />
      </FieldGroupV2>
    </div>
  );
}
