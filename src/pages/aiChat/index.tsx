import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Card, Input, Button, Form, Select, Typography, Space, Divider,
  Tag, Spin, Tooltip, Row, Col, Collapse, App, InputNumber, Empty,
} from 'antd';
import {
  SendOutlined, ClearOutlined, SettingOutlined,
  RobotOutlined, ApiOutlined, StopOutlined,
  PlusOutlined, ThunderboltOutlined, ReloadOutlined,
  ClockCircleOutlined, CloseOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import Markdown from '@/components/Markdown';
import PageLayout from '@/components/pageLayout';
import { AIProvider, type AIConnectionConfig, type ChatMessage, type ConversationState } from '@/shared/ai';
import { sendChatMessage, testAIConnection } from '@/shared/ai/services';
import {
  PROVIDER_PROFILES, MAX_CONTEXT_MESSAGES,
  getProfile,
} from '@/shared/ai/constants';

import './locale';
import './aiChat.less';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

// ── Provider options ──
const PROVIDER_OPTIONS = Object.entries(PROVIDER_PROFILES).map(([value, p]) => ({
  value,
  label: p.displayName,
  desc: p.description,
}));

// ── Suggestion prompts (used in empty state) ──
const SUGGESTIONS_KEY = 'suggestion';
const SUGGESTION_ITEMS = [
  { key: 'analyze', icon: '📊' },
  { key: 'troubleshoot', icon: '🔍' },
  { key: 'dashboard', icon: '📈' },
  { key: 'code', icon: '💻' },
];

// ── Chat message type with metadata ──
interface ChatMsg extends ChatMessage {
  id: string;
  timestamp: number;
  status?: 'sending' | 'sent' | 'error';
  errorText?: string;
}

// ── Helpers ──
function loadConfig(): AIConnectionConfig {
  try {
    const saved = localStorage.getItem('ai_chat_config');
    if (saved) return JSON.parse(saved);
  } catch {}
  const profile = PROVIDER_PROFILES[AIProvider.Enterprise];
  return {
    provider: AIProvider.Enterprise,
    url: profile.defaultApiUrl || '',
    model_name: profile.defaults.model,
    temperature: profile.defaults.temperature,
    max_tokens: profile.defaults.maxTokens,
    timeout: profile.defaults.timeout,
    api_key: '',
    system_prompt: '',
    providerExtra: {},
  };
}

function saveConfig(cfg: AIConnectionConfig) {
  try { localStorage.setItem('ai_chat_config', JSON.stringify(cfg)); } catch {}
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just_now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Component ──
export default function AIChat() {
  const { t } = useTranslation('aiChat');
  const { message } = App.useApp();
  const [form] = Form.useForm();

  // Configuration
  const [config, setConfig] = useState<AIConnectionConfig>(loadConfig);
  const [showConfig, setShowConfig] = useState(!config.api_key && !config.url);
  const profile = useMemo(() => getProfile(config.provider), [config.provider]);

  // Messages
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // Conversation state
  const [conversation, setConversation] = useState<ConversationState>({
    conversationId: `chat-${Date.now()}`,
    parentId: null,
    messages: [],
    isSingleTurn: false,
  });
  const [isNewChat, setIsNewChat] = useState(true);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto scroll
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, streamingContent]);

  // Focus input after send completes
  useEffect(() => {
    if (!isSending) inputRef.current?.focus();
  }, [isSending]);

  // Init form values from saved config
  useEffect(() => {
    form.setFieldsValue(config);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Provider switch ──
  const handleProviderChange = (val: AIProvider) => {
    const p = PROVIDER_PROFILES[val];
    form.setFieldsValue({
      provider: val,
      model_name: p.defaults.model,
      temperature: p.defaults.temperature,
      max_tokens: p.defaults.maxTokens,
      timeout: p.defaults.timeout,
      url: p.defaultApiUrl || '',
    });
  };

  // ── Interrupt current generation ──
  const handleInterrupt = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsSending(false);
    setStreamingContent('');
  }, []);

  // ── Send or Interrupt ──
  const handleSendOrInterrupt = useCallback(() => {
    if (isSending) {
      handleInterrupt();
      return;
    }
    handleSend();
  }, [isSending, handleInterrupt]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send message ──
  const handleSend = useCallback(async (retryContent?: string) => {
    const msg = (retryContent || input).trim();
    if (!msg) return;

    // Validate configuration
    if (!config.url && !profile.defaultApiUrl) {
      message.open({ type: 'warning', content: t('ai_chat.error_config') });
      return;
    }

    setErrorMsg(null);

    // Build user message
    const now = Date.now();
    const userMsg: ChatMsg = {
      role: 'user', content: msg,
      id: `user-${now}`, timestamp: now, status: 'sent',
    };

    if (!retryContent) {
      setInput('');
      setMessages((prev) => [...prev, userMsg]);
    }

    // Placeholder assistant message for streaming
    const aiId = `ai-${Date.now()}`;
    const aiPlaceholder: ChatMsg = {
      role: 'assistant', content: '',
      id: aiId, timestamp: Date.now(), status: 'sending',
    };

    if (!retryContent) {
      setMessages((prev) => [...prev, aiPlaceholder]);
    } else {
      // Retry: replace the last message (the error one)
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...aiPlaceholder, id: `ai-${Date.now()}` };
        return next;
      });
    }

    setIsSending(true);
    setStreamingContent('');

    // Context for AI
    const contextMsgs = retryContent
      ? [...messages.slice(0, -1), { role: 'user' as const, content: msg, id: `user-${now}`, timestamp: now }]
      : [...messages, userMsg];
    const trimmedContext = contextMsgs.slice(-MAX_CONTEXT_MESSAGES);

    const controller = new AbortController();
    abortRef.current = controller;

    const mergedConfig = { ...config, url: config.url || profile.defaultApiUrl };

    let fullContent = '';
    try {
      const convPayload = isNewChat && !retryContent
        ? undefined
        : { conversationId: conversation.conversationId, parentId: conversation.parentId };

      await sendChatMessage(
        mergedConfig,
        trimmedContext.map((m) => ({ role: m.role, content: m.content })),
        (chunk) => {
          fullContent += chunk;
          setStreamingContent(fullContent);
        },
        convPayload,
      );

      // Update the placeholder with actual content
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiPlaceholder.id
            ? { ...m, content: fullContent, status: 'sent' as const, timestamp: Date.now() }
            : m,
        ),
      );
      setStreamingContent('');

      // Update conversation state for multi-turn
      setConversation((prev) => ({ ...prev, parentId: aiPlaceholder.id }));
      setIsNewChat(false);
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        // User interrupted: keep partial content
        if (fullContent) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiPlaceholder.id
                ? { ...m, content: fullContent + '\n\n*(Generation interrupted)*', status: 'sent' as const }
                : m,
            ),
          );
        }
        setStreamingContent('');
        return;
      }

      // Error state
      const rawMessage = err instanceof Error ? err.message : String(err);
      const isNetwork = !navigator.onLine || rawMessage.toLowerCase().includes('network') || rawMessage.toLowerCase().includes('fetch');
      const displayError = isNetwork ? t('ai_chat.error_network') : `${t('ai_chat.error_api')}: ${rawMessage}`;

      setErrorMsg(displayError);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiPlaceholder.id
            ? { ...m, content: '', status: 'error' as const, errorText: displayError, timestamp: Date.now() }
            : m,
        ),
      );
      setStreamingContent('');
    } finally {
      setIsSending(false);
      abortRef.current = null;
    }
  }, [input, config, messages, conversation, isNewChat, profile, t, message]);

  // ── Retry last message ──
  const handleRetry = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    }
  }, [messages, handleSend]);

  // ── Connection test ──
  const handleTestConnection = async () => {
    const values = await form.validateFields();
    const testConfig: AIConnectionConfig = { ...values, providerExtra: config.providerExtra };
    setTesting(true);
    message.open({ type: 'loading', content: t('ai_chat.testing'), key: 'test', duration: 0 });
    const result = await testAIConnection(testConfig);
    setTesting(false);
    if (result.success) {
      message.open({ type: 'success', content: `${t('ai_chat.connection_success')} (${result.latency}ms)`, key: 'test', duration: 3 });
    } else {
      message.open({ type: 'error', content: `${t('ai_chat.connection_failed')}: ${result.message}`, key: 'test', duration: 5 });
    }
  };

  // ── Save config ──
  const handleSaveConfig = async () => {
    const values = await form.validateFields();
    const newConfig: AIConnectionConfig = { ...values, providerExtra: config.providerExtra };
    setConfig(newConfig);
    saveConfig(newConfig);
    setShowConfig(false);
    message.open({ type: 'success', content: t('ai_chat.config_saved') });
  };

  // ── New chat ──
  const handleNewChat = () => {
    setMessages([]);
    setStreamingContent('');
    setErrorMsg(null);
    setConversation({ conversationId: `chat-${Date.now()}`, parentId: null, messages: [], isSingleTurn: false });
    setIsNewChat(true);
  };

  // ── Key handler ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSendOrInterrupt();
    }
  };

  // ── Suggestion click ──
  const handleSuggestion = (key: string) => {
    const suggestionMap: Record<string, string> = {
      analyze: 'Analyze the current system performance metrics. CPU at 85%, memory at 72%, disk I/O latency 15ms. Identify any bottlenecks.',
      troubleshoot: 'Users are reporting 503 errors on the payment service. The error rate spiked from 0.1% to 5.3% in the last 10 minutes. Troubleshoot.',
      dashboard: 'Help me design a monitoring dashboard for a microservices architecture with 12 services, covering latency, error rate, and throughput.',
      code: 'Write a PromQL query that calculates the 95th percentile CPU usage over the last 5 minutes, grouped by instance.',
    };
    setInput(suggestionMap[key] || '');
    inputRef.current?.focus();
  };

  // ── Check if configured ──
  const hasValidUrl = !!(config.url || profile?.defaultApiUrl);
  const isConfigured = hasValidUrl;

  return (
    <PageLayout title={t('ai_chat.title')} icon={<RobotOutlined />}>
      <div style={{ height: 'calc(100% - 16px)', display: 'flex', gap: 16 }}>

        {/* ─── Config Sidebar ─── */}
        {showConfig && (
          <Card
            style={{ width: 400, minWidth: 400, overflow: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}
            styles={{ body: { padding: 16, height: '100%', overflow: 'auto', scrollbarWidth: 'none' } }}
            className="hide-scrollbar"
          >
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
              <Space>
                <ApiOutlined style={{ fontSize: 20, color: '#6C53B1' }} />
                <Title level={5} style={{ margin: 0 }}>{t('ai_chat.config')}</Title>
              </Space>
              <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setShowConfig(false)} />
            </Row>

            <Form form={form} layout="vertical" size="small" initialValues={config}>
              <Form.Item label={t('ai_chat.provider')} name="provider">
                <Select onChange={(val) => handleProviderChange(val as AIProvider)}>
                  {PROVIDER_OPTIONS.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      <Space>
                        <Text strong>{opt.label}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{opt.desc}</Text>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label={t('ai_chat.model')} name="model_name" rules={[{ required: true }]}>
                <Select
                  showSearch
                  placeholder={t('ai_chat.model_placeholder')}
                  options={profile.models.map((m) => ({
                    label: `${m.name}${m.contextWindow ? ` (${Math.round(m.contextWindow / 1000)}K)` : ''}`,
                    value: m.id,
                  }))}
                />
              </Form.Item>

              <Form.Item label={t('ai_chat.api_url')} name="url"
                rules={[{ required: !profile.defaultApiUrl }]}
              >
                <Input placeholder={profile.defaultApiUrl || t('ai_chat.url_placeholder')} />
              </Form.Item>

              <Form.Item label={t('ai_chat.api_key')} name="api_key">
                <Input.Password placeholder="..." />
              </Form.Item>

              <Form.Item label={t('ai_chat.system_prompt')} name="system_prompt">
                <TextArea rows={3} placeholder={t('ai_chat.system_prompt_placeholder')} />
              </Form.Item>

              {/* Provider-specific extra params */}
              {profile.extraParams.length > 0 && (
                <Collapse ghost size="small">
                  <Panel header={`${profile.displayName} ${t('ai_chat.advanced')}`} key="extra">
                    {profile.extraParams.map((param) => (
                      <Form.Item key={param.key} label={param.label} name={['providerExtra', param.key]} initialValue={param.defaultValue}>
                        {param.type === 'number' ? <InputNumber style={{ width: '100%' }} min={0} step={0.1} /> : <Input />}
                      </Form.Item>
                    ))}
                  </Panel>
                </Collapse>
              )}

              <Collapse ghost size="small" style={{ marginTop: 8 }}>
                <Panel header={t('ai_chat.advanced')} key="advanced">
                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item label={t('ai_chat.temperature')} name="temperature">
                        <InputNumber style={{ width: '100%' }} min={profile.temperatureRange[0]} max={profile.temperatureRange[1]} step={0.1} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={t('ai_chat.max_tokens')} name="max_tokens">
                        <InputNumber style={{ width: '100%' }} min={1} max={profile.maxTokensLimit} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label={t('ai_chat.timeout')} name="timeout">
                    <InputNumber style={{ width: '100%' }} min={1000} max={300000} addonAfter="ms" />
                  </Form.Item>
                </Panel>
              </Collapse>

              <Divider style={{ margin: '12px 0' }} />
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setShowConfig(false)}>{t('ai_chat.cancel')}</Button>
                <Button onClick={handleTestConnection} loading={testing} icon={<ThunderboltOutlined />}>
                  {testing ? t('ai_chat.testing') : t('ai_chat.test_connection')}
                </Button>
                <Button type="primary" onClick={handleSaveConfig}>{t('ai_chat.save')}</Button>
              </Space>
            </Form>
          </Card>
        )}

        {/* ─── Chat Panel ─── */}
        <Card
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
        >
          {/* Top bar */}
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid var(--fc-border-color, #f0f0f0)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <Space>
              <RobotOutlined style={{ fontSize: 18, color: '#6C53B1' }} />
              <Text strong>{t('ai_chat.title')}</Text>
              <Tag color="purple" style={{ fontSize: 11 }}>{profile?.displayName}</Tag>
              {isConfigured && <Tag color="success" style={{ fontSize: 11 }}>{config.model_name}</Tag>}
              <Text type="secondary" style={{ fontSize: 11 }}>
                {messages.length > 0 && `${messages.length} messages`}
              </Text>
            </Space>
            <Space>
              <Button size="small" icon={<SettingOutlined />} type={showConfig ? 'primary' : 'default'} onClick={() => setShowConfig((v) => !v)}>
                {t('ai_chat.config')}
              </Button>
              <Button size="small" icon={<PlusOutlined />} onClick={handleNewChat}>
                {t('ai_chat.new_chat')}
              </Button>
            </Space>
          </div>

          {/* Message area */}
          <div className="hide-scrollbar" style={{
            flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 20px',
            background: 'var(--fc-fill-2, #fafafa)',
            scrollbarWidth: 'none',
          }}>
            {messages.length === 0 && !isSending ? (
              /* Empty state with suggestions */
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', gap: 24,
              }}>
                <RobotOutlined style={{ fontSize: 56, color: '#6C53B1', opacity: 0.8 }} />
                <Space direction="vertical" align="center" size={4}>
                  <Text style={{ fontSize: 18, fontWeight: 600 }}>{t('ai_chat.welcome_title')}</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>{t('ai_chat.welcome_subtitle')}</Text>
                </Space>

                <Row gutter={[12, 12]} style={{ maxWidth: 520 }}>
                  {SUGGESTION_ITEMS.map((item) => (
                    <Col key={item.key} span={12}>
                      <Button
                        block
                        style={{
                          height: 52, textAlign: 'left', borderRadius: 8,
                          border: '1px solid var(--fc-border-color, #e8e8e8)',
                          background: '#fff',
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '0 12px',
                        }}
                        onClick={() => handleSuggestion(item.key)}
                      >
                        <span style={{ fontSize: 18 }}>{item.icon}</span>
                        <Text style={{ fontSize: 12, whiteSpace: 'normal', lineHeight: 1.4 }}>
                          {t(`ai_chat.suggestion_${item.key}`)}
                        </Text>
                      </Button>
                    </Col>
                  ))}
                </Row>

                <Text type="secondary" style={{ fontSize: 11 }}>
                  {t('ai_chat.ctrl_enter_hint')}
                </Text>
              </div>
            ) : (
              /* Message list */
              <>
                {messages.map((msg) => (
                  <div key={msg.id} style={{
                    display: 'flex', marginBottom: 20,
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{ maxWidth: '78%' }}>
                      {/* Meta row */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        marginBottom: 4,
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      }}>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          {msg.role === 'user' ? 'You' : profile?.displayName || 'AI'}
                        </Text>
                        <ClockCircleOutlined style={{ fontSize: 9, color: '#bbb' }} />
                        <Text type="secondary" style={{ fontSize: 10 }}>{formatTime(msg.timestamp)}</Text>
                        {msg.role === 'assistant' && msg.status === 'sending' && (
                          <Spin size="small" style={{ marginLeft: 4 }} />
                        )}
                      </div>

                      {/* Bubble */}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: msg.role === 'user' ? '#6C53B1' : '#fff',
                        color: msg.role === 'user' ? '#fff' : 'inherit',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        border: msg.role === 'user' ? 'none' : '1px solid var(--fc-border-color, #f0f0f0)',
                      }}>
                        {msg.status === 'error' ? (
                          <Space direction="vertical" size={8}>
                            <Space>
                              <Tag color="red">Error</Tag>
                              <Text type="danger" style={{ fontSize: 12 }}>{msg.errorText}</Text>
                            </Space>
                            <Button size="small" icon={<ReloadOutlined />} onClick={handleRetry}>
                              {t('ai_chat.retry')}
                            </Button>
                          </Space>
                        ) : msg.role === 'assistant' ? (
                          msg.content ? <Markdown content={msg.content} /> : <Spin />
                        ) : (
                          <Text style={{ color: '#fff', whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Streaming output */}
                {isSending && streamingContent && (
                  <div style={{ display: 'flex', marginBottom: 20, justifyContent: 'flex-start' }}>
                    <div style={{ maxWidth: '78%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 10 }}>{profile?.displayName}</Text>
                        <Spin size="small" />
                      </div>
                      <div style={{
                        padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                        background: '#fff', border: '1px solid var(--fc-border-color, #f0f0f0)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      }}>
                        <Markdown content={streamingContent} />
                        <span style={{ display: 'inline-block', width: 6, height: 14, background: '#6C53B1', animation: 'blink 1s step-end infinite', marginLeft: 2 }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}

            {/* Global error banner */}
            {errorMsg && !messages.some((m) => m.status === 'error') && (
              <div style={{
                position: 'sticky', bottom: 0, padding: '8px 12px', marginTop: 8,
                background: '#fff2f0', borderRadius: 6, border: '1px solid #ffccc7',
              }}>
                <Space>
                  <Tag color="red">Error</Tag>
                  <Text type="danger" style={{ fontSize: 12 }}>{errorMsg}</Text>
                  <Button size="small" icon={<ReloadOutlined />} onClick={handleRetry}>
                    {t('ai_chat.retry')}
                  </Button>
                </Space>
              </div>
            )}
          </div>

          {/* Input area */}
          <div style={{
            padding: '10px 16px', borderTop: '1px solid var(--fc-border-color, #f0f0f0)',
            flexShrink: 0, background: '#fff',
          }}>
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                ref={inputRef as React.Ref<any>}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isSending ? t('ai_chat.sending') : t('ai_chat.input_placeholder')}
                rows={2}
                disabled={isSending}
                style={{ resize: 'none' }}
              />
              <Button
                type={isSending ? 'default' : 'primary'}
                icon={isSending ? <StopOutlined /> : <SendOutlined />}
                onClick={handleSendOrInterrupt}
                loading={isSending && !abortRef.current}
                disabled={!isSending && (!input.trim() || !isConfigured)}
                style={{ height: 'auto', width: 80, ...(isSending ? { color: '#ff4d4f', borderColor: '#ff4d4f' } : {}) }}
              >
                {isSending ? t('ai_chat.interrupt') : t('ai_chat.send')}
              </Button>
            </Space.Compact>
            {isSending && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>{t('ai_chat.interrupt_hint')}</Text>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
