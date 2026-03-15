import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { App as AntdApp, Button, Card, ConfigProvider, Empty, Flex, Result, Space, Typography, theme } from 'antd';
import { useState } from 'react';
const { Title, Paragraph, Text } = Typography;
export default function App() {
    const [isDark, setIsDark] = useState(false);
    return (_jsx(ConfigProvider, { theme: {
            algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
                colorPrimary: '#1677ff',
                borderRadius: 12,
            },
        }, children: _jsx(AntdApp, { children: _jsx("div", { style: {
                    minHeight: '100vh',
                    padding: 24,
                    background: isDark
                        ? 'radial-gradient(circle at top right, #1f2a44 0%, #111827 55%, #0b0f19 100%)'
                        : 'radial-gradient(circle at top right, #e6f4ff 0%, #f6fbff 45%, #ffffff 100%)',
                }, children: _jsxs(Space, { direction: 'vertical', size: 16, style: { width: '100%', maxWidth: 980, margin: '0 auto' }, children: [_jsxs(Flex, { justify: 'space-between', align: 'center', children: [_jsx(Title, { level: 3, style: { margin: 0 }, children: "Ant Design 6 Illustration Style Lab" }), _jsx(Button, { onClick: () => setIsDark((v) => !v), children: isDark ? 'Switch to Light' : 'Switch to Dark' })] }), _jsx(Paragraph, { children: _jsx(Text, { type: 'secondary', children: "This lab verifies React 18 + antd 6 baseline and shows Ant Design illustration-style empty/result experiences." }) }), _jsxs(Flex, { gap: 16, wrap: 'wrap', children: [_jsx(Card, { title: 'Empty Illustration (Default)', style: { flex: '1 1 420px' }, children: _jsx(Empty, { image: Empty.PRESENTED_IMAGE_DEFAULT, description: 'No data yet. Connect datasource to start.', children: _jsx(Button, { type: 'primary', children: "Create Source" }) }) }), _jsx(Card, { title: 'Empty Illustration (Simple)', style: { flex: '1 1 420px' }, children: _jsx(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: 'No alerts configured for this scope.', children: _jsx(Button, { children: "Open Alert Wizard" }) }) })] }), _jsx(Card, { title: 'Result Illustration', children: _jsx(Result, { status: 'success', title: 'Configuration Draft Saved', subTitle: 'You can now publish this rule to the environment.', extra: [
                                    _jsx(Button, { type: 'primary', children: "Publish" }, 'publish'),
                                    _jsx(Button, { children: "Continue Editing" }, 'edit'),
                                ] }) })] }) }) }) }));
}
