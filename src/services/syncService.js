/**
 * 🔄 syncService.js — 自動資料同步
 * 使用者首次登入時，自動將 localStorage 資料遷移到 Supabase
 * 並在後續操作中保持雙向同步
 */
import { migrateLocalDataToSupabase } from './dbService';

const SYNC_KEY = 'weaving_sync_done';

/**
 * 使用者登入後觸發：檢查是否需要遷移
 * @param {object} user - Auth user 物件
 */
export const onUserLogin = async (user) => {
    if (!user || user.isOffline) return;

    // 檢查是否已經同步過
    const syncDone = localStorage.getItem(`${SYNC_KEY}_${user.id}`);
    if (syncDone) return;

    // 檢查本地是否有資料值得遷移
    const localStories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
    const localVoices = JSON.parse(localStorage.getItem('weaving_voice_messages') || '[]');
    const localMembers = JSON.parse(localStorage.getItem('family_members') || '[]');

    const totalLocal = localStories.length + localVoices.length + localMembers.length;
    if (totalLocal === 0) {
        // 沒有本地資料，標記已同步
        localStorage.setItem(`${SYNC_KEY}_${user.id}`, new Date().toISOString());
        return;
    }

    // 執行遷移
    try {
        console.log(`🔄 開始同步 ${totalLocal} 筆本地資料到雲端...`);
        const result = await migrateLocalDataToSupabase();
        if (result.migrated) {
            console.log(`✅ 同步完成！遷移了 ${result.count} 筆資料`);
            localStorage.setItem(`${SYNC_KEY}_${user.id}`, new Date().toISOString());
        }
    } catch (e) {
        console.warn('⚠ 資料同步失敗，下次登入會重試:', e);
    }
};

/**
 * 使用者登出時的清理
 */
export const onUserLogout = () => {
    // 登出不清除本地資料，保護使用者內容
    console.log('👋 使用者登出，本地資料保留');
};
