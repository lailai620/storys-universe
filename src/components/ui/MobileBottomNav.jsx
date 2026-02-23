import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Plus, User, Sparkles } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';
import { useStory } from '../../context/StoryContext';

/**
 * 📱 MobileBottomNav - 手機端底部導航
 * 只在行動裝置上顯示，提供快速導航功能
 */
const MobileBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { playClick, playHover } = useAudio();
    const { user } = useStory();

    // 不在這些頁面顯示底部導航
    const hiddenPaths = ['/creator', '/create', '/child-reader', '/admin', '/story'];
    const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

    if (shouldHide) return null;

    const navItems = [
        { icon: Home, label: '首頁', path: '/' },
        { icon: Compass, label: '探索', path: '/gallery' },
        { icon: Plus, label: '創作', path: '/creator', isPrimary: true },
        { icon: Sparkles, label: '聖殿', path: '/sanctuary' },
        { icon: User, label: '我的', path: user ? '/profile' : '/login' },
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-[#0f1016]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    if (item.isPrimary) {
                        // 中央的創作按鈕 - 特殊樣式
                        return (
                            <button
                                key={index}
                                onClick={() => { playClick(); navigate(item.path); }}
                                onMouseEnter={playHover}
                                className="relative -mt-6 w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                            >
                                <Icon size={24} className="text-slate-900" />
                                {/* 外圈光暈 */}
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 blur-lg opacity-30 animate-pulse" />
                            </button>
                        );
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => { playClick(); navigate(item.path); }}
                            onMouseEnter={playHover}
                            className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all cursor-pointer ${active
                                ? 'text-white'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <div className="relative">
                                <Icon size={24} />
                                {/* 活躍指示器 */}
                                {active && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
                                )}
                            </div>
                            <span className="text-[11px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
