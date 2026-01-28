import React, { useState, useEffect } from 'react';

/**
 * OptimizedImage 組件
 * -----------------
 * 功能：
 * 1. 自動檢測 Supabase URL 並套用縮圖/轉檔參數。
 * 2. 實作模糊漸現效果 (Blur-up effect)。
 * 3. 支援原生 Lazy Loading。
 */
const OptimizedImage = ({
    src,
    alt,
    width,
    height,
    className = '',
    priority = false, // 是否優先載入 (關閉 lazy load)
    quality = 80,
    resize = 'cover'
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    // 1. 處理 Supabase 圖片優化 URL
    const getOptimizedUrl = (originalUrl) => {
        if (!originalUrl) return '';

        // 如果不是 Supabase 圖片，直接回傳
        if (!originalUrl.includes('supabase.co/storage/v1/object/public/')) {
            return originalUrl;
        }

        // 轉換為 Supabase Render API 格式
        // 原始格式: .../storage/v1/object/public/bucket/path
        // 優化格式: .../storage/v1/render/image/public/bucket/path?width=...&quality=...
        const optimizedUrl = originalUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');

        const params = new URLSearchParams();
        if (width) params.append('width', width.toString());
        if (height) params.append('height', height.toString());
        params.append('quality', quality.toString());
        params.append('format', 'webp'); // 強制轉為 WebP 節省流量
        params.append('resize', resize);

        return `${optimizedUrl}?${params.toString()}`;
    };

    const finalSrc = getOptimizedUrl(src);

    return (
        <div className={`relative overflow-hidden bg-slate-800/50 ${className}`}>
            {/* 模糊背景 (載入中) */}
            {!isLoaded && !error && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-indigo-900/20 to-slate-900/40 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            )}

            {/* 錯誤處理 */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-600 text-xs">
                    無法載入圖像
                </div>
            )}

            {/* 實際圖片 */}
            <img
                src={finalSrc}
                alt={alt}
                loading={priority ? 'eager' : 'lazy'}
                onLoad={() => setIsLoaded(true)}
                onError={() => setError(true)}
                className={`w-full h-full object-cover transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105 blur-sm'
                    }`}
            />
        </div>
    );
};

export default OptimizedImage;
