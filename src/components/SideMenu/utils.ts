import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { IMenuItem, MenuMatchResult } from '@/components/SideMenu/types';
import { getMenuList } from '@/components/SideMenu/menu';
import { IS_PLUS } from '@/utils/constant';

// @ts-ignore
import getPlusMenuList from 'plus:/parcels/SideMenu/menu';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getCurrentMenuList = (embeddedProductMenu: any[] = [], hideDeprecatedMenus: boolean = false): IMenuItem[] => {
  return IS_PLUS ? getPlusMenuList(embeddedProductMenu, hideDeprecatedMenus) : getMenuList(embeddedProductMenu, hideDeprecatedMenus);
};

export const findMenuByPath = (path: string, menuList: IMenuItem[]): MenuMatchResult | null => {
  for (const parent of menuList) {
    if (!parent.children) continue;
    for (const child of parent.children) {
      if (child.children) {
        for (const grandChild of child.children) {
          if (grandChild.key === path) {
            return { currentItem: grandChild, parentItem: child, showTabs: child.type === 'tabs', icon: parent?.icon };
          }
        }
      }
    }
  }
  return null;
};

export const getStorageKey = (parentKey: string) => `tab_selection_${parentKey}`;

export const getSavedPath = (pathname: string) => {
  const menuList = getCurrentMenuList();
  const currentMenu = findMenuByPath(pathname, menuList);
  if (currentMenu?.currentItem && currentMenu?.parentItem) {
    const storageKey = getStorageKey(currentMenu.parentItem.key);
    return localStorage.getItem(storageKey);
  }
};
