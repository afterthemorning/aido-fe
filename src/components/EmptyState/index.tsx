import React from 'react';
import { Empty, Button, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface EmptyStateProps {
  description?: string;
  actionText?: string;
  onAction?: () => void;
  onRetry?: () => void;
  type?: 'default' | 'no-data' | 'no-results' | 'error';
}

const tips: Record<string, { image: React.ReactNode; defaultDesc: string }> = {
  'no-data': { image: Empty.PRESENTED_IMAGE_SIMPLE, defaultDesc: 'No data yet' },
  'no-results': { image: Empty.PRESENTED_IMAGE_SIMPLE, defaultDesc: 'No results match your filter' },
  error: { image: Empty.PRESENTED_IMAGE_DEFAULT, defaultDesc: 'Something went wrong' },
  default: { image: Empty.PRESENTED_IMAGE_SIMPLE, defaultDesc: 'No data' },
};

export default function EmptyState({ description, actionText, onAction, onRetry, type = 'no-data' }: EmptyStateProps) {
  const cfg = tips[type] || tips.default;
  return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <Empty image={cfg.image} description={
        <Text type="secondary" style={{ fontSize: 13 }}>{description || cfg.defaultDesc}</Text>
      } />
      {actionText && onAction && (
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onAction} style={{ marginTop: 12 }}>
          {actionText}
        </Button>
      )}
      {type === 'error' && onRetry && (
        <Button size="small" icon={<ReloadOutlined />} onClick={onRetry} style={{ marginTop: 12 }}>
          Retry
        </Button>
      )}
    </div>
  );
}
