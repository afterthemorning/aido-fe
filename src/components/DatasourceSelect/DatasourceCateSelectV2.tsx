import React, { useContext } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { Cate } from '@/components/AdvancedWrap';
import { CommonStateContext } from '@/App';
import DatasourceIcon from '@/components/DatasourceIcon';
import './style.less';

interface IProps {
  value?: string;
  onChange?: (value: string, record: Cate) => void;
  filterCates?: (cates: Cate[]) => Cate[];
  disabled?: boolean;
}

export default function DatasourceCateSelectV2(props: IProps) {
  const { value, onChange, filterCates, disabled } = props;
  const { datasourceCateOptions } = useContext(CommonStateContext);
  const cates = filterCates ? filterCates(datasourceCateOptions) : datasourceCateOptions;

  return (
    <div className='aido-db-cate-grid'>
      {_.map(cates, (item) => {
        return (
          <div
            key={item.value}
            className={classNames('aido-db-cate-grid-item', {
              'aido-db-cate-grid-item-selected': value === item.value,
              'aido-db-cate-grid-item-disabled': disabled,
            })}
            onClick={() => {
              if (disabled) return;
              if (item.value !== value) {
                onChange && onChange(item.value, item);
              }
            }}
            style={disabled ? { cursor: 'not-allowed', opacity: 0.5 } : undefined}
          >
            <DatasourceIcon logo={item.logo} label={item.label} ident={item.value} size={42} />
            <div>{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}
