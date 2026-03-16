import React, { useCallback } from 'react';
import { Select, Tag, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

import KVTags from './KVTags';
import './locale';

export { KVTags };

// 校验单个标签格式是否正确
function isTagValid(tag) {
  const contentRegExp = /^[a-zA-Z_][\w]*={1}[^=]+$/;
  const normalizedTag = tag === undefined || tag === null ? '' : String(tag).trim();
  return {
    isCorrectFormat: normalizedTag.length > 0 && contentRegExp.test(normalizedTag),
  };
}

// 校验所有标签格式
export function validatorOfKVTagSelect() {
  return {
    validator(_, value) {
      const isInvalid =
        value &&
        value.some((tag) => {
          const { isCorrectFormat } = isTagValid(tag);
          if (!isCorrectFormat) {
            return true;
          }
        });
      return isInvalid ? Promise.reject(new Error(i18next.t('KVTagSelect:append_tags_msg'))) : Promise.resolve();
    },
  };
}

export default function KVTagSelect(props) {
  const { t } = useTranslation('KVTagSelect');
  const tagRender = useCallback((content) => {
    const tagValue = content?.value;
    const tagText = tagValue === undefined || tagValue === null ? '' : String(tagValue);
    const { isCorrectFormat } = isTagValid(tagValue);

    return isCorrectFormat ? (
      <Tag className='whitespace-normal break-all' closable={content.closable} onClose={content.onClose}>
        {tagText}
      </Tag>
    ) : (
      <Tooltip title={t('append_tags_msg2')}>
        <Tag className='whitespace-normal break-all' color='error' closable={content.closable} onClose={content.onClose} style={{ marginTop: '2px' }}>
          {tagText}
        </Tag>
      </Tooltip>
    );
  }, [t]);

  return <Select mode='tags' tokenSeparators={[' ']} open={false} placeholder={t('append_tags_placeholder')} tagRender={tagRender} {...props} />;
}
