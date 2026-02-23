/**
 * 原生 App 整合模組
 * ===================
 * 統一管理所有 Capacitor 原生功能的初始化
 * 僅在原生 App 環境中載入，瀏覽器中自動跳過
 */

import { isNativeApp } from './platform';

/**
 * 初始化所有原生功能
 * 在 App mount 後調用一次
 */
export const initNativeFeatures = async () => {
    if (!isNativeApp()) return;

    try {
        // 1. StatusBar 配置
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setBackgroundColor({ color: '#0f1016' });
        await StatusBar.setStyle({ style: Style.Dark });

        // 2. 隱藏原生 SplashScreen
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide({ fadeOutDuration: 500 });

        // 3. AndroidBack 返回鍵處理
        const { App } = await import('@capacitor/app');
        App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                window.history.back();
            } else {
                App.exitApp();
            }
        });
    } catch (e) {
        // 靜默失敗：外掛未安裝時不影響 Web 版
    }
};

/**
 * 觸覺回饋
 * 提供輕量級的觸覺反應，提升 App 操作手感
 */
export const hapticLight = async () => {
    if (!isNativeApp()) return;
    try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
        // 靜默失敗
    }
};

export const hapticMedium = async () => {
    if (!isNativeApp()) return;
    try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
        // 靜默失敗
    }
};

/**
 * 更新 StatusBar 主題色
 * 在主題切換時調用
 */
export const updateStatusBarTheme = async (isDark) => {
    if (!isNativeApp()) return;
    try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setBackgroundColor({
            color: isDark ? '#0f1016' : '#ffffff',
        });
        await StatusBar.setStyle({
            style: isDark ? Style.Dark : Style.Light,
        });
    } catch {
        // 靜默失敗
    }
};
