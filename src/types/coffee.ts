export const APP_PACKAGE_NAME = 'com.lksj.app';

export type DrinkType = 'HOT' | 'ICE' | 'NORMAL';
export type SourceType = 'SHOP' | 'TAKEOUT' | 'HOMEMADE' | 'INSTANT';
export type RepurchaseStatus = 'YES' | 'MAYBE' | 'NO';

export interface CoffeeRecord {
  id: number;
  coffeeName: string;
  brandShop: string;
  price: number | null;
  drinkTime: number;
  drinkType: DrinkType;
  categoryId: number;
  sourceType: SourceType;
  starScore: number | null;
  repurchaseStatus: RepurchaseStatus;
  remark: string;
  imgUriList: string[];
  tagIds: number[];
  createTs: number;
  updateTs: number;
}

export interface CoffeeBrand {
  id: number;
  name: string;
  isDefault: boolean;
}

export interface CoffeeCategory {
  id: number;
  name: string;
  isDefault: boolean;
}

export interface FlavorTag {
  id: number;
  name: string;
  isDefault: boolean;
}

export interface WishCoffee {
  id: number;
  coffeeName: string;
  brandShop: string;
  expectPrice: number | null;
  remark: string;
  isChecked: boolean;
  bindRecordId: number | null;
  createTs: number;
}

export type ThemeMode = 'system' | 'light' | 'dark';
export type DefaultHomeView = 'today' | 'calendar';

export interface AppSettings {
  id: 'singleton';
  themeMode: ThemeMode;
  defaultHomeView: DefaultHomeView;
  showHomeStats: boolean;
  hasInitializedSeed: boolean;
}

export const DRINK_TYPE_LABELS: Record<DrinkType, string> = {
  HOT: '热饮',
  ICE: '冰饮',
  NORMAL: '常温',
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  SHOP: '门店购买',
  TAKEOUT: '外卖',
  HOMEMADE: '自制',
  INSTANT: '速溶胶囊',
};

export const REPURCHASE_LABELS: Record<RepurchaseStatus, string> = {
  YES: '会回购',
  MAYBE: '待定',
  NO: '不回购',
};
