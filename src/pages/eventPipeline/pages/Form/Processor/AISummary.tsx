import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Form, Input, InputNumber, Switch, Space, Tooltip, Modal, Button, Tag, Divider, Typography, Spin, App } from 'antd';
import { DownOutlined, RightOutlined, PlusCircleOutlined, MinusCircleOutlined, QuestionCircleOutlined, ThunderboltOutlined, RobotOutlined, WarningOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { FormListFieldData } from 'antd/lib/form/FormList';
import classnames from 'classnames';

import CodeMirror from '@/components/CodeMirror';
import Markdown from '@/components/Markdown';
import { AIProvider, type AIConnectionConfig, type AIProcessError, type AIProcessResult } from '@/shared/ai';
import { processWithAI, testAIConnection } from '@/shared/ai/services';

import { NS } from '../../../constants';

const { Text } = Typography;

interface Props {
  field: FormListFieldData;
  namePath: (string | number)[];
}

/** 构建测试用的示例告警事件数据 */
function buildSampleEvent(): Record<string, unknown> {
  return {
    RuleName: 'CPU Usage Alert',
    Severity: '2',
    IsRecovered: false,
    TriggerTime: new Date().toISOString(),
    TriggerValue: '95.3%',
    RuleNote: 'CPU usage for app-server-01 has been high for more than 5 minutes',
    Tags: JSON.stringify([{ key: 'service', value: 'web-api' }, { key: 'host', value: 'app-server-01' }, { key: 'env', value: 'production' }]),
    Annotations: JSON.stringify([{ key: 'description', value: 'Application server CPU usage anomaly' }]),
  };
}

/** 渲染测试结果内容 */
function TestResultContent({ result }: { result: AIProcessResult }) {
  const hasError = result.output.error != null;
  const hasAnalysis = result.output.analysis != null;
  const errors = result.errors || [];
  const errorStr = hasError ? String(result.output.error) : '';

  return (
    <div style={{ maxHeight: 500, overflow: 'auto' }}>
      {/* 连接状态 */}
      {hasError ? (
        <div style={{ padding: 12, background: '#fff2f0', borderRadius: 6, marginBottom: 16 }}>
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            <Text type='danger'>{errorStr}</Text>
          </Space>
        </div>
      ) : (
        <div style={{ padding: 12, background: '#f6ffed', borderRadius: 6, marginBottom: 16 }}>
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Text type='success'>AI processor executed successfully</Text>
          </Space>
        </div>
      )}

      {/* AI 分析结果 */}
      {hasAnalysis && (
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13 }}>AI Analysis Result:</Text>
          <div style={{
            marginTop: 8, padding: 12, background: '#fafafa',
            borderRadius: 6, border: '1px solid var(--fc-border-color, #f0f0f0)',
          }}>
            <Markdown content={String(result.output.analysis)} />
          </div>
        </div>
      )}

      {/* 结构化的错误信息 */}
      {errors.length > 0 && (
        <div>
          <Divider />
          <Space style={{ marginBottom: 12 }}>
            <WarningOutlined style={{ color: '#faad14' }} />
            <Text strong>Generated Errors ({errors.length})</Text>
          </Space>
          {errors.map((err, i) => (
            <div key={i} style={{
              padding: 12, marginBottom: 8,
              borderRadius: 6,
              border: '1px solid var(--fc-border-color, #f0f0f0)',
              background: err.severity === 'critical' ? '#fff2f0' :
                          err.severity === 'warning' ? '#fffbe6' : '#e6f7ff',
            }}>
              <Space style={{ marginBottom: 8 }}>
                <Tag color={err.severity === 'critical' ? 'red' : err.severity === 'warning' ? 'orange' : 'blue'}>
                  {err.severity.toUpperCase()}
                </Tag>
                <Tag>{err.category}</Tag>
                <Text strong>{err.title}</Text>
              </Space>
              <div style={{ fontSize: 12, color: '#666' }}>{err.description}</div>
              {err.suggestion && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#6C53B1' }}>
                  Suggestion: {err.suggestion}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 原始响应查看 */}
      {result.raw_response && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontSize: 12, color: '#888' }}>Raw AI Response</summary>
          <pre style={{
            marginTop: 8, padding: 8, fontSize: 11,
            background: '#f5f5f5', borderRadius: 4,
            maxHeight: 200, overflow: 'auto',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>
            {result.raw_response}
          </pre>
        </details>
      )}
    </div>
  );
}

export default function AISummary(props: Props) {
  const { t } = useTranslation(NS);
  const { message } = App.useApp();
  const { field, namePath = [] } = props;
  const { name, key, ...resetField } = field;
  const [isAdvancedVisible, setIsAdvancedVisible] = useState(false);
  const [testingModalOpen, setTestingModalOpen] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<AIProcessResult | null>(null);

  /** 获取当前表单中 AI 配置值 */
  const getAIConfig = (): AIConnectionConfig | null => {
    const form = Form.useFormInstance();
    const values = form.getFieldsValue();
    const processors = values?.processors || [];
    const processor = processors[name];
    if (!processor) return null;
    const cfg = processor as Record<string, unknown>;
    const customParams = cfg.custom_params as Record<string, string> | undefined;
    return {
      provider: AIProvider.OpenAI,
      url: String(cfg.url || ''),
      api_key: String(cfg.api_key || ''),
      model_name: String(cfg.model_name || 'deepseek-chat'),
      temperature: Number(customParams?.temperature) || 0.7,
      max_tokens: Number(customParams?.max_tokens) || 4096,
      timeout: Number(cfg.timeout) || 30000,
      proxy: String(cfg.proxy || ''),
      skip_ssl_verify: Boolean(cfg.insecure_skip_verify),
    };
  };

  /** 测试 AI 处理器调用 */
  const handleTestProcessor = async () => {
    const config = getAIConfig();
    if (!config || !config.url) {
      message.open({ type: 'warning', content: 'Please configure URL and API Key first' });
      return;
    }

    setTestLoading(true);
    setTestResult(null);
    setTestingModalOpen(true);

    try {
      const sampleEvent = buildSampleEvent();
      const connectionTest = await testAIConnection(config);
      if (!connectionTest.success) {
        setTestResult({
          output: { error: `AI Connection failed: ${connectionTest.message}` },
          raw_response: '',
          errors: [{
            severity: 'critical',
            category: 'connection',
            title: 'AI Connection Test Failed',
            description: connectionTest.message,
            suggestion: 'Check your API URL, API Key, and network connectivity',
          }],
        });
        return;
      }

      const result = await processWithAI(
        {
          connection: config,
          processing_template: '',
          error_generation: { enabled: true },
        },
        sampleEvent as Record<string, unknown>,
      );
      setTestResult(result);
      message.success('AI processor test completed');
    } catch (err) {
      setTestResult({
        output: { error: String(err) },
        raw_response: '',
        errors: [{
          severity: 'critical',
          category: 'execution',
          title: 'AI Processor Execution Error',
          description: err instanceof Error ? err.message : String(err),
          suggestion: 'Check configuration and try again',
        }],
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <>
      <Row gutter={10}>
        <Col span={10}>
          <Form.Item
            {...resetField}
            label='URL'
            tooltip={{
              title: <Markdown style={{ marginTop: 16, marginRight: 12 }} content={t('ai_summary.url_tip')} />,
              overlayClassName: 'ant-tooltip-max-width-600',
            }}
            name={[...namePath, 'url']}
            rules={[{ required: true, message: t('ai_summary.url_required') }]}
          >
            <Input placeholder={t('ai_summary.url_placeholder')} />
          </Form.Item>
        </Col>
        <Col span={7}>
          <Form.Item
            {...resetField}
            label='API Key'
            tooltip={{
              title: <Markdown style={{ marginTop: 16, marginRight: 12 }} content={t('ai_summary.api_key_tip')} />,
              overlayClassName: 'ant-tooltip-max-width-600',
            }}
            name={[...namePath, 'api_key']}
            rules={[{ required: true, message: t('ai_summary.api_key_required') }]}
          >
            <Input.Password placeholder={t('ai_summary.api_key_placeholder')} />
          </Form.Item>
        </Col>
        <Col span={7}>
          <Form.Item
            {...resetField}
            label={t('ai_summary.model_name')}
            tooltip={{
              title: <Markdown style={{ marginTop: 16, marginRight: 12 }} content={t('ai_summary.model_name_tip')} />,
              overlayClassName: 'ant-tooltip-max-width-600',
            }}
            name={[...namePath, 'model_name']}
            rules={[{ required: true, message: t('ai_summary.model_name_required') }]}
          >
            <Input placeholder={t('ai_summary.model_name_placeholder')} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={10} style={{ marginBottom: 16 }}>
        <Col>
          <Button size='small' icon={<ThunderboltOutlined />} onClick={handleTestProcessor}>
            Test AI Processor
          </Button>
        </Col>
      </Row>

      <Form.Item
        {...resetField}
        label={t('ai_summary.prompt_template')}
        tooltip={{
          title: <Markdown style={{ marginTop: 16 }} content={t('ai_summary.prompt_template_tip', { interpolation: { skipOnVariables: true } })} />,
          overlayClassName: 'ant-tooltip-max-width-600 ant-tooltip-with-link',
        }}
        name={[...namePath, 'prompt_template']}
        rules={[{ required: true, message: t('ai_summary.prompt_template_required') }]}
        initialValue={t('ai_summary.prompt_template_placeholder', { interpolation: { skipOnVariables: true } })}
      >
        <CodeMirror
          height='200px'
          options={{ lineNumbers: true, mode: 'text' }}
          placeholder={t('ai_summary.prompt_template_placeholder', { interpolation: { skipOnVariables: true } })}
        />
      </Form.Item>
      <div className='mb-4'>
        <div className='flex items-center cursor-pointer mb-2' onClick={() => setIsAdvancedVisible(!isAdvancedVisible)}>
          <span className='text-sm pr-1'>{t('ai_summary.advanced_config')}</span>
          {isAdvancedVisible ? <DownOutlined /> : <RightOutlined />}
        </div>
        <div
          className={classnames({
            'p-4 border-t border-solid border-[var(--fc-border-color)]': true,
            hidden: !isAdvancedVisible,
          })}
        >
          <div className='space-y-4'>
            {/* Custom Params */}
            <Form.List name={[...namePath, 'custom_params']}>
              {(fields, { add, remove }) => (
                <div className='mb-4'>
                  <div className='mb-3'>
                    <Space size={4}>
                      Custom Params
                      <span style={{ color: '#888' }}>({t('ai_summary.custom_params')})</span>
                      <Tooltip
                        placement='rightTop'
                        overlayClassName='ant-tooltip-max-width-600'
                        title={
                          <div style={{ maxWidth: 600 }}>
                            <Markdown style={{ margin: '16px 12px 0 12px' }} content={t('ai_summary.custom_params_tip')} />
                          </div>
                        }
                      >
                        <QuestionCircleOutlined style={{ color: '#888' }} />
                      </Tooltip>
                      <PlusCircleOutlined onClick={() => add({ key: '', value: '' })} />
                    </Space>
                  </div>
                  {fields.length > 0 && (
                    <Row gutter={10} className='mb-3'>
                      <Col flex='auto'>
                        <Row gutter={10}>
                          <Col span={12}>{t('ai_summary.custom_params_key_label')}</Col>
                          <Col span={12}>{t('ai_summary.custom_params_value_label')}</Col>
                        </Row>
                      </Col>
                      <Col flex='none'>
                        <div className='w-3' />
                      </Col>
                    </Row>
                  )}
                  <div>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row gutter={10} key={key} className='mb-2'>
                        <Col flex='auto'>
                          <Row gutter={10}>
                            <Col span={12}>
                              <Form.Item {...restField} name={[name, 'key']} className='mb-0'>
                                <Input placeholder='temperature' />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item {...restField} name={[name, 'value']} className='mb-0'>
                                <Input placeholder='0.7' />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Col>
                        <Col flex='none'>
                          <MinusCircleOutlined className='mt-2' onClick={() => remove(name)} />
                        </Col>
                      </Row>
                    ))}
                  </div>
                </div>
              )}
            </Form.List>
            {/* HTTP Headers */}
            <Form.List name={[...namePath, 'header']}>
              {(fields, { add, remove }) => (
                <div className='mb-4'>
                  <div className='mb-3'>
                    <Space size={4}>
                      <span className='text-sm'>HTTP Headers</span>
                      <PlusCircleOutlined onClick={() => add({ key: '', value: '' })} />
                    </Space>
                  </div>
                  {fields.length > 0 && (
                    <Row gutter={10} className='mb-3'>
                      <Col flex='auto'>
                        <Row gutter={10}>
                          <Col span={12}>Header Key</Col>
                          <Col span={12}>Header Value</Col>
                        </Row>
                      </Col>
                      <Col flex='none'>
                        <div className='w-3' />
                      </Col>
                    </Row>
                  )}
                  <div>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row gutter={10} key={key} className='mb-2'>
                        <Col flex='auto'>
                          <Row gutter={10}>
                            <Col span={12}>
                              <Form.Item {...restField} name={[name, 'key']} className='mb-0'>
                                <Input placeholder='Header Key' />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item {...restField} name={[name, 'value']} className='mb-0'>
                                <Input placeholder='Header Value' />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Col>
                        <Col flex='none'>
                          <MinusCircleOutlined className='mt-2' onClick={() => remove(name)} />
                        </Col>
                      </Row>
                    ))}
                  </div>
                </div>
              )}
            </Form.List>
            <Row gutter={10} className='mb-3'>
              <Col flex='auto'>
                <Row gutter={10}>
                  <Col span={12}>
                    <Form.Item {...resetField} label='HTTP Proxy' name={[...namePath, 'proxy']}>
                      <Input placeholder={t('ai_summary.proxy_placeholder')} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      {...resetField}
                      label='Timeout'
                      name={[...namePath, 'timeout']}
                      initialValue={30000}
                      rules={[{ required: true, message: t('ai_summary.timeout_required') }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} addonAfter='ms' placeholder={t('ai_summary.timeout_placeholder')} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item {...resetField} label='TLS InsecureSkipVerify' name={[...namePath, 'insecure_skip_verify']} valuePropName='checked'>
                      <Switch size='small' />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
              <Col flex='none'>
                <div className='w-3' />
              </Col>
            </Row>
          </div>
        </div>
      </div>

      {/* AI Processor Test Result Modal */}
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#6C53B1' }} />
            <span>AI Processor Test Result</span>
            {testLoading && <Spin size='small' />}
          </Space>
        }
        open={testingModalOpen}
        onCancel={() => { setTestingModalOpen(false); setTestResult(null); }}
        footer={[
          <Button key='close' onClick={() => { setTestingModalOpen(false); setTestResult(null); }}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {testLoading && !testResult && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Spin />
            <div style={{ marginTop: 12 }}><Text type='secondary'>Running AI processor test...</Text></div>
          </div>
        )}

        {testResult && <TestResultContent result={testResult} />}
      </Modal>
    </>
  );
}
