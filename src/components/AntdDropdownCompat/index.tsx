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

interface DropdownCompatProps extends Omit<DropdownProps, 'overlay'> {
  overlay?: React.ReactNode;
  children: React.ReactElement;
}

const DropdownCompat: React.FC<DropdownCompatProps> = ({ overlay, children, ...rest }) => {
  if (overlay) {
    return (
      <Dropdown {...rest} popupRender={() => overlay as React.ReactElement}>
        {children}
      </Dropdown>
    );
  }
  return <Dropdown {...rest}>{children}</Dropdown>;
};

export default DropdownCompat;
