/*
 * Copyright 2026 AIDO Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { i18nInit } from './i18n'; // loaded and initialized first
import './theme/tailwind.css';
import App from './App';
import { I18nextProvider } from 'react-i18next';
import { initTheme } from './utils/darkMode';

// 在页面渲染前初始化主题，避免样式闪烁
initTheme();

// 配置 Monaco Editor 的 Web Worker，避免 UI 卡顿
if (!('MonacoEnvironment' in globalThis)) {
  (globalThis as any).MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
      const getWorkerModule = (moduleUrl: string, workerLabel: string) => {
        switch (workerLabel) {
          case 'json':
            return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url), { type: 'module' });
          case 'css':
          case 'scss':
          case 'less':
            return new Worker(new URL('monaco-editor/esm/vs/language/css/css.worker.js', import.meta.url), { type: 'module' });
          case 'html':
          case 'handlebars':
          case 'razor':
            return new Worker(new URL('monaco-editor/esm/vs/language/html/html.worker.js', import.meta.url), { type: 'module' });
          case 'typescript':
          case 'javascript':
            return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url), { type: 'module' });
          default:
            return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' });
        }
      };
      return getWorkerModule('', label);
    },
  };
}

createRoot(document.getElementById('root')!).render(
  <I18nextProvider i18n={i18nInit}>
    <App />
  </I18nextProvider>,
);
