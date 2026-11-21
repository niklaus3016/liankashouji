import {
  AppSettings,
  CoffeeBrand,
  CoffeeCategory,
  CoffeeRecord,
  FlavorTag,
  WishCoffee,
} from '../types/coffee';

const DB_NAME = 'lianka_coffee_journal_db';
const DB_VERSION = 2;

const STORES = {
  RECORDS: 'coffee_records',
  BRANDS: 'coffee_brands',
  CATEGORIES: 'coffee_categories',
  TAGS: 'flavor_tags',
  WISHES: 'wish_coffees',
  SETTINGS: 'app_settings',
} as const;

export const DEFAULT_BRANDS: Array<{ name: string; isDefault: boolean }> = [
  { name: '瑞幸咖啡', isDefault: true },
  { name: '星巴克', isDefault: true },
  { name: 'Manner Coffee', isDefault: true },
  { name: 'M Stand', isDefault: true },
  { name: '库迪咖啡', isDefault: true },
  { name: 'Grid Coffee', isDefault: true },
  { name: 'Seesaw', isDefault: true },
  { name: 'Peet’s Coffee', isDefault: true },
  { name: '自家吧台', isDefault: true },
];

export const DEFAULT_CATEGORIES: Array<{ name: string; isDefault: boolean }> = [
  { name: '美式', isDefault: true },
  { name: '拿铁', isDefault: true },
  { name: '澳白', isDefault: true },
  { name: '卡布奇诺', isDefault: true },
  { name: '手冲', isDefault: true },
  { name: '冷萃', isDefault: true },
  { name: '意式浓缩', isDefault: true },
  { name: '摩卡', isDefault: true },
  { name: 'dirty', isDefault: true },
  { name: '气泡咖啡', isDefault: true },
];

export const DEFAULT_TAGS: Array<{ name: string; isDefault: boolean }> = [
  { name: '酸', isDefault: true },
  { name: '苦', isDefault: true },
  { name: '醇厚', isDefault: true },
  { name: '果香', isDefault: true },
  { name: '坚果香', isDefault: true },
  { name: '焦糖', isDefault: true },
  { name: '花香', isDefault: true },
  { name: '低因', isDefault: true },
  { name: '奶味重', isDefault: true },
];

const DEFAULT_SETTINGS: AppSettings = {
  id: 'singleton',
  themeMode: 'system',
  defaultHomeView: 'today',
  showHomeStats: true,
  hasInitializedSeed: false,
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.RECORDS)) {
        db.createObjectStore(STORES.RECORDS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.BRANDS)) {
        db.createObjectStore(STORES.BRANDS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.TAGS)) {
        db.createObjectStore(STORES.TAGS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.WISHES)) {
        db.createObjectStore(STORES.WISHES, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
  });
  return dbPromise;
}

function getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as T[]);
  });
}

function getOneFromStore<T>(db: IDBDatabase, storeName: string, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as T | undefined);
  });
}

function putToStore<T>(db: IDBDatabase, storeName: string, item: T): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as number);
  });
}

function addToStore<T>(db: IDBDatabase, storeName: string, item: Omit<T, 'id'>): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.add(item);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as number);
  });
}

