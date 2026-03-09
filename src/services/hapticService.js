/**
 * 📳 觸覺回饋服務 — hapticService.js
 * 使用 Capacitor Haptics 提供按鈕按壓、成功、錯誤等觸覺反饋
 * Web 環境下 graceful fallback（不報錯）
 */

let Haptics = null;
let ImpactStyle = null;
let NotificationType = null;

// 動態載入 Capacitor Haptics（確保 Web 環境也能執行）
const loadHaptics = async () => {
    if (Haptics) return true;
    try {
        const mod = await import('@capacitor/haptics');
        Haptics = mod.Haptics;
        ImpactStyle = mod.ImpactStyle;
        NotificationType = mod.NotificationType;
        return true;
    } catch {
        return false;
    }
};

/**
 * 輕觸回饋 — 用於一般按鈕點擊
 */
export const tapFeedback = async () => {
    if (await loadHaptics()) {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch { }
    }
};

/**
 * 中等觸碰 — 用於重要操作（選擇、切換）
 */
export const selectFeedback = async () => {
    if (await loadHaptics()) {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch { }
    }
};

/**
 * 重觸碰 — 用於強調操作（刪除、送出）
 */
export const heavyFeedback = async () => {
    if (await loadHaptics()) {
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch { }
    }
};

/**
 * 成功回饋 — 用於操作成功（儲存、發送完成）
 */
export const successFeedback = async () => {
    if (await loadHaptics()) {
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch { }
    }
};

/**
 * 警告回饋 — 用於需注意的操作
 */
export const warningFeedback = async () => {
    if (await loadHaptics()) {
        try {
            await Haptics.notification({ type: NotificationType.Warning });
        } catch { }
    }
};

/**
 * 錯誤回饋 — 用於操作失敗
 */
export const errorFeedback = async () => {
    if (await loadHaptics()) {
        try {
            await Haptics.notification({ type: NotificationType.Error });
        } catch { }
    }
};

export const hapticService = {
    tap: tapFeedback,
    select: selectFeedback,
    heavy: heavyFeedback,
    success: successFeedback,
    warning: warningFeedback,
    error: errorFeedback,
    tapFeedback,
    selectFeedback,
    heavyFeedback,
    successFeedback,
    warningFeedback,
    errorFeedback,
};

export default hapticService;
