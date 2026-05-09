import _ from 'lodash';
import { getCurrentMenuList } from '@/components/SideMenu/utils';
import { OperationType } from './types';

/**
 * 从 SideMenu 菜单树中提取所有路由路径作为操作（operation）。
 * 确保新增菜单无需后端同步即可出现在权限树中。
 */
export function extractOperationsFromMenus(): OperationType[] {
  const menus = getCurrentMenuList();
  const groups: Record<string, OperationType> = {};

  const walk = (items: any[], parentLabel?: string) => {
    items.forEach((item) => {
      const label = item.label || '';
      const key = item.key || '';
      const isRoute = key.startsWith('/');
      const hasChildren = item.children && item.children.length > 0;

      if (!parentLabel) {
        // top-level menu group
        if (hasChildren) {
          groups[key] = groups[key] || { name: key, cname: label, ops: [] };
          walk(item.children, key);
        } else if (isRoute) {
          groups[key] = groups[key] || { name: key, cname: label, ops: [] };
        }
      } else {
        // child items
        if (hasChildren && item.type === 'tabs') {
          // tab groups: child routes go directly under parent
          walk(item.children, parentLabel);
        } else if (isRoute) {
          const parent = groups[parentLabel];
          if (parent) {
            if (!parent.ops.find((o) => o.name === key)) {
              parent.ops.push({ name: key, cname: label });
            }
          } else {
            groups[parentLabel] = { name: parentLabel, cname: label, ops: [{ name: key, cname: label }] };
          }
        }
      }
    });
  };

  walk(menus);
  return Object.values(groups);
}

/**
 * 合并后端返回的操作树和前端菜单树，确保所有菜单路径都在权限树中出现。
 */
export function mergeOperations(backendOps: OperationType[]): OperationType[] {
  const menuOps = extractOperationsFromMenus();
  const merged: OperationType[] = [...backendOps];

  menuOps.forEach((menuOp) => {
    const existing = merged.find((o) => o.name === menuOp.name);
    if (existing) {
      menuOp.ops.forEach((op) => {
        if (!existing.ops.find((o) => o.name === op.name)) {
          existing.ops.push(op);
        }
      });
    } else {
      merged.push(menuOp);
    }
  });

  // 保证 Admin 角色的完整权限路径
  return merged;
}
