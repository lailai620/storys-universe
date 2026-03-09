import React from 'react';

/**
 * 💀 骨架屏元件 — Skeleton Loading
 * 提供頁面載入時的視覺佔位效果
 * 使用 Tailwind animate-pulse 動畫
 */

// 基礎骨架區塊
export const SkeletonBlock = ({ className = '' }) => (
    <div className={`bg-primary/10 dark:bg-primary/5 rounded-xl animate-pulse ${className}`} />
);

// 圓形骨架（頭像等）
export const SkeletonCircle = ({ size = 'w-10 h-10' }) => (
    <div className={`${size} rounded-full bg-primary/10 dark:bg-primary/5 animate-pulse shrink-0`} />
);

// 文字行骨架
export const SkeletonLine = ({ width = 'w-full' }) => (
    <div className={`h-3 ${width} rounded-full bg-primary/10 dark:bg-primary/5 animate-pulse`} />
);

// 🏠 首頁骨架屏
export const HomeSkeleton = () => (
    <div className="px-6 pt-12 pb-24 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
            <div className="space-y-2">
                <SkeletonLine width="w-24" />
                <SkeletonBlock className="h-7 w-40" />
            </div>
            <SkeletonCircle />
        </div>

        {/* Stats */}
        <div className="flex gap-3">
            <SkeletonBlock className="h-8 w-24" />
            <SkeletonBlock className="h-8 w-20" />
        </div>

        {/* Featured Card */}
        <SkeletonBlock className="h-48 w-full rounded-2xl" />

        {/* Quote Section */}
        <div className="space-y-2">
            <SkeletonBlock className="h-5 w-20" />
            <SkeletonBlock className="h-24 w-full rounded-2xl" />
        </div>
    </div>
);

// 📖 故事集骨架屏
export const StoryCollectionSkeleton = () => (
    <div className="px-4 pt-12 pb-24 space-y-4">
        {/* Header */}
        <div className="px-2 space-y-2 mb-4">
            <SkeletonBlock className="h-7 w-20" />
            <SkeletonLine width="w-16" />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 px-2 mb-4">
            <SkeletonBlock className="h-8 w-14 rounded-full" />
            <SkeletonBlock className="h-8 w-16 rounded-full" />
            <SkeletonBlock className="h-8 w-16 rounded-full" />
        </div>

        {/* Story Cards */}
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden">
                <div className="p-5 space-y-3">
                    <div className="flex gap-2">
                        <SkeletonBlock className="h-5 w-16 rounded-full" />
                        <SkeletonLine width="w-20" />
                    </div>
                    <SkeletonBlock className="h-6 w-3/4" />
                    <div className="space-y-2">
                        <SkeletonLine />
                        <SkeletonLine width="w-5/6" />
                        <SkeletonLine width="w-2/3" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// 📖 故事詳情骨架屏
export const StoryDetailSkeleton = () => (
    <div className="px-6 pt-28 pb-16 space-y-6">
        {/* Tags */}
        <div className="flex gap-2">
            <SkeletonBlock className="h-7 w-20 rounded-full" />
            <SkeletonBlock className="h-7 w-20 rounded-full" />
        </div>

        {/* Title */}
        <SkeletonBlock className="h-8 w-4/5" />

        {/* Meta */}
        <div className="flex gap-3">
            <SkeletonLine width="w-24" />
            <SkeletonLine width="w-12" />
            <SkeletonLine width="w-20" />
        </div>

        {/* Divider */}
        <div className="h-px bg-primary/10 my-4" />

        {/* Content Paragraphs */}
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
                <SkeletonLine />
                <SkeletonLine width="w-11/12" />
                <SkeletonLine width="w-4/5" />
                <SkeletonLine width="w-9/12" />
            </div>
        ))}
    </div>
);

// 🎤 語音骨架屏
export const VoiceSkeleton = () => (
    <div className="px-4 pt-12 pb-24 space-y-4">
        <div className="px-2 space-y-2 mb-6">
            <SkeletonBlock className="h-7 w-28" />
            <SkeletonLine width="w-48" />
        </div>

        {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 flex items-center gap-4">
                <SkeletonCircle size="w-12 h-12" />
                <div className="flex-1 space-y-2">
                    <SkeletonBlock className="h-5 w-28" />
                    <SkeletonLine width="w-40" />
                </div>
                <SkeletonBlock className="h-5 w-5 rounded" />
            </div>
        ))}
    </div>
);

// ⚙ 設定骨架屏
export const SettingsSkeleton = () => (
    <div className="px-4 pt-12 pb-24 space-y-6">
        <div className="px-2 space-y-2">
            <SkeletonBlock className="h-7 w-16" />
            <SkeletonLine width="w-32" />
        </div>

        {/* User Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 flex items-center gap-4">
            <SkeletonCircle size="w-14 h-14" />
            <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-5 w-24" />
                <SkeletonLine width="w-32" />
            </div>
        </div>

        {/* Section items */}
        {[1, 2].map(section => (
            <div key={section} className="space-y-2">
                <SkeletonLine width="w-12" />
                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden">
                    {[1, 2, 3].map(item => (
                        <div key={item} className="px-4 py-3.5 flex items-center gap-3 border-t border-primary/5 first:border-t-0">
                            <SkeletonCircle size="w-6 h-6" />
                            <div className="flex-1 space-y-1">
                                <SkeletonBlock className="h-4 w-20" />
                                <SkeletonLine width="w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export default {
    HomeSkeleton,
    StoryCollectionSkeleton,
    StoryDetailSkeleton,
    VoiceSkeleton,
    SettingsSkeleton,
};
