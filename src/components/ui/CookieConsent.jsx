import React, { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isNativeApp } from '../../utils/platform';

/**
 * 🍪 Cookie 同意橫幅
 * GDPR 合規：用戶必須明確同意 Cookie 使用
 */
const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // App 原生環境不需要顯示網頁版 Cookie 橫幅
        if (isNativeApp()) return;

        // 檢查是否已同意
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // 延遲顯示，避免干擾首次載入體驗
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        setIsExiting(true);
        setTimeout(() => {
            localStorage.setItem('cookie-consent', 'accepted');
            setIsVisible(false);
        }, 300);
    };

    const handleDecline = () => {
        setIsExiting(true);
        setTimeout(() => {
            localStorage.setItem('cookie-consent', 'declined');
            setIsVisible(false);
        }, 300);
    };

    if (!isVisible || isNativeApp()) return null;

    return (
        <div
            role="dialog"
            aria-label="Cookie 使用同意"
            className={`fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[190] transition-all duration-300 ${isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                } animate-in slide-in-from-bottom-4 fade-in duration-500`}
        >
            <div className="bg-[#1a1b26]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-5">
                {/* 標題 */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Shield size={16} className="text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white">🍪 Cookie 使用通知</h3>
                    <button
                        onClick={handleDecline}
                        className="ml-auto p-1 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/5 transition-all"
                        aria-label="關閉 Cookie 通知"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* 說明 */}
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    我們使用 Cookie 來儲存您的偏好設定（主題、模式選擇）並改善使用體驗。
                    詳情請參閱{' '}
                    <button
                        onClick={() => navigate('/privacy')}
                        className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer"
                    >
                        隱私權政策
                    </button>
                    。
                </p>

                {/* 按鈕 */}
                <div className="flex gap-2">
                    <button
                        onClick={handleAccept}
                        className="flex-1 px-4 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all cursor-pointer"
                    >
                        接受
                    </button>
                    <button
                        onClick={handleDecline}
                        className="px-4 py-2 text-xs font-medium bg-white/5 text-slate-300 rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                    >
                        僅必要
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
