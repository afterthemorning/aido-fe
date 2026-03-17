import React, { CSSProperties } from 'react';
import classNames from 'classnames';
import FieldGroupV2 from '@/components/FieldGroupV2';
import './style.less';

interface IProps {
  children: React.ReactNode;
  label: React.ReactNode;
  labelWidth?: number | string;
  labelMinWidth?: number | string;
  noStyle?: boolean;
  customStyle?: CSSProperties;
  addonAfter?: React.ReactNode;
  addonAfterWithContainer?: React.ReactNode;
  size?: 'small' | 'middle';
  className?: string;
}

export default function InputGroupWithFormItem(props: IProps) {
  const { children, label, labelWidth = 'max-content', labelMinWidth, noStyle = false, customStyle, addonAfter, addonAfterWithContainer, size = 'middle', className } = props;

  return (
    <FieldGroupV2
      className={classNames('input-group-with-form-item', className)}
      label={label}
      labelWidth={labelWidth}
      labelMinWidth={labelMinWidth}
      noStyle={noStyle}
      customStyle={customStyle}
      addonAfter={addonAfter}
      addonAfterWithContainer={addonAfterWithContainer}
      size={size}
    >
      {children}
    </FieldGroupV2>
  );
}
