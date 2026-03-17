import React from 'react';
import classNames from 'classnames';

import './style.less';

interface InputGroupCompatProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
  children: React.ReactNode;
}

export default function InputGroupCompat(props: InputGroupCompatProps) {
  const { compact = false, className, children, ...rest } = props;

  return (
    <div
      className={classNames('input-group-compat-wrapper', 'ant-input-group-wrapper', 'input-group-with-form-item', {
        'ant-input-group-wrapper-compact': compact,
      })}
      {...rest}
    >
      <div
        className={classNames('input-group-compat', 'ant-input-group', 'input-group-with-form-item-content', className, {
          'ant-input-group-compact': compact,
        })}
      >
        {children}
      </div>
    </div>
  );
}
