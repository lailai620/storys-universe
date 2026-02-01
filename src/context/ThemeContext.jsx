import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * 主題切換 Context
 * -----------------
 * 支援深色 (dark) 與淺色 (light) 兩種主題
 * 使用 localStorage 記憶用戶偏好
 */

// 主題定義
export const THEMES = {
    dark: {
        name: 'dark',
        label: '深色模式',
        colors: {
            background: '#0f1016',
            surface: '#1a1b26',
            surfaceHover: '#24253a',
            border: 'rgba(255, 255, 255, 0.1)',
            text: {
                primary: '#e2e8f0',
                secondary: '#94a3b8',
                muted: '#64748b',
            },
            accent: {
                primary: '#6366f1',
                secondary: '#8b5cf6',
            },
        },
    },
    light: {
        name: 'light',
        label: '淺色模式',
        colors: {
            background: '#f8fafc',
            surface: '#ffffff',
            surfaceHover: '#f1f5f9',
            border: 'rgba(0, 0, 0, 0.1)',
            text: {
                primary: '#1e293b',
                secondary: '#475569',
                muted: '#94a3b8',
            },
            accent: {
                primary: '#6366f1',
                secondary: '#8b5cf6',
            },
        },
    },
};

// Context
const ThemeContext = createContext(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        // 回傳預設值避免錯誤
        return {
            theme: 'dark',
            themeConfig: THEMES.dark,
            toggleTheme: () => { },
            setTheme: () => { },
            isDark: true,
        };
    }
    return context;
};

// Provider
export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        // 從 localStorage 讀取，預設深色
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'dark';
        }
        return 'dark';
    });

    const themeConfig = THEMES[theme] || THEMES.dark;
    const isDark = theme === 'dark';

    // 套用主題到 DOM
    useEffect(() => {
        const root = document.documentElement;

        // 設定 data-theme 屬性
        root.setAttribute('data-theme', theme);

        // 設定 CSS 變數
        const colors = themeConfig.colors;
        root.style.setProperty('--color-background', colors.background);
        root.style.setProperty('--color-surface', colors.surface);
        root.style.setProperty('--color-surface-hover', colors.surfaceHover);
        root.style.setProperty('--color-border', colors.border);
        root.style.setProperty('--color-text-primary', colors.text.primary);
        root.style.setProperty('--color-text-secondary', colors.text.secondary);
        root.style.setProperty('--color-text-muted', colors.text.muted);
        root.style.setProperty('--color-accent-primary', colors.accent.primary);
        root.style.setProperty('--color-accent-secondary', colors.accent.secondary);

        // 儲存到 localStorage
        localStorage.setItem('theme', theme);
    }, [theme, themeConfig]);

    // 切換主題
    const toggleTheme = useCallback(() => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    // 設定特定主題
    const setTheme = useCallback((newTheme) => {
        if (THEMES[newTheme]) {
            setThemeState(newTheme);
        }
    }, []);

    const value = {
        theme,
        themeConfig,
        toggleTheme,
        setTheme,
        isDark,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;
