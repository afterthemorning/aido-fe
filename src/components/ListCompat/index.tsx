/**
 * ListCompat — antd List 的替代组件。
 *
 * antd v6 已废弃 List 组件，将在下一大版本移除。
 * 此组件提供和 antd List + List.Item 相同的能力，
 * 基于原生 div + flex 实现，无弃用警告。
 */
import React from 'react';
import { Skeleton } from 'antd';

interface ListItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLElement>;
  key?: string | number;
}

interface ListCompatProps<T> {
  dataSource: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  size?: 'small' | 'default' | 'large';
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  bordered?: boolean;
  locale?: { emptyText?: React.ReactNode };
}

function getSizeStyle(size?: 'small' | 'default' | 'large'): React.CSSProperties {
  switch (size) {
    case 'small':
      return { fontSize: 12, lineHeight: '22px' };
    case 'large':
      return { fontSize: 16, lineHeight: '40px' };
    default:
      return { fontSize: 14, lineHeight: '32px' };
  }
}

const ITEM_BORDER = '1px solid rgba(0,0,0,0.06)';

function ListItem({ children, className, style, onClick }: ListItemProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: ITEM_BORDER,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function ListCompat<T>({
  dataSource,
  renderItem,
  size,
  loading,
  className,
  style,
  bordered,
  locale,
}: ListCompatProps<T>) {
  return (
    <div
      className={className}
      style={{
        border: bordered ? ITEM_BORDER : undefined,
        borderRadius: 6,
        ...getSizeStyle(size),
        ...style,
      }}
    >
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ padding: '12px 16px' }}>
            <Skeleton active title={false} paragraph={{ rows: 1, width: ['60%'] }} />
          </div>
        ))
      ) : dataSource.length > 0 ? (
        dataSource.map((item, idx) => (
          <React.Fragment key={idx}>{renderItem(item, idx)}</React.Fragment>
        ))
      ) : (
        locale?.emptyText || <div style={{ padding: '12px 16px', color: '#999', textAlign: 'center' }}>No Data</div>
      )}
    </div>
  );
}

ListCompat.Item = ListItem;

export default ListCompat;
