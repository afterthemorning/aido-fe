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
import React, { useMemo } from 'react';
import { Dropdown, type DropdownProps } from 'antd';
import cx from 'classnames';

interface DropdownCompatProps extends Omit<DropdownProps, 'popupRender'> {
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
  const open = visible ?? rest.open;
  const onOpenChange: DropdownProps['onOpenChange'] = (nextOpen, info) => {
    onVisibleChange?.(nextOpen);
    rest.onOpenChange?.(nextOpen, info);
  };

  const popupRender = overlay ? () => overlay as React.ReactElement : undefined;

  const mergedClassNames = useMemo(() => {
    const cls = cx(overlayClassName);
    if (!cls) return rest.classNames;
    return { ...rest.classNames, root: cls };
  }, [overlayClassName, rest.classNames]);

  const mergedStyles = useMemo(() => {
    if (!overlayStyle) return rest.styles;
    return { ...rest.styles, root: overlayStyle };
  }, [overlayStyle, rest.styles]);

  return (
    <Dropdown {...rest} open={open} onOpenChange={onOpenChange} classNames={mergedClassNames} styles={mergedStyles} popupRender={popupRender}>
      {children}
    </Dropdown>
  );
};

export default DropdownCompat;
