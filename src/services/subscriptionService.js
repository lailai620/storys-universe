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
    family: {
        id: 'family',
        name: '家庭方案',
        price: 'NT$249',
        priceNum: 249,
        period: '/月（至多 5 人）',
        badge: '最超值',
        icon: 'family_restroom',
    },
};

// ─── Pro 功能比較 ───────────────────────────────────────────
export const FEATURE_COMPARISON = [
    { name: 'AI 故事引導', free: '每週 5 次', pro: '每月 100 次', icon: 'auto_awesome' },
    { name: '資料儲存', free: '僅本地端', pro: '雲端即時同步', icon: 'cloud_done' },
    { name: '語音錄製', free: '基礎錄製', pro: '無限錄製', icon: 'mic' },
    { name: '多人協作', free: '單人記錄', pro: '邀請 3-5 人', icon: 'group' },
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

    // 2. 開發模式：模擬購買流程
    const user = getCurrentUser();
    const plan = Object.values(PLANS).find(p => p.id === planId);
    if (!plan) throw new Error('方案不存在');

    const expiresAt = planId.includes('yearly')
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (isSupabaseConfigured && user && !user.isOffline) {
        await supabase
            .from('profiles')
            .update({
                is_pro: true,
                pro_plan: planId.includes('family') ? 'family' : planId.includes('yearly') ? 'yearly' : 'monthly',
                pro_expires_at: expiresAt.toISOString(),
                pro_started_at: new Date().toISOString(),
            })
            .eq('id', user.id);
    }

    localStorage.setItem('weaving_pro', 'true');
    localStorage.setItem('weaving_pro_expires', expiresAt.toISOString());
    localStorage.setItem('weaving_pro_status', 'true');

    return { success: true, expiresAt };
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

// ─── 家庭方案：建立群組 ─────────────────────────────────────
export const createFamilyGroup = async (groupName = '我的家庭') => {
    const user = getCurrentUser();
    if (!isSupabaseConfigured || !user || user.isOffline) {
        return { error: '需要登入並連線才能建立家庭群組' };
    }

    const { data: group, error } = await supabase
        .from('wl_family_groups')
        .insert({ owner_id: user.id, name: groupName })
        .select()
        .single();

    if (error) return { error: error.message };

    // 自動將 owner 加為成員
    await supabase
        .from('wl_family_group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'owner' });

    return { group };
};

// ─── 家庭方案：用邀請碼加入 ──────────────────────────────
export const joinFamilyGroup = async (inviteCode) => {
    const user = getCurrentUser();
    if (!isSupabaseConfigured || !user || user.isOffline) {
        return { error: '需要登入並連線' };
    }

    // 查找群組
    const { data: group, error: findError } = await supabase
        .from('wl_family_groups')
        .select('*, wl_family_group_members(count)')
        .eq('invite_code', inviteCode.trim().toLowerCase())
        .single();

    if (findError || !group) return { error: '找不到這個邀請碼' };

    // 檢查人數上限
    const memberCount = group.wl_family_group_members?.[0]?.count || 0;
    if (memberCount >= group.max_members) {
        return { error: '群組人數已滿' };
    }

    // 加入
    const { error: joinError } = await supabase
        .from('wl_family_group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'member' });

    if (joinError) {
        if (joinError.code === '23505') return { error: '你已經在這個群組中了' };
        return { error: joinError.message };
    }

    return { group };
};

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