function deleteFromStore(db: IDBDatabase, storeName: string, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

function clearStore(db: IDBDatabase, storeName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

export interface InitialAppData {
  records: CoffeeRecord[];
  brands: CoffeeBrand[];
  categories: CoffeeCategory[];
  tags: FlavorTag[];
  wishes: WishCoffee[];
  settings: AppSettings;
}

export async function initializeAndLoadAll(): Promise<InitialAppData> {
  const db = await openDb();
  let settings = await getOneFromStore<AppSettings>(db, STORES.SETTINGS, 'singleton');
  if (!settings) {
    settings = { ...DEFAULT_SETTINGS };
    await putToStore(db, STORES.SETTINGS, settings);
  }

  let brands = await getAllFromStore<CoffeeBrand>(db, STORES.BRANDS);
  if (brands.length === 0) {
    for (const b of DEFAULT_BRANDS) {
      await addToStore<CoffeeBrand>(db, STORES.BRANDS, b);
    }
    brands = await getAllFromStore<CoffeeBrand>(db, STORES.BRANDS);
  }

  let categories = await getAllFromStore<CoffeeCategory>(db, STORES.CATEGORIES);
  if (categories.length === 0) {
    for (const c of DEFAULT_CATEGORIES) {
      await addToStore<CoffeeCategory>(db, STORES.CATEGORIES, c);
    }
    categories = await getAllFromStore<CoffeeCategory>(db, STORES.CATEGORIES);
  }

  let tags = await getAllFromStore<FlavorTag>(db, STORES.TAGS);
  if (tags.length === 0) {
    for (const t of DEFAULT_TAGS) {
      await addToStore<FlavorTag>(db, STORES.TAGS, t);
    }
    tags = await getAllFromStore<FlavorTag>(db, STORES.TAGS);
  }

  let records = await getAllFromStore<CoffeeRecord>(db, STORES.RECORDS);
  let wishes = await getAllFromStore<WishCoffee>(db, STORES.WISHES);

  if (!settings.hasInitializedSeed && records.length === 0 && wishes.length === 0) {
    const catByName = new Map(categories.map((c) => [c.name, c.id]));
    const tagByName = new Map(tags.map((t) => [t.name, t.id]));

    const now = new Date();
    const todayMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 15).getTime();
    const todayAfternoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 40).getTime();
    const twoDaysAgo = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 2), 10, 30).getTime();
    const fiveDaysAgo = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 5), 15, 20).getTime();
    const eightDaysAgo = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 8), 8, 50).getTime();

    const seedRecords: Array<Omit<CoffeeRecord, 'id'>> = [
      {
        coffeeName: '海盐焦糖拿铁',
        brandShop: 'M Stand',
        price: 32,
        drinkTime: todayAfternoon,
        drinkType: 'HOT',
        categoryId: catByName.get('拿铁') ?? categories[0].id,
        sourceType: 'SHOP',
        starScore: 5,
        repurchaseStatus: 'YES',
        remark: '奶泡细腻，微咸焦糖尾韵很温柔，午后提神刚好。',
        imgUriList: ['/src/assets/images/coffee_latte_art_1794969418183.jpg'],
        tagIds: [tagByName.get('醇厚'), tagByName.get('焦糖'), tagByName.get('奶味重')].filter(
          (x): x is number => typeof x === 'number'
        ),
        createTs: todayAfternoon,
        updateTs: todayAfternoon,
      },
      {
        coffeeName: '冰萃耶加雪菲美式',
        brandShop: 'Manner Coffee',
        price: 15,
        drinkTime: todayMorning,
        drinkType: 'ICE',
        categoryId: catByName.get('美式') ?? categories[0].id,
        sourceType: 'SHOP',
        starScore: 4,
        repurchaseStatus: 'YES',
        remark: '自带杯减5元，柑橘和茉莉花香很清爽，冰饮不酸涩。',
        imgUriList: ['/src/assets/images/coffee_iced_americano_1794969418177.jpg'],
        tagIds: [tagByName.get('果香'), tagByName.get('花香')].filter(
          (x): x is number => typeof x === 'number'
        ),
        createTs: todayMorning,
        updateTs: todayMorning,
      },
      {
        coffeeName: '手冲水洗耶加雪菲 V60',
        brandShop: '自家吧台',
        price: 8.5,
        drinkTime: twoDaysAgo,
        drinkType: 'HOT',
        categoryId: catByName.get('手冲') ?? categories[0].id,
        sourceType: 'HOMEMADE',
        starScore: 5,
        repurchaseStatus: 'YES',
        remark: '92℃分段注水，1:15粉水比，温度降下来后蜜桃酸甜非常明亮。',
        imgUriList: ['/src/assets/images/coffee_pourover_drip_1794969418222.jpg'],
        tagIds: [tagByName.get('酸'), tagByName.get('花香'), tagByName.get('果香')].filter(
          (x): x is number => typeof x === 'number'
        ),
        createTs: twoDaysAgo,
        updateTs: twoDaysAgo,
      },
      {
        coffeeName: '燕麦澳白',
        brandShop: 'Grid Coffee',
        price: 28,
        drinkTime: fiveDaysAgo,
        drinkType: 'HOT',
        categoryId: catByName.get('澳白') ?? categories[0].id,
        sourceType: 'TAKEOUT',
        starScore: 4,
        repurchaseStatus: 'MAYBE',
        remark: '外卖送到略凉了些，但黑巧和烤榛果风味还是很扎实。',
        imgUriList: [],
        tagIds: [tagByName.get('坚果香'), tagByName.get('醇厚')].filter(
          (x): x is number => typeof x === 'number'
        ),
        createTs: fiveDaysAgo,
        updateTs: fiveDaysAgo,
      },
      {
        coffeeName: '生椰冷萃',
        brandShop: 'Seesaw',
        price: 29,
        drinkTime: eightDaysAgo,
        drinkType: 'ICE',
        categoryId: catByName.get('冷萃') ?? categories[0].id,
        sourceType: 'SHOP',
        starScore: 4,
        repurchaseStatus: 'YES',
        remark: '椰子水清甜不腻，冷萃液顺滑。',
        imgUriList: [],
        tagIds: [tagByName.get('果香')].filter((x): x is number => typeof x === 'number'),
        createTs: eightDaysAgo,
        updateTs: eightDaysAgo,
      },
    ];

    const insertedRecordIds: number[] = [];
    for (const r of seedRecords) {
      const id = await addToStore<CoffeeRecord>(db, STORES.RECORDS, r);
      insertedRecordIds.push(id);
    }

    const seedWishes: Array<Omit<WishCoffee, 'id'>> = [
      {
        coffeeName: '瑰夏手冲（巴拿马翡翠庄园）',
        brandShop: 'Peet’s Coffee',
        expectPrice: 58,
        remark: '想试试水洗绿标瑰夏的佛手柑与白花香气。',
        isChecked: false,
        bindRecordId: null,
        createTs: now.getTime() - 86400000 * 3,
      },
      {
        coffeeName: '冰博克 Dirty',
        brandShop: 'Ops Cafe',
        expectPrice: 36,
        remark: '周末路过一定要大口喝第一口油脂与冰奶的交融感。',
        isChecked: false,
        bindRecordId: null,
        createTs: now.getTime() - 86400000 * 1,
      },
      {
        coffeeName: '海盐焦糖拿铁',
        brandShop: 'M Stand',
        expectPrice: 32,
        remark: '同事推荐的秋冬热饮。',
        isChecked: true,
        bindRecordId: insertedRecordIds[0] ?? null,
        createTs: now.getTime() - 86400000 * 6,
      },
    ];

    for (const w of seedWishes) {
      await addToStore<WishCoffee>(db, STORES.WISHES, w);
    }

    settings = { ...settings, hasInitializedSeed: true };
    await putToStore(db, STORES.SETTINGS, settings);

    records = await getAllFromStore<CoffeeRecord>(db, STORES.RECORDS);
    wishes = await getAllFromStore<WishCoffee>(db, STORES.WISHES);
  }

  return {
    records: records.sort((a, b) => b.drinkTime - a.drinkTime),
    brands,
    categories,
    tags,
    wishes: wishes.sort((a, b) => b.createTs - a.createTs),
    settings,
  };
}

