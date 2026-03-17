import React, { CSSProperties } from 'react';
import classNames from 'classnames';

import './style.less';

interface FieldGroupV2Props {
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

export default function FieldGroupV2(props: FieldGroupV2Props) {
  const {
    children,
    label,
    labelWidth = 'max-content',
    labelMinWidth,
    noStyle = false,
    customStyle,
    addonAfter,
    addonAfterWithContainer,
    size = 'middle',
    className,
  } = props;

  return (
    <div
      className={classNames(
        'field-group-v2',
        `field-group-v2-${size}`,
        'ant-input-group',
        'ant-input-group-compact',
        'input-group-with-form-item',
        className,
        { 'field-group-v2-no-style': noStyle },
      )}
    >
      <div
        className={classNames('field-group-v2-label', 'input-group-with-form-item-label', {
          'input-group-with-form-item-label-small': size === 'small',
        })}
        style={{
          width: labelWidth,
          minWidth: labelMinWidth,
          ...customStyle,
        }}
      >
        {label}
      </div>
      <div
        className={classNames('field-group-v2-content', 'input-group-with-form-item-content', {
          'input-group-with-form-item-content-small': size === 'small',
        })}
      >
        {children}
      </div>
      {addonAfter ? <div className='field-group-v2-addon ant-input-group-addon'>{addonAfter}</div> : null}
      {addonAfterWithContainer}
    </div>
  );
}
