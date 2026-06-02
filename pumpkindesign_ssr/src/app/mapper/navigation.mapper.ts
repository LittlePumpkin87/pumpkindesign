import { NavigationItem } from '../interfaces/atom.interface';

export function mapNavigationItem(rawData: any): NavigationItem {

  return {
    label: rawData.title,
    href: rawData.path,
    showInMenu: rawData.menuAttached,
  };
};