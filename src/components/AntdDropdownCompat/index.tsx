/**
 * AntdDropdownCompat — antd 4→6 migration shim.
 *
 * antd 6 removed the `overlay` prop from Dropdown (replaced by `menu` prop).
 * This wrapper accepts the legacy `overlay` prop and maps it to `popupRender`,
 * allowing a phased migration without touching all 49 call sites at once.
 *
 * Usage: import Dropdown from '@/components/AntdDropdownCompat';
 * Drop-in replacement — all other DropdownProps are forwarded as-is.
 */
import React from 'react';
import { Dropdown, type DropdownProps } from 'antd';
import cx from 'classnames';

interface DropdownCompatProps extends Omit<DropdownProps, 'overlay' | 'open' | 'onOpenChange'> {
  overlay?: React.ReactNode;
  visible?: boolean;
  onVisibleChange?: (open: boolean) => void;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  children: React.ReactElement;
}

const DropdownCompat: React.FC<DropdownCompatProps> = ({
  overlay,
  visible,
  onVisibleChange,
  overlayClassName,
  overlayStyle,
  children,
  ...rest
}) => {
  const mergedClassNames = {
    ...rest.classNames,
    root: cx(rest.classNames?.root, overlayClassName),
  };

  const mergedStyles = {
    ...rest.styles,
    root: {
      ...(rest.styles?.root || {}),
      ...(overlayStyle || {}),
    },
  };

  const open = visible ?? rest.open;
  const onOpenChange = onVisibleChange ?? rest.onOpenChange;

  if (overlay) {
    return (
      <Dropdown {...rest} open={open} onOpenChange={onOpenChange} classNames={mergedClassNames} styles={mergedStyles} popupRender={() => overlay as React.ReactElement}>
        {children}
      </Dropdown>
    );
  }
  return (
    <Dropdown {...rest} open={open} onOpenChange={onOpenChange} classNames={mergedClassNames} styles={mergedStyles}>
      {children}
    </Dropdown>
  );
};

export default DropdownCompat;
