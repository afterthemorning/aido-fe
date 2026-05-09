import _ from 'lodash';
import i18next from 'i18next';
import { getCurrentMenuList } from '@/components/SideMenu/utils';
import { OperationType } from './types';

/**
 * 递归收集 SideMenu 树中所有叶子节点的路由路径。
 * 只提取以 '/' 开头的 route key，并按其父级分组。
 */
export function extractOperationsFromMenus(): OperationType[] {
  const menus = getCurrentMenuList();
  const groups: Record<string, OperationType> = {};
  // 用 Set 跟踪已经添加过的 child key，防止同一个 route 被多个父级重复添加
  const seenChildKeys = new Set<string>();

  const walk = (items: any[], parentKey?: string) => {
    items.forEach((item) => {
      const key = item.key || '';
      const label = item.label || '';
      const isRoute = key.startsWith('/');
      const hasChildren = item.children && item.children.length > 0;

      if (!parentKey) {
        if (hasChildren) {
          groups[key] = groups[key] || { name: key, cname: resolveLabel(label), ops: [] };
          walk(item.children, key);
        } else if (isRoute) {
          groups[key] = groups[key] || { name: key, cname: resolveLabel(label), ops: [] };
        }
      } else {
        if (hasChildren && item.type === 'tabs') {
          walk(item.children, parentKey);
        } else if (isRoute) {
          if (seenChildKeys.has(key)) return; // 跳过已添加的 route
          seenChildKeys.add(key);
          const parent = groups[parentKey];
          if (parent) {
            parent.ops.push({ name: key, cname: resolveLabel(label) });
          } else {
            groups[parentKey] = { name: parentKey, cname: resolveLabel(label), ops: [{ name: key, cname: resolveLabel(label) }] };
          }
        }
      }
    });
  };

  walk(menus);
  return Object.values(groups);
}

/**
 * 尝试解析 i18n key 为可读文字，解析失败则直接返回 key。
 */
function resolveLabel(keyOrLabel: string): string {
  if (!keyOrLabel || keyOrLabel.startsWith('/')) return keyOrLabel;
  const translated = i18next.t(keyOrLabel, { ns: 'sideMenu' });
  return translated && translated !== keyOrLabel ? translated : keyOrLabel;
}

/**
 * 合并后端返回的操作树和前端菜单树，深度去重。
 * 确保最终列表无重复操作项。
 */
export function mergeOperations(backendOps: OperationType[]): OperationType[] {
  // 1. 后端操作树先去重（同名 parent 仅保留第一个）
  const backendDeduped: OperationType[] = _.uniqBy(backendOps || [], 'name');
  backendDeduped.forEach((group) => {
    group.ops = _.uniqBy(group.ops || [], 'name');
  });

  // 2. 从菜单树提取
  const menuOps = extractOperationsFromMenus();

  // 3. 以后端为基础，用菜单树补充缺失项
  const merged: OperationType[] = [...backendDeduped];
  const mergedNames = new Set(merged.map((o) => o.name));

  menuOps.forEach((menuOp) => {
    const existing = merged.find((o) => o.name === menuOp.name);
    if (existing) {
      const existingChildNames = new Set((existing.ops || []).map((o) => o.name));
      menuOp.ops.forEach((op) => {
        if (!existingChildNames.has(op.name)) {
          existing.ops.push(op);
        }
      });
    } else {
      merged.push(menuOp);
      mergedNames.add(menuOp.name);
    }
  });

  return merged;
}
