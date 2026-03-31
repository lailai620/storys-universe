/**
 * 🔐 AuthContext — 全域認證狀態
 * 提供 user、loading、isPro 給所有子元件
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    initAuth,
    onAuthStateChange,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInOffline,
    signOut,
    getCurrentUser,
    getUserDisplayName,
    checkProStatus,
} from '../services/authService';
import { onUserLogin, onUserLogout } from '../services/syncService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                await initAuth();
            } catch (e) {
                console.warn('Auth init warning:', e);
            }
            if (mounted) setLoading(false);
        };

        const unsub = onAuthStateChange(async (u) => {
            if (!mounted) return;
            setUser(u);
            if (u) {
                const pro = await checkProStatus(u.id);
                if (mounted) setIsPro(pro);
                // 🔄 觸發資料同步
                onUserLogin(u);
            } else {
                setIsPro(false);
            }
        });

        init();
        return () => { mounted = false; unsub(); };
    }, []);

    const value = {
        // 狀態
        user,
        loading,
        isPro,
        isAuthenticated: !!user,
        displayName: getUserDisplayName(user),

        // 登入方法
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInOffline,
        signOut: async () => {
            await signOut();
            setIsPro(false);
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