export async function saveRecordDb(record: Omit<CoffeeRecord, 'id'> | CoffeeRecord): Promise<CoffeeRecord> {
  const db = await openDb();
  if ('id' in record && record.id) {
    await putToStore(db, STORES.RECORDS, record);
    return record;
  }
  const id = await addToStore<CoffeeRecord>(db, STORES.RECORDS, record);
  return { ...(record as Omit<CoffeeRecord, 'id'>), id };
}

export async function deleteRecordDb(id: number): Promise<void> {
  const db = await openDb();
  await deleteFromStore(db, STORES.RECORDS, id);
}

export async function addBrandDb(name: string): Promise<CoffeeBrand> {
  const db = await openDb();
  const payload = { name: name.trim(), isDefault: false };
  const id = await addToStore<CoffeeBrand>(db, STORES.BRANDS, payload);
  return { ...payload, id };
}

export async function deleteBrandDb(id: number): Promise<void> {
  const db = await openDb();
  await deleteFromStore(db, STORES.BRANDS, id);
}

export async function addCategoryDb(name: string): Promise<CoffeeCategory> {
  const db = await openDb();
  const payload = { name: name.trim(), isDefault: false };
  const id = await addToStore<CoffeeCategory>(db, STORES.CATEGORIES, payload);
  return { ...payload, id };
}

