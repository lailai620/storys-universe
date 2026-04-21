/**
 * 🗄️ storageService.js — IndexedDB 本地儲存抽象層
 * 使用 localforage 取代 localStorage，解決 5MB 容量上限問題。
 * 首次載入時自動將舊 localStorage 資料遷移至 IndexedDB。
 */
import localforage from 'localforage';

// 初始化 localforage 實例
const store = localforage.createInstance({
  name: 'weaving_light_db',
  storeName: 'app_data',
  description: '織光 APP 本地資料庫',
});

// 需要遷移的 localStorage key 清單
const MIGRATION_KEYS = [
  'weaving_stories',
  'weaving_voice_messages',
  'weaving_onboarding_done',
  'weaving_user',
  'weaving_settings',
  'weaving_book_selected_ids',
  'weaving_ai_sessions',
  'weaving_ai_free_trial_count',
];

let migrated = false;

/**
 * 🔄 從 localStorage 遷移資料到 IndexedDB（只執行一次）
 */
const migrateFromLocalStorage = async () => {
  if (migrated) return;

  const alreadyMigrated = await store.getItem('__migration_done__');
  if (alreadyMigrated) {
    migrated = true;
    return;
  }

  console.log('🔄 開始從 localStorage 遷移資料至 IndexedDB...');

  for (const key of MIGRATION_KEYS) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        await store.setItem(key, value);
        console.log(`  ✅ 遷移成功: ${key}`);
      }
    } catch (e) {
      console.warn(`  ⚠️ 遷移失敗: ${key}`, e);
    }
  }

  await store.setItem('__migration_done__', true);
  migrated = true;
  console.log('✅ localStorage → IndexedDB 遷移完成');
};

/**
 * 📖 讀取資料（自動遷移 + JSON 解析）
 * @param {string} key
 * @param {*} defaultValue - 找不到時的預設值
 * @returns {Promise<*>}
 */
export const getItem = async (key, defaultValue = null) => {
  await migrateFromLocalStorage();
  try {
    const raw = await store.getItem(key);
    if (raw === null) return defaultValue;
    // 嘗試 JSON 解析（相容舊的 localStorage 字串格式）
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch (e) {
    console.warn(`storageService.getItem("${key}") 失敗:`, e);
    // 最終備援：嘗試從 localStorage 讀取
    try {
      const fallback = localStorage.getItem(key);
      if (fallback !== null) {
        try { return JSON.parse(fallback); } catch { return fallback; }
      }
    } catch { /* ignore */ }
    return defaultValue;
  }
};

/**
 * 💾 儲存資料（自動 JSON 序列化）
 * @param {string} key
 * @param {*} value
 * @returns {Promise<void>}
 */
export const setItem = async (key, value) => {
  await migrateFromLocalStorage();
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await store.setItem(key, serialized);
  } catch (e) {
    console.error(`storageService.setItem("${key}") 失敗:`, e);
    // 備援寫入 localStorage
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch { /* 已經用盡所有手段 */ }
  }
};

/**
 * 🗑️ 刪除資料
 * @param {string} key
 * @returns {Promise<void>}
 */
export const removeItem = async (key) => {
  await migrateFromLocalStorage();
  try {
    await store.removeItem(key);
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`storageService.removeItem("${key}") 失敗:`, e);
  }
};

/**
 * 🔑 取得所有 key
 * @returns {Promise<string[]>}
 */
export const keys = async () => {
  await migrateFromLocalStorage();
  return store.keys();
};

// ========================================================
// 🔧 相容層：讓部分仍需同步讀取的場景能安全使用
// 注意：這些只應在 Onboarding 等極輕量的場景使用
// ========================================================

/**
 * ⚡ 同步讀取（僅從 localStorage，用於啟動閃屏等不能等 async 的場景）
 */
export const getItemSync = (key, defaultValue = null) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    try { return JSON.parse(raw); } catch { return raw; }
  } catch {
    return defaultValue;
  }
};

/**
 * ⚡ 同步寫入（同時寫入 localStorage 與排隊寫入 IndexedDB）
 */
export const setItemSync = (key, value) => {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  try {
    localStorage.setItem(key, serialized);
  } catch { /* ignore */ }
  // 非同步寫入 IndexedDB（fire and forget）
  store.setItem(key, serialized).catch(() => {});
};

export default {
  getItem,
  setItem,
  removeItem,
  keys,
  getItemSync,
  setItemSync,
};
