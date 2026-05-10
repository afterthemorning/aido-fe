import React, { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Tree, Button, Modal, message, Space } from 'antd';

import { getOperationsByRole, putOperationsByRole } from './services';
import { OperationType } from './types';
import { notifyPermsChanged } from '@/utils/usePermissionsRefresh';

/**
 * 将 OperationType[] 转为 antd Tree data（2 级树）：
 *   Level 1: 父组（如 "基础设施"）—— 可勾选，级联子节点
 *   Level 2: 路由（如 "/targets"）—— 可勾选
 */
function buildTreeData(operations: OperationType[]) {
  return _.map(operations, (item) => {
    return {
      title: item.cname,
      key: item.name,
      children: _.map(item.ops, (op) => {
        return {
          title: op.cname,
          key: op.name,
        };
      }) as { title: string; key: string }[],
    };
  });
}

/** 递归收集 treeData 中所有叶子节点的 key（路由级别） */
function collectLeafKeys(items: any[]): string[] {
  const keys: string[] = [];
  items.forEach((item: any) => {
    if (item.children && item.children.length > 0) {
      keys.push(...collectLeafKeys(item.children));
    } else {
      keys.push(item.key);
    }
  });
  return keys;
}

interface IProps {
  data: OperationType[];
  roleId?: number;
  disabled: boolean;
}

export default function Operations(props: IProps) {
  const { t } = useTranslation('permissions');
  const { data, roleId, disabled } = props;
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const treeData = useMemo(() => buildTreeData(data), [data]);

  /** 所有叶子 key（路由级别） */
  const leafKeys = useMemo(() => collectLeafKeys(treeData), [treeData]);

  /** 过滤 checkedKeys 中无效的 key */
  const filteredCheckedKeys = useMemo(() => {
    return _.intersection(checkedKeys, leafKeys);
  }, [checkedKeys, leafKeys]);

  /** 最终 checkedKeys：
   *  - Admin (disabled) → 所有 leafKeys（全选，只读展示）
   *  - 其他角色 → filteredCheckedKeys（后端加载的实际已选项） */
  const resolvedCheckedKeys = useMemo(() => {
    if (disabled) return leafKeys;
    return filteredCheckedKeys;
  }, [disabled, leafKeys, filteredCheckedKeys]);

  useEffect(() => {
    if (roleId && !disabled) {
      getOperationsByRole(roleId).then((res) => {
        setCheckedKeys(res || []);
      });
    }
  }, [roleId, disabled]);

  if (!roleId) return <div>{t('unselect_role')}</div>;

  return (
    <div
      className='p-2 min-h-0 h-full overflow-y-auto'
      style={{
        background: 'var(--fc-fill-2)',
        border: '1px solid var(--fc-border-color)',
      }}
    >
      <div className='mb-2'>
        <Space size={0}>
          <Button
            size='small'
            type='text'
            onClick={() => {
              setExpandedKeys(leafKeys);
            }}
          >
            {t('expand_all')}
          </Button>
          <Button
            size='small'
            type='text'
            onClick={() => {
              setExpandedKeys([]);
            }}
          >
            {t('collapse_all')}
          </Button>
        </Space>
      </div>
      <Tree
        checkable
        disabled={disabled}
        expandedKeys={expandedKeys}
        checkedKeys={resolvedCheckedKeys}
        treeData={treeData}
        onExpand={(keys: string[]) => {
          setExpandedKeys(keys);
        }}
        onCheck={(selectedKeys: string[]) => {
          // antd Tree 级联勾选时会带入父组 key（如 "infrastructure"），
          // 只保留以 '/' 开头的路由级别 key，去除父组的概念性 key。
          const routeOnly = _.filter(selectedKeys, (key) => key.startsWith('/'));
          setCheckedKeys(routeOnly);
        }}
      />
      {!disabled && (
        <div style={{ marginTop: 16 }}>
          <Button
            type='primary'
            onClick={() => {
              Modal.confirm({
                title: t('common:confirm.save'),
                onOk: () => {
                  // 参照 regular-report 模块的权限模式：
                  // 只保存路由级别的纯路径 key（如 "/targets"），
                  // 与后端 /api/n9e/role/{id}/ops 接口以及页面级
                  // _.includes(perms, '/targets') 校验完全对齐。
                  putOperationsByRole(roleId, checkedKeys).then(() => {
                    message.success(t('common:success.save'));
                    notifyPermsChanged();
                  });
                },
              });
            }}
          >
            {t('common:btn.save')}
          </Button>
        </div>
      )}
    </div>
  );
}