export async function deleteCategoryDb(id: number): Promise<void> {
  const db = await openDb();
  await deleteFromStore(db, STORES.CATEGORIES, id);
}

export async function addTagDb(name: string): Promise<FlavorTag> {
  const db = await openDb();
  const payload = { name: name.trim(), isDefault: false };
  const id = await addToStore<FlavorTag>(db, STORES.TAGS, payload);
  return { ...payload, id };
}

export async function deleteTagDb(id: number): Promise<void> {
  const db = await openDb();
  await deleteFromStore(db, STORES.TAGS, id);
}

export async function saveWishDb(wish: Omit<WishCoffee, 'id'> | WishCoffee): Promise<WishCoffee> {
  const db = await openDb();
  if ('id' in wish && wish.id) {
    await putToStore(db, STORES.WISHES, wish);
    return wish;
  }
  const id = await addToStore<WishCoffee>(db, STORES.WISHES, wish);
  return { ...(wish as Omit<WishCoffee, 'id'>), id };
}

export async function deleteWishDb(id: number): Promise<void> {
  const db = await openDb();
  await deleteFromStore(db, STORES.WISHES, id);
}

export async function saveSettingsDb(settings: AppSettings): Promise<void> {
  const db = await openDb();
  await putToStore(db, STORES.SETTINGS, settings);
}

export async function clearAllCoffeeDataDb(): Promise<InitialAppData> {
  const db = await openDb();
  await clearStore(db, STORES.RECORDS);
  await clearStore(db, STORES.WISHES);
  await clearStore(db, STORES.BRANDS);
  await clearStore(db, STORES.CATEGORIES);
  await clearStore(db, STORES.TAGS);

  for (const b of DEFAULT_BRANDS) {
    await addToStore<CoffeeBrand>(db, STORES.BRANDS, b);
  }
  for (const c of DEFAULT_CATEGORIES) {
    await addToStore<CoffeeCategory>(db, STORES.CATEGORIES, c);
  }
  for (const t of DEFAULT_TAGS) {
    await addToStore<FlavorTag>(db, STORES.TAGS, t);
  }

  let settings = await getOneFromStore<AppSettings>(db, STORES.SETTINGS, 'singleton');
  settings = {
    ...(settings ?? DEFAULT_SETTINGS),
    hasInitializedSeed: true,
  };
  await putToStore(db, STORES.SETTINGS, settings);

  const brands = await getAllFromStore<CoffeeBrand>(db, STORES.BRANDS);
  const categories = await getAllFromStore<CoffeeCategory>(db, STORES.CATEGORIES);
  const tags = await getAllFromStore<FlavorTag>(db, STORES.TAGS);
  return {
    records: [],
    brands,
    categories,
    tags,
    wishes: [],
    settings,
  };
}
