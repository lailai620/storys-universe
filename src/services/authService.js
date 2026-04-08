/**
 * 🔐 認證服務 — authService.js
 * 處理 Google/Email 登入、登出、Session 管理
 */
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Capacitor } from '@capacitor/core';

// ─── 登入狀態 ─────────────────────────────────────────────
let currentUser = null;
const authListeners = new Set();

/**
 * 訂閱認證狀態變更
 */
export const onAuthStateChange = (callback) => {
    authListeners.add(callback);
    // 立即回報當前狀態
    callback(currentUser);
    return () => authListeners.delete(callback);
};

const notifyListeners = (user) => {
    currentUser = user;
    authListeners.forEach(cb => cb(user));
};

// ─── 初始化 Session ───────────────────────────────────────
export const initAuth = async () => {
    if (!isSupabaseConfigured) {
        // 離線模式：使用 localStorage 模擬登入
        const offlineUser = JSON.parse(localStorage.getItem('weaving_offline_user') || 'null');
        notifyListeners(offlineUser);
        return offlineUser;
    }

    // ── Capacitor Deep Link Handler (OAuth 回調) ──────────
    // Google 登入成功後，系統透過 com.weavinglight.app://auth?... 跳回 App
    // 必須在這裡攔截 URL 並把 token 交給 Supabase 建立 Session
    if (Capacitor.isNativePlatform()) {
        try {
            const { App } = await import('@capacitor/app');
            App.addListener('appUrlOpen', async ({ url }) => {
                console.log('[Auth] Deep link received:', url);
                if (!url || !url.startsWith('com.weavinglight.app')) return;

                // 把自訂 scheme 換成標準 https URL 以便解析
                const normalized = url
                    .replace('com.weavinglight.app://auth', 'https://auth-callback/')
                    .replace('com.weavinglight.app://', 'https://auth-callback/');

                try {
                    const parsed = new URL(normalized);
                    // OAuth PKCE flow: 從 hash (#) 取 access_token / refresh_token
                    const hashParams = new URLSearchParams(parsed.hash.replace('#', ''));
                    const access_token = hashParams.get('access_token');
                    const refresh_token = hashParams.get('refresh_token');

                    if (access_token && refresh_token) {
                        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
                        if (!error && data?.user) {
                            notifyListeners(data.user);
                        }
                    } else {
                        // Supabase PKCE flow: 讓 Supabase 直接解析整個 URL
                        await supabase.auth.getSessionFromUrl();
                    }
                } catch (err) {
                    console.warn('[Auth] Failed to parse deep link URL:', err);
                }
            });
        } catch (e) {
            console.warn('[Auth] Capacitor App plugin not available:', e);
        }
    }
    // ── End Deep Link Handler ──────────────────────────────
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        notifyListeners(session.user);
    }

    // 監聽 auth 變更
    supabase.auth.onAuthStateChange((_event, session) => {
        notifyListeners(session?.user || null);
    });

    return session?.user || null;
};

// ─── Google 登入 ──────────────────────────────────────────
export const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
        return { error: 'Supabase 尚未設定' };
    }

    // 判斷是否為原生 App (Android/iOS)
    const redirectUrl = Capacitor.isNativePlatform() 
        ? 'com.weavinglight.app://auth' 
        : window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl,
            queryParams: {
                prompt: 'select_account',
            },
        },
    });

    return { data, error };
};

// ─── LINE 登入 ──────────────────────────────────────────
export const signInWithLine = async () => {
    if (!isSupabaseConfigured) {
        return { error: 'Supabase 尚未設定' };
    }

    const redirectUrl = Capacitor.isNativePlatform() 
        ? 'com.weavinglight.app://auth' 
        : window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'line',
        options: {
            redirectTo: redirectUrl,
        },
    });

    return { data, error };
};

// ─── Email/密碼 註冊 ──────────────────────────────────────
export const signUpWithEmail = async (email, password, displayName = '') => {
    if (!isSupabaseConfigured) {
        return { error: 'Supabase 尚未設定' };
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: displayName },
        },
    });

    return { data, error };
};

// ─── Email/密碼 登入 ──────────────────────────────────────
export const signInWithEmail = async (email, password) => {
    if (!isSupabaseConfigured) {
        return { error: 'Supabase 尚未設定' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    return { data, error };
};

// ─── 離線模式登入（開發/Demo 用）──────────────────────────
export const signInOffline = (name = '織光使用者') => {
    const offlineUser = {
        id: 'offline_' + Date.now(),
        email: 'offline@weaving.light',
        user_metadata: { full_name: name },
        isOffline: true,
    };
    localStorage.setItem('weaving_offline_user', JSON.stringify(offlineUser));
    notifyListeners(offlineUser);
    return offlineUser;
};

// ─── 忘記密碼（重設密碼信） ──────────────────────────────
export const resetPassword = async (email) => {
    if (!isSupabaseConfigured) return { error: 'Supabase 尚未設定' };

    const redirectUrl = Capacitor.isNativePlatform() 
        ? 'com.weavinglight.app://auth' 
        : `${window.location.origin}/reset-password`;

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
    });

    return { data, error };
};

// ─── 登出 ─────────────────────────────────────────────────
export const signOut = async () => {
    if (isSupabaseConfigured) {
        await supabase.auth.signOut();
    }
    localStorage.removeItem('weaving_offline_user');
    notifyListeners(null);
};

// ─── 取得當前使用者 ───────────────────────────────────────
export const getCurrentUser = () => currentUser;

// ─── 取得使用者顯示名稱 ──────────────────────────────────
export const getUserDisplayName = (user) => {
    if (!user) return '訪客';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || '使用者';
};

// ─── 檢查是否為 Pro 會員 ─────────────────────────────────
export const checkProStatus = async (userId) => {
    if (!isSupabaseConfigured || !userId) {
        // 離線模式：從 localStorage 判斷
        return JSON.parse(localStorage.getItem('weaving_pro_status') || 'false');
    }

    const { data } = await supabase
        .from('profiles')
        .select('is_pro, pro_expires_at')
        .eq('id', userId)
        .single();

    if (data?.is_pro && data.pro_expires_at) {
        return new Date(data.pro_expires_at) > new Date();
    }
    return data?.is_pro || false;
};
