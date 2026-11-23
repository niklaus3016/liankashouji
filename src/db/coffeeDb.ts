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

  const records = await getAllFromStore<CoffeeRecord>(db, STORES.RECORDS);
  const wishes = await getAllFromStore<WishCoffee>(db, STORES.WISHES);

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
  settings = { ...(settings ?? DEFAULT_SETTINGS) };
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
