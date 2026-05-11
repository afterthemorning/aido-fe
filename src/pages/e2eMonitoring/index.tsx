import React, { useCallback, useMemo, useState } from 'react';
import {
  Card, Tag, Typography, Space, Row, Col, Select, Button, Spin, App,
} from 'antd';
import {
  RobotOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, ArrowRightOutlined, CloudServerOutlined,
  ApiOutlined, DatabaseOutlined, WarningOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ReactFlow, {
  type Node,
  type Edge,
  type NodeTypes,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  Handle,
  type Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

import PageLayout from '@/components/pageLayout';
import './locale';

const { Text, Title } = Typography;

type StatusType = 'success' | 'error' | 'warning' | 'pending';

interface E2EStep {
  id: string;
  label: string;
  type: 'source' | 'process' | 'ai' | 'output' | 'monitor';
  status: StatusType;
  detail?: string;
  latency?: number;
}

interface E2EFlow {
  id: string;
  name: string;
  description?: string;
  steps: E2EStep[];
  overallStatus: StatusType;
  updatedAt: string;
}

/** 模拟 E2E 流程数据 */
const mockFlows: E2EFlow[] = [
  {
    id: 'flow-1',
    name: 'API Gateway → AI Analysis → Alert',
    description: 'Monitor API gateway metrics, analyze with AI, trigger alert on anomalies',
    overallStatus: 'error',
    updatedAt: new Date().toISOString(),
    steps: [
      { id: 's1', label: 'API Gateway', type: 'source', status: 'success', detail: 'All endpoints healthy', latency: 12 },
      { id: 's2', label: 'Data Collection', type: 'process', status: 'success', detail: 'Metrics collected', latency: 45 },
      { id: 's3', label: 'AI Analysis', type: 'ai', status: 'warning', detail: 'Latency spike detected (p99: 2.3s)', latency: 230 },
      { id: 's4', label: 'Alert Evaluation', type: 'process', status: 'error', detail: 'Threshold exceeded: 95% percentile', latency: 18 },
      { id: 's5', label: 'Notification', type: 'output', status: 'pending', detail: 'Waiting for alert confirmation', latency: 0 },
    ],
  },
  {
    id: 'flow-2',
    name: 'Log Ingestion → Anomaly Detection',
    description: 'Real-time log analysis pipeline with AI-powered anomaly detection',
    overallStatus: 'success',
    updatedAt: new Date(Date.now() - 300000).toISOString(),
    steps: [
      { id: 't1', label: 'Log Shipper', type: 'source', status: 'success', detail: 'Forwarding 2000 eps', latency: 8 },
      { id: 't2', label: 'Parsing & Indexing', type: 'process', status: 'success', detail: 'Index rate: 1950 eps', latency: 32 },
      { id: 't3', label: 'AI Anomaly Detection', type: 'ai', status: 'success', detail: 'No anomalies detected', latency: 156 },
      { id: 't4', label: 'Storage', type: 'output', status: 'success', detail: 'Written to hot storage', latency: 5 },
    ],
  },
  {
    id: 'flow-3',
    name: 'RUM → APM → Trace Analysis',
    description: 'End-to-end user monitoring through application performance',
    overallStatus: 'warning',
    updatedAt: new Date(Date.now() - 60000).toISOString(),
    steps: [
      { id: 'u1', label: 'Browser RUM', type: 'monitor', status: 'success', detail: 'LCP: 1.8s, CLS: 0.05', latency: 0 },
      { id: 'u2', label: 'CDN Edge', type: 'process', status: 'success', detail: 'Cache hit: 87%', latency: 15 },
      { id: 'u3', label: 'APM Tracing', type: 'monitor', status: 'warning', detail: 'Error rate: 2.3% (threshold: 1%)', latency: 89 },
      { id: 'u4', label: 'AI Root Cause', type: 'ai', status: 'success', detail: 'Root cause: DB connection pool', latency: 420 },
      { id: 'u5', label: 'Auto Remediation', type: 'output', status: 'pending', detail: 'Remediation script queued', latency: 0 },
    ],
  },
];

/** 状态颜色映射 */
function statusColor(status: StatusType): string {
  switch (status) {
    case 'success': return '#52c41a';
    case 'error': return '#ff4d4f';
    case 'warning': return '#faad14';
    case 'pending': return '#d9d9d9';
  }
}

function statusIcon(status: StatusType) {
  switch (status) {
    case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'error': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    case 'warning': return <WarningOutlined style={{ color: '#faad14' }} />;
    case 'pending': return <SyncOutlined spin style={{ color: '#d9d9d9' }} />;
  }
}

/** 节点图标映射 */
function nodeIcon(type: string) {
  switch (type) {
    case 'source': return <CloudServerOutlined />;
    case 'ai': return <RobotOutlined />;
    case 'process': return <ApiOutlined />;
    case 'output': return <DatabaseOutlined />;
    case 'monitor': return <ApiOutlined />;
    default: return <ApiOutlined />;
  }
}

/** 自定义 ReactFlow 节点 */
function E2ENode({ data }: { data: { label: string; status: StatusType; type: string; detail?: string } }) {
  return (
    <div style={{
      padding: '10px 16px', borderRadius: 8,
      border: `2px solid ${statusColor(data.status)}`,
      background: '#fff', minWidth: 140,
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    }}>
      <Handle type="target" position={'left' as Position} style={{ background: '#6C53B1' }} />
      <Space>
        {statusIcon(data.status)}
        {nodeIcon(data.type)}
        <Text strong style={{ fontSize: 12 }}>{data.label}</Text>
      </Space>
      {data.detail && (
        <div style={{ marginTop: 4, fontSize: 11, color: '#888' }}>{data.detail}</div>
      )}
      <Handle type="source" position={'right' as Position} style={{ background: '#6C53B1' }} />
    </div>
  );
}

const nodeTypes: NodeTypes = { e2eNode: E2ENode };

export default function E2EMonitoring() {
  const { t } = useTranslation('e2eMonitoring');
  const { message } = App.useApp();
  const [selectedFlow, setSelectedFlow] = useState<string>(mockFlows[0].id);
  const [flows] = useState<E2EFlow[]>(mockFlows);

  const currentFlow = useMemo(() => flows.find((f) => f.id === selectedFlow) || flows[0], [flows, selectedFlow]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!currentFlow) return { nodes: [], edges: [] };
    const stepCount = currentFlow.steps.length;
    const nodes: Node[] = currentFlow.steps.map((step, i) => ({
      id: step.id,
      type: 'e2eNode',
      position: { x: 220 * i + 40, y: 120 },
      data: { label: step.label, status: step.status, type: step.type, detail: step.detail },
    }));
    const edges: Edge[] = currentFlow.steps.slice(0, -1).map((step, i) => ({
      id: `e-${step.id}-${currentFlow.steps[i + 1].id}`,
      source: step.id,
      target: currentFlow.steps[i + 1].id,
      animated: true,
      style: { stroke: '#6C53B1', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6C53B1' },
    }));
    return { nodes, edges };
  }, [currentFlow]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setRfNodes(initialNodes);
    setRfEdges(initialEdges);
  }, [initialNodes, initialEdges, setRfNodes, setRfEdges]);

  if (!currentFlow) return null;

  return (
    <PageLayout title={t('title')} icon={<RobotOutlined />}>
      <div style={{ padding: 16 }}>
        {/* 流程选择 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Select
              value={selectedFlow}
              onChange={setSelectedFlow}
              style={{ width: '100%' }}
              options={flows.map((f) => ({
                label: (
                  <Space>
                    {statusIcon(f.overallStatus)}
                    <span>{f.name}</span>
                  </Space>
                ),
                value: f.id,
              }))}
            />
          </Col>
          <Col>
            <Tag color={currentFlow.overallStatus === 'error' ? 'red' : currentFlow.overallStatus === 'warning' ? 'orange' : 'green'}>
              {currentFlow.overallStatus.toUpperCase()}
            </Tag>
            <Text type='secondary' style={{ fontSize: 12, marginLeft: 8 }}>
              {currentFlow.description}
            </Text>
          </Col>
        </Row>

        {/* 概览卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {currentFlow.steps.map((step) => (
            <Col key={step.id} span={Math.floor(24 / currentFlow.steps.length)}>
              <Card size='small' style={{ borderTop: `3px solid ${statusColor(step.status)}` }}>
                <Space>
                  {statusIcon(step.status)}
                  <Text strong>{step.label}</Text>
                </Space>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  <Text type='secondary'>{step.detail}</Text>
                </div>
                {step.latency ? (
                  <div style={{ fontSize: 11, marginTop: 2 }}>
                    <Text type='secondary'>{step.latency}ms</Text>
                  </div>
                ) : null}
              </Card>
            </Col>
          ))}
        </Row>

        {/* ReactFlow 可视化 */}
        <Card style={{ height: 400 }}>
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition='bottom-left'
          >
            <Background color='#f0f0f0' gap={16} />
            <Controls />
            <MiniMap
              nodeStrokeColor='#6C53B1'
              nodeColor='#EAE6F3'
              maskColor='rgba(0,0,0,0.05)'
            />
          </ReactFlow>
        </Card>
      </div>
    </PageLayout>
  );
}
