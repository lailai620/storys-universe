import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { getCurrentUser } from './authService';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// ─── 方案定義 ───────────────────────────────────────────────
export const PLANS = {
    monthly: {
        id: 'monthly',
        name: '月付方案',
        price: 'NT$149',
        priceNum: 149,
        period: '/月',
        badge: null,
    },
    yearly: {
        id: 'yearly',
        name: '年付方案',
        price: 'NT$1,190',
        priceNum: 1190,
        period: '/年',
        badge: '省下 NT$598',
        popular: true,
    },
};

// ─── Pro 功能比較 ───────────────────────────────────────────
export const FEATURE_COMPARISON = [
    { name: 'AI 故事引導', free: '每週 5 次', pro: '每月 100 次', icon: 'auto_awesome' },
    { name: '資料儲存', free: '僅本地端', pro: '雲端即時同步', icon: 'cloud_done' },
    { name: '語音錄製', free: '基礎錄製', pro: '無限錄製', icon: 'mic' },
    { name: '精裝書製作', free: '—', pro: '可製作', icon: 'auto_stories' },
    { name: '進階 AI 功能', free: '—', pro: '語音轉文字等', icon: 'smart_toy' },
];

/** 🎯 初始化 RevenueCat (在 App.jsx 呼叫) */
export const initPurchases = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
        const apiKey = Capacitor.getPlatform() === 'ios'
            ? import.meta.env.VITE_REVENUECAT_API_KEY_IOS
            : import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID;

        // 如果是內部測試金鑰，提早跳出，不啟動 RevenueCat 避免 App 強制黑屏關閉
        if (!apiKey || apiKey.startsWith('test_')) {
            console.warn('RevenueCat Init Skipped: Using Test API Key');
            return;
        }

        await Purchases.configure({ apiKey });
        console.log('RevenueCat Configured ✅');

        // 同步使用者 ID 到 RevenueCat
        const user = getCurrentUser();
        if (user && !user.isOffline) {
            await Purchases.logIn({ appUserID: user.id });
        }
    } catch (err) {
        console.error('RevenueCat Init Error:', err);
    }
};

// ─── 訂閱狀態檢查 ──────────────────────────────────────────
export const getSubscriptionStatus = async () => {
    // 🚧 [內部封測期間解鎖]：無條件給予所有測試人員 Pro 權限，未來準備收費上架時請將下面這行刪除 👇
    return { isPro: true, plan: 'yearly', expiresAt: '2099-12-31T23:59:59.000Z', isExpired: false };

    // 1. 原生平台：使用 RevenueCat
    if (Capacitor.isNativePlatform()) {
        try {
            const { customerInfo } = await Purchases.getCustomerInfo();
            const entitlements = customerInfo.entitlements.active;
            const isPro = !!entitlements['pro']; // 假設 Entitlement ID 為 'pro'

            if (isPro) {
                return {
                    isPro: true,
                    plan: entitlements['pro'].productIdentifier.includes('yearly') ? 'yearly' : 'monthly',
                    expiresAt: entitlements['pro'].expirationDate,
                    isExpired: false
                };
            }
        } catch (err) {
            console.error('RevenueCat Status Error:', err);
        }
    }

    // 2. Web/開發模式：從 Supabase 或 localStorage 判斷
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        const { data } = await supabase
            .from('profiles')
            .select('is_pro, pro_expires_at, pro_plan')
            .eq('id', user.id)
            .single();

        if (data) {
            const isExpired = data.pro_expires_at && new Date(data.pro_expires_at) < new Date();
            return {
                isPro: data.is_pro && !isExpired,
                plan: data.pro_plan || 'free',
                expiresAt: data.pro_expires_at,
                isExpired,
            };
        }
    }

    // localStorage fallback
    const localPro = localStorage.getItem('weaving_pro') === 'true';
    const localExpires = localStorage.getItem('weaving_pro_expires');
    const isExpired = localExpires && new Date(localExpires) < new Date();

    return {
        isPro: localPro && !isExpired,
        plan: localPro ? 'monthly' : 'free',
        expiresAt: localExpires,
        isExpired,
    };
};

// ─── 購買 Pro ──────────────────────────────────────────────
export const purchasePro = async (planId) => {
    // 1. 原生平台：觸發 IAP
    if (Capacitor.isNativePlatform()) {
        try {
            const offerings = await Purchases.getOfferings();
            if (!offerings.current) throw new Error('No offerings found');

            const pkg = offerings.current.availablePackages.find(p => p.identifier.includes(planId) || p.product.identifier.includes(planId));
            if (!pkg) throw new Error(`Package for ${planId} not found`);

            const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
            const isPro = !!customerInfo.entitlements.active['pro'];

            if (isPro) {
                // 同步狀態到 Supabase (如果有)
                await syncSubscriptionToSupabase(customerInfo);
                return { success: true, expiresAt: customerInfo.entitlements.active['pro'].expirationDate };
            }
        } catch (err) {
            if (err.userCancelled) return { success: false, cancelled: true };
            throw err;
        }
    }

    // 2. 非原生平台：不允許免費獲取 Pro
    throw new Error('請在 Android App 中進行訂閱購買');
};

// 💎 同步訂閱狀態至 Supabase
const syncSubscriptionToSupabase = async (customerInfo) => {
    const user = getCurrentUser();
    if (!isSupabaseConfigured || !user || user.isOffline) return;

    const proEntitlement = customerInfo.entitlements.active['pro'];
    if (!proEntitlement) return;

    await supabase
        .from('profiles')
        .update({
            is_pro: true,
            pro_plan: proEntitlement.productIdentifier.includes('yearly') ? 'yearly' : 'monthly',
            pro_expires_at: proEntitlement.expirationDate,
            pro_started_at: new Date().toISOString(),
        })
        .eq('id', user.id);
};

// ─── 恢復購買 ──────────────────────────────────────────────
export const restorePurchases = async () => {
    if (Capacitor.isNativePlatform()) {
        try {
            const { customerInfo } = await Purchases.restorePurchases();
            await syncSubscriptionToSupabase(customerInfo);
            return getSubscriptionStatus();
        } catch (err) {
            console.error('Restore Purchases Error:', err);
            throw err;
        }
    }
    return getSubscriptionStatus();
};

// ─── 家庭方案: 未來功能，目前停用 ─────────────────────────

// ─── 早鳥 30 天 Pro 體驗 ──────────────────────────────────
export const activateEarlyBirdTrial = async () => {
    const user = getCurrentUser();
    const alreadyActivated = localStorage.getItem('weaving_early_bird_done');
    if (alreadyActivated) return { activated: false, reason: '已啟用過' };

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (isSupabaseConfigured && user && !user.isOffline) {
        await supabase
            .from('profiles')
            .update({
                is_pro: true,
                pro_plan: 'monthly',
                pro_expires_at: expiresAt.toISOString(),
                pro_started_at: new Date().toISOString(),
            })
            .eq('id', user.id);
    }

    localStorage.setItem('weaving_pro', 'true');
    localStorage.setItem('weaving_pro_expires', expiresAt.toISOString());
    localStorage.setItem('weaving_pro_status', 'true');
    localStorage.setItem('weaving_early_bird_done', 'true');

    return { activated: true, expiresAt };
};

