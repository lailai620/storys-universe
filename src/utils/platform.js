/**
 * 平台偵測工具
 * ==============
 * 判斷 App 是在瀏覽器、PWA 還是 Capacitor 原生環境中運行
 */

/**
 * 檢查是否在 Capacitor 原生 App 中運行
 */
export const isNativeApp = () => {
    return typeof window !== 'undefined' &&
        window.Capacitor !== undefined &&
        window.Capacitor.isNativePlatform?.() === true;
};

/**
 * 檢查是否在 Android 裝置上
 */
export const isAndroid = () => {
    if (isNativeApp()) {
        return window.Capacitor.getPlatform?.() === 'android';
    }
    return /android/i.test(navigator.userAgent);
};

/**
 * 檢查是否在 iOS 裝置上
 */
export const isIOS = () => {
    if (isNativeApp()) {
        return window.Capacitor.getPlatform?.() === 'ios';
    }
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
};

/**
 * 檢查是否在 PWA 模式（安裝到桌面）中運行
 */
export const isPWA = () => {
    return window.matchMedia?.('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
};

/**
 * 取得目前平台名稱
 * @returns {'android' | 'ios' | 'pwa' | 'web'}
 */
export const getPlatform = () => {
    if (isNativeApp()) {
        return window.Capacitor.getPlatform?.() || 'web';
    }
    if (isPWA()) return 'pwa';
    return 'web';
};
