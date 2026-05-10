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
          if (seenChildKeys.has(key)) return;
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
 * 尝试解析 i18n key 为可读文字。
 */
function resolveLabel(keyOrLabel: string): string {
  if (!keyOrLabel || keyOrLabel.startsWith('/')) return keyOrLabel;
  const translated = i18next.t(keyOrLabel, { ns: 'sideMenu' });
  return translated && translated !== keyOrLabel ? translated : keyOrLabel;
}

/**
 * 合并后端返回的操作树和前端菜单树，深度去重。
 *
 * 策略：
 * 1. 以菜单树（SideMenu）为结构基准。
 * 2. 后端数据仅作补充——只添加菜单树中不存在的父组及其子操作。
 * 3. 跳过「独立路由组」——后端中父组名已是其他父组的子操作时忽略。
 * 4. 全局跨子操作去重——确保每个 route path 唯一归属一个父组。
 * 5. 移除子操作为空的父组——解决后端冗余数据导致「一级菜单重复」的问题。
 */
export function mergeOperations(backendOps: OperationType[]): OperationType[] {
  // ---- 1. 以菜单树为基准 ----
  const menuOps = extractOperationsFromMenus();
  const result: OperationType[] = [...menuOps];

  const resultMap = new Map<string, OperationType>();
  result.forEach((g) => resultMap.set(g.name, g));

  // 收集菜单树中已有的子操作 name
  const existingChildNames = new Set<string>();
  result.forEach((g) => {
    (g.ops || []).forEach((op) => existingChildNames.add(op.name));
  });

  // ---- 2. 补充后端数据 ----
  (backendOps || []).forEach((backendGroup) => {
    const backendChildren = _.uniqBy(backendGroup.ops || [], 'name');

    // 情况 A：独立路由组——跳过
    if (backendGroup.name.startsWith('/') && existingChildNames.has(backendGroup.name)) {
      return;
    }

    // 情况 B：全新父组——完整追加
    if (!resultMap.has(backendGroup.name)) {
      const newGroup: OperationType = {
        name: backendGroup.name,
        cname: backendGroup.cname,
        ops: backendChildren,
      };
      result.push(newGroup);
      resultMap.set(backendGroup.name, newGroup);
      return;
    }

    // 情况 C：同名父组——补充缺失的子操作
    const existing = resultMap.get(backendGroup.name)!;
    const childNameSet = new Set((existing.ops || []).map((o) => o.name));
    backendChildren.forEach((op) => {
      if (!childNameSet.has(op.name)) {
        existing.ops.push(op);
        childNameSet.add(op.name);
      }
    });
  });

  // ---- 3. 全局跨组子操作去重 —— 确保每个 route 只出现在一个父组中 ----
  const seenRouteKeys = new Set<string>();
  result.forEach((group) => {
    group.ops = (group.ops || []).filter((op) => {
      if (seenRouteKeys.has(op.name)) return false;
      seenRouteKeys.add(op.name);
      return true;
    });
  });

  // ---- 4. 移除子操作为空的父组 ----
  //     场景：后端返回了冗余的父组（如不同名的重复组），其子操作已在步骤 3 中被
  //     其他父组「先到先得」抢走，自身变为空节点。此类空节点导致树渲染出「一级菜单重复」。
  //     必须实际移除，而非空置原地。
  // TODO: 步骤 4 的粗暴移除可能导致后端独有的父组信息丢失。理想方案是：
  //       在步骤 2（补充后端数据）时，对后端父组做更深度的语义去重——
  //       不仅比较 name，还比较 children 内容是否有重叠。当两个父组的 children
  //       完全相同或互为子集时，才判定为重复。当前方案留作第一阶段修复。
  const cleaned = result.filter((group) => {
    return (group.ops || []).length > 0;
  });

  // ---- 5. 最终子操作去重（兜底）----
  cleaned.forEach((group) => {
    group.ops = _.uniqBy(group.ops || [], 'name');
  });

  return cleaned;
}
