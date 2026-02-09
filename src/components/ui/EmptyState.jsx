import React from 'react';
import { BookOpen, Search, Heart, FolderOpen, PenTool, Sparkles } from 'lucide-react';

/**
 * 📭 EmptyState - 空狀態元件
 * ==========================
 * 當列表/頁面無資料時顯示友善的提示
 * 
 * 預設變體:
 * - stories: 無故事
 * - search: 搜尋無結果
 * - favorites: 無收藏
 * - folder: 資料夾為空
 * - create: 邀請創作
 */

const variants = {
    stories: {
        icon: BookOpen,
        title: '這裡還沒有故事',
        description: '宇宙正在等待第一個故事的誕生...',
        iconColor: 'text-indigo-400',
        bgGradient: 'from-indigo-500/10 to-purple-500/10',
    },
    search: {
        icon: Search,
        title: '找不到相關結果',
        description: '試試其他關鍵字，或瀏覽所有故事',
        iconColor: 'text-slate-400',
        bgGradient: 'from-slate-500/10 to-slate-600/10',
    },
    favorites: {
        icon: Heart,
        title: '還沒有收藏的故事',
        description: '閱讀時點擊愛心，就能收藏喜歡的故事',
        iconColor: 'text-rose-400',
        bgGradient: 'from-rose-500/10 to-pink-500/10',
    },
    folder: {
        icon: FolderOpen,
        title: '這個資料夾是空的',
        description: '開始添加內容吧',
        iconColor: 'text-amber-400',
        bgGradient: 'from-amber-500/10 to-orange-500/10',
    },
    create: {
        icon: PenTool,
        title: '開始你的創作之旅',
        description: '每個偉大的故事都從一個想法開始',
        iconColor: 'text-emerald-400',
        bgGradient: 'from-emerald-500/10 to-teal-500/10',
    },
};

const EmptyState = ({
    variant = 'stories',
    title,
    description,
    icon: CustomIcon,
    action,
    actionLabel,
    onAction,
    className = '',
}) => {
    const config = variants[variant] || variants.stories;
    const Icon = CustomIcon || config.icon;
    const displayTitle = title || config.title;
    const displayDescription = description || config.description;

    return (
        <div
            className={`
        flex flex-col items-center justify-center 
        py-16 px-8 
        text-center
        animate-fade-in-up
        ${className}
      `}
        >
            {/* 圖示容器 - 添加漂浮動畫 */}
            <div
                className={`
          relative
          w-24 h-24 mb-6
          rounded-full
          bg-gradient-to-br ${config.bgGradient}
          flex items-center justify-center
          border border-white/10
          animate-float
        `}
            >
                {/* 發光效果 */}
                <div
                    className="absolute inset-0 rounded-full opacity-50 blur-xl animate-pulse"
                    style={{
                        background: `radial-gradient(circle, ${config.iconColor.replace('text-', 'rgb(var(--')}, transparent)`,
                    }}
                />

                {/* 圖示 */}
                <Icon size={40} className={`relative z-10 ${config.iconColor}`} />

                {/* 漂浮星星裝飾 - 多顆 */}
                <Sparkles
                    size={16}
                    className="absolute -top-1 -right-1 text-amber-300/60 animate-twinkle"
                />
                <Sparkles
                    size={12}
                    className="absolute -bottom-2 -left-2 text-purple-300/50 animate-twinkle"
                    style={{ animationDelay: '0.5s' }}
                />
                <div className="absolute top-3 -left-3 w-1.5 h-1.5 rounded-full bg-indigo-400/40 animate-twinkle" style={{ animationDelay: '1s' }} />
            </div>

            {/* 標題 */}
            <h3 className="text-xl font-bold text-white mb-2">
                {displayTitle}
            </h3>

            {/* 描述 */}
            <p className="text-slate-400 max-w-xs mb-6">
                {displayDescription}
            </p>

            {/* 行動按鈕 */}
            {(action || onAction) && (
                <button
                    onClick={onAction}
                    className="
            px-6 py-2.5
            bg-gradient-to-r from-indigo-500 to-purple-500
            text-white font-bold text-sm
            rounded-full
            shadow-lg shadow-indigo-500/30
            hover:shadow-xl hover:shadow-indigo-500/40
            hover:scale-105
            active:scale-95
            transition-all duration-200
            cursor-pointer
          "
                >
                    {actionLabel || action || '開始探索'}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
