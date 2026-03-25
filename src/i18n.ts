/*
 * Copyright 2022 Nightingale Team
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
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import _ from 'lodash';
import { withTolgee, Tolgee, I18nextPlugin, DevTools } from '@tolgee/i18next';
import { InContextTools } from '@tolgee/web/tools';

const toObjectRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
};

const languages = ['zh_CN', 'en_US', 'zh_HK', 'ru_RU', 'ja_JP'];
const localStorageLanguage = localStorage.getItem('language');
let language = 'zh_CN';
if (localStorageLanguage && _.includes(languages, localStorageLanguage)) {
  language = localStorageLanguage;
}

function getTranslations() {
  type LocaleNamespaceMap = Record<string, unknown>;
  type LocaleModule = { default?: LocaleNamespaceMap };
  // Use paths relative to this file so Vite can statically include locale modules.
  const translations = import.meta.glob('./**/{locale,locales}/index.{ts,js}', { eager: true }) as Record<string, LocaleModule>;
  const result: Record<string, unknown> = {};

  for (const path in translations) {
    const module = toObjectRecord(translations[path]?.default);
    for (const namespace in module) {
      const namespacePayload = toObjectRecord(module[namespace]);
      for (const lang in namespacePayload) {
        result[`${lang}:${namespace}`] = namespacePayload[lang];
      }
    }
  }
  return result;
}

function getI18nextTranslations() {
  type LocaleNamespaceMap = Record<string, unknown>;
  type LocaleModule = { default?: LocaleNamespaceMap };
  // Keep the same glob as getTranslations() to avoid missing namespaces in production builds.
  const translations = import.meta.glob('./**/{locale,locales}/index.{ts,js}', { eager: true }) as Record<string, LocaleModule>;
  const result: Record<string, Record<string, unknown>> = {};

  languages.forEach((lang) => {
    result[lang] = {};
  });

  for (const path in translations) {
    const module = toObjectRecord(translations[path]?.default);

    for (const namespace in module) {
      const namespacePayload = toObjectRecord(module[namespace]);
      languages.forEach((lang) => {
        if (result[lang][namespace]) {
          result[lang][namespace] = {
            ...toObjectRecord(result[lang][namespace]),
            ...toObjectRecord(namespacePayload[lang]),
          };
        } else {
          result[lang][namespace] = toObjectRecord(namespacePayload[lang]);
        }
      });
    }
  }
  return result;
}

const API_URL = import.meta.env.VITE_TOLGEE_API_URL;
const API_KEY = import.meta.env.VITE_TOLGEE_API_KEY;
const staticData = getTranslations();
const i18nextResources = getI18nextTranslations();
const namespaces = Array.from(new Set(Object.keys(staticData).map((key) => key.split(':')[1]).filter(Boolean)));

const flattenTranslations = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenTranslations(value as Record<string, unknown>, nextKey));
    } else {
      result[nextKey] = value;
    }
  }
  return result;
};

const applyLocalFallbackBundles = () => {
  for (const lang of Object.keys(i18nextResources)) {
    const namespaceMap = i18nextResources[lang];
    for (const ns of Object.keys(namespaceMap)) {
      const nsResources = toObjectRecord(namespaceMap[ns]);
      i18n.addResourceBundle(lang, ns, nsResources, true, false);
      i18n.addResourceBundle(lang, ns, flattenTranslations(nsResources), true, false);
    }
  }
};

let tolgee, i18nInit;
if (API_URL && API_KEY) {
  if (import.meta.env.DEV) {
    tolgee = Tolgee()
      .use(DevTools())
      .use(I18nextPlugin())
      .init({
        apiUrl: API_URL,
        apiKey: API_KEY,
        language,
        staticData: staticData as never,
        defaultNs: 'translation',
        ns: namespaces,
      });
  } else {
    tolgee = Tolgee()
      .use(InContextTools())
      .use(I18nextPlugin())
      .init({
        apiUrl: API_URL,
        apiKey: API_KEY,
        language,
        staticData: staticData as never,
        defaultNs: 'translation',
        ns: namespaces,
      });
  }

  i18nInit = withTolgee(i18n, tolgee).use(initReactI18next);
  i18nInit.init({
    lng: language,
    defaultNS: 'translation',
    ns: namespaces,
    resources: i18nextResources,
    keySeparator: '.',
    nsSeparator: ':',
    returnNull: false,
    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });
  applyLocalFallbackBundles();
} else {
  i18nInit = i18n.use(initReactI18next);
  i18nInit.init({
    lng: language,
    resources: i18nextResources,
    keySeparator: '.',
    nsSeparator: ':',
    returnNull: false,
    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });
  applyLocalFallbackBundles();
}

export { i18nInit, tolgee };
