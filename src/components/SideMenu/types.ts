import { ReactNode } from 'react';

export interface IMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  useSavedPath?: boolean;
  role?: string[];
  children?: any[];
  type?: string;
  pathType?: string;
  target?: string;
  beta?: boolean;
  deprecated?: boolean;
}

export interface MenuItem extends IMenuItem {
  icon?: ReactNode;
  children: IMenuItem[];
}

export interface MenuMatchResult {
  currentItem: IMenuItem;
  parentItem?: IMenuItem;
  showTabs: boolean;
  icon?: ReactNode;
}

export interface DefaultLogos {
  light_menu_big_logo_url: string;
  light_menu_small_logo_url: string;
  menu_big_logo_url: string;
  menu_small_logo_url: string;
}
