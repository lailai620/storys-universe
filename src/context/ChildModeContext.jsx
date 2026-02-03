import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * 🧠 ChildModeContext - 兒童模式狀態管理
 * ======================================
 * 功能：
 * 1. 管理「魔法眼鏡」狀態（注音顯示開關）
 * 2. 持久化到 localStorage，避免刷新後重置
 * 3. First Paint 時即套用設定，避免閃爍
 * 
 * 隔離規範：
 * - 此 Context 只在 ChildModeLayout 內部有效
 * - 絕不掛載到 App 根層級
 */

// 預設偏好設定
const DEFAULT_PREFERENCES = {
    isGlassesOn: true, // 預設開啟注音
    fontSize: 'large', // 'medium' | 'large' | 'xlarge'
    readSpeed: 'normal', // 'slow' | 'normal' | 'fast'
};

// 從 localStorage 讀取初始值（SSR 安全）
const getInitialPreferences = () => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

    try {
        const saved = localStorage.getItem('child_mode_pref');
        if (saved) {
            return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.warn('Failed to load child mode preferences:', e);
    }
    return DEFAULT_PREFERENCES;
};

// Context 類型定義
const ChildModeContext = createContext(null);

// Hook 用於存取 Context
export const useChildMode = () => {
    const context = useContext(ChildModeContext);
    if (!context) {
        // 在非兒童模式下使用時回傳預設值，不報錯
        return {
            isGlassesOn: false,
            toggleGlasses: () => { },
            setGlassesOn: () => { },
            fontSize: 'medium',
            setFontSize: () => { },
            isChildModeActive: false,
        };
    }
    return context;
};

// Provider 元件
export const ChildModeProvider = ({ children }) => {
    // 使用 lazy initializer 確保 First Paint 即套用正確狀態
    const [preferences, setPreferences] = useState(getInitialPreferences);

    // 解構常用狀態
    const { isGlassesOn, fontSize, readSpeed } = preferences;

    // 持久化到 localStorage
    useEffect(() => {
        try {
            localStorage.setItem('child_mode_pref', JSON.stringify(preferences));
        } catch (e) {
            console.warn('Failed to save child mode preferences:', e);
        }
    }, [preferences]);

    // 切換魔法眼鏡
    const toggleGlasses = useCallback(() => {
        setPreferences(prev => ({
            ...prev,
            isGlassesOn: !prev.isGlassesOn,
        }));
    }, []);

    // 設定眼鏡狀態
    const setGlassesOn = useCallback((value) => {
        setPreferences(prev => ({
            ...prev,
            isGlassesOn: Boolean(value),
        }));
    }, []);

    // 設定字體大小
    const setFontSize = useCallback((size) => {
        if (['medium', 'large', 'xlarge'].includes(size)) {
            setPreferences(prev => ({
                ...prev,
                fontSize: size,
            }));
        }
    }, []);

    // 設定閱讀速度
    const setReadSpeed = useCallback((speed) => {
        if (['slow', 'normal', 'fast'].includes(speed)) {
            setPreferences(prev => ({
                ...prev,
                readSpeed: speed,
            }));
        }
    }, []);

    // Context 值
    const value = {
        // 狀態
        isGlassesOn,
        fontSize,
        readSpeed,
        isChildModeActive: true, // 標示目前在兒童模式內

        // 方法
        toggleGlasses,
        setGlassesOn,
        setFontSize,
        setReadSpeed,

        // 完整偏好設定
        preferences,
    };

    return (
        <ChildModeContext.Provider value={value}>
            {children}
        </ChildModeContext.Provider>
    );
};

export default ChildModeProvider;
