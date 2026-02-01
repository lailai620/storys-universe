import React from 'react';

/**
 * SkeletonCard 元件
 * ------------------
 * 用於 Gallery 頁面的骨架屏動畫，在故事卡片載入時顯示。
 * 模擬卡片結構，提供視覺上的「內容佔位」效果。
 */
const SkeletonCard = () => (
    <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 animate-pulse">
        {/* 模擬封面圖片區域 */}
        <div className="aspect-[4/3] bg-gradient-to-br from-slate-800 via-slate-700/50 to-slate-800 relative overflow-hidden">
            {/* 掃描線動畫 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>
        </div>

        {/* 模擬文字區域 */}
        <div className="p-5 space-y-3">
            {/* 標題骨架 */}
            <div className="h-5 bg-slate-700/50 rounded-lg w-3/4"></div>

            {/* 內容骨架 */}
            <div className="space-y-2">
                <div className="h-3 bg-slate-800/50 rounded w-full"></div>
                <div className="h-3 bg-slate-800/50 rounded w-5/6"></div>
            </div>

            {/* 底部資訊骨架 */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                <div className="h-3 bg-slate-800/50 rounded w-20"></div>
                <div className="h-3 bg-slate-800/50 rounded w-16"></div>
            </div>
        </div>
    </div>
);

/**
 * GallerySkeleton 元件
 * ----------------------
 * 顯示多張骨架卡片，模擬 Gallery 頁面的載入狀態。
 */
export const GallerySkeleton = ({ count = 8 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

/**
 * ProfileSkeleton 元件
 * ----------------------
 * 用於 Profile 頁面的載入骨架。
 */
export const ProfileSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        {/* 用戶資訊區塊骨架 */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 border border-white/10 p-8 rounded-3xl">
            <div className="w-24 h-24 rounded-full bg-slate-700/50"></div>
            <div className="flex-1 space-y-3">
                <div className="h-6 bg-slate-700/50 rounded w-48"></div>
                <div className="h-4 bg-slate-800/50 rounded w-64"></div>
            </div>
        </div>

        {/* 卡片區塊骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    </div>
);

export default SkeletonCard;
