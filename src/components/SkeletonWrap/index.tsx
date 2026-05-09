import React from 'react';
import { Skeleton, Card, Space, Row, Col } from 'antd';

interface SkeletonWrapProps {
  type?: 'table' | 'card' | 'detail' | 'stats';
  rows?: number;
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ padding: 8 }}>
      <Skeleton.Input active style={{ width: 200, marginBottom: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center' }}>
          <Skeleton.Input active size="small" style={{ width: '15%' }} />
          <Skeleton.Input active size="small" style={{ width: '25%' }} />
          <Skeleton.Input active size="small" style={{ width: '20%' }} />
          <Skeleton.Input active size="small" style={{ width: '15%' }} />
          <Skeleton.Input active size="small" style={{ width: '10%' }} />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }).map((_, i) => (
        <Col xs={12} md={6} key={i}>
          <Card>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

function DetailSkeleton() {
  return (
    <Card>
      <Skeleton active avatar paragraph={{ rows: 4 }} />
    </Card>
  );
}

function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }).map((_, i) => (
        <Col xs={12} md={6} key={i}>
          <Card>
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default function SkeletonWrap({ type = 'table', rows }: SkeletonWrapProps) {
  switch (type) {
    case 'card': return <CardSkeleton count={rows || 4} />;
    case 'detail': return <DetailSkeleton />;
    case 'stats': return <StatsSkeleton count={rows || 4} />;
    default: return <TableSkeleton rows={rows || 5} />;
  }
}
