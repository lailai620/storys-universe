/**
 * ☁️ Google Drive 備份服務
 * 處理資料打包、連接 Google 帳號 (要求 Drive Scope) 及上傳至個人的 Google Drive。
 */
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { getStories, getMemories, getVoiceMessages } from './dbService';
import { Capacitor } from '@capacitor/core';

// 我們請求的 Scope，僅允許操作 APP 自己建立的檔案，不影響用戶隱私
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

/**
 * 1. 連接 Google Drive（取得帶有 Drive Scope 的 Provider Token）
 * 會觸發 OAuth 登入跳轉。
 */
export const connectGoogleDrive = async () => {
    if (!isSupabaseConfigured) throw new Error('Supabase 尚未設定');

    const redirectUrl = Capacitor.isNativePlatform()
        ? 'com.weavinglight.app://auth'
        : window.location.origin + '/settings'; // 跳轉回設定頁

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            scopes: DRIVE_SCOPE,
            redirectTo: redirectUrl,
            queryParams: {
                prompt: 'consent', // 強制請求同意，確保能拿到 refresh token
                access_type: 'offline'
            }
        },
    });

    if (error) throw error;
};

/**
 * 2. 獲取當前有效的 Google OAuth Token
 */
export const getGoogleDriveToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.provider_token) {
        return null;
    }
    
    // 確認此 token 是否包含 Drive 權限
    // 通常只要呼叫了 connectGoogleDrive，拿到的 token 就會有。
    return session.provider_token;
};

/**
 * 3. 執行備份
 * 將所有的 stories、memories 與部分 user data 打包為 JSON，並上傳至 Drive。
 */
export const backupToGoogleDrive = async (token) => {
    if (!token) throw new Error('尚未授權 Google Drive');

    // ── 收集資料 ──
    const [stories, memories, voiceMessages] = await Promise.all([
        getStories().catch(() => []),
        getMemories().catch(() => []),
        getVoiceMessages().catch(() => []),
    ]);

    const exportData = {
        app: 'WeavingLight',
        version: '1.1',
        exported_at: new Date().toISOString(),
        data: { stories, memories, voiceMessages } // ✅ 补上語音訊息
    };

    const fileContent = JSON.stringify(exportData, null, 2);
    // ✅ 固定檔名，方便搜尋與覆蓋
    const BACKUP_FILE_NAME = 'weaving_backup.json';

    // ── 搜尋是否已有備份檔案 ──
    let existingFileId = null;
    try {
        const searchRes = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}'+and+trashed=false&spaces=drive&fields=files(id,name)`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (searchRes.ok) {
            const { files } = await searchRes.json();
            existingFileId = files?.[0]?.id || null;
        }
    } catch (e) {
        console.warn('搜尋旧備份檔失敗，將建立新檔案:', e);
    }

    const metadata = {
        name: BACKUP_FILE_NAME,
        mimeType: 'application/json',
        description: '織光 WeavingLight 雲端備份檔'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    // ✅ 有舊檔用 PATCH，沒有才用 POST建新檔
    const url = existingFileId
        ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const method = existingFileId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || '上傳至 Google Drive 失敗');
    }

    const result = await res.json();
    const backupInfo = {
        lastBackupAt: new Date().toISOString(),
        fileId: result.id,
        fileName: result.name,
        size: fileContent.length,
        isUpdate: !!existingFileId
    };
    localStorage.setItem('weaving_last_backup', JSON.stringify(backupInfo));
    return backupInfo;
};

/**
 * 4. 讀取上次的備份狀態
 */
export const getLastBackupInfo = () => {
    try {
        const info = localStorage.getItem('weaving_last_backup');
        return info ? JSON.parse(info) : null;
    } catch {
        return null;
    }
};
