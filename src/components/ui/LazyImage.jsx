/**
 * 🖼️ LazyImage — 圖片延遲載入 + 漸入動畫
 * 使用 Intersection Observer 和 native loading="lazy"
 */
import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({
    src,
    alt,
    className = '',
    width,
    height,
    placeholder = 'blur',   // 'blur' | 'color' | 'none'
    placeholderColor = '#e5e7eb',
    onLoad,
    onError,
    ...props
}) => {
    const [loaded, setLoaded] = useState(false);
    const [inView, setInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        if (!imgRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' } // 提前 200px 開始載入
        );

        observer.observe(imgRef.current);
        return () => observer.disconnect();
    }, []);

    const handleLoad = (e) => {
        setLoaded(true);
        onLoad?.(e);
    };

    const handleError = (e) => {
        setHasError(true);
        onError?.(e);
    };

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${className}`}
            style={{
                width: width ? `${width}px` : undefined,
                height: height ? `${height}px` : undefined,
                backgroundColor: !loaded ? placeholderColor : undefined,
            }}
            role="img"
            aria-label={alt}
        >
            {inView && !hasError && (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    {...props}
                />
            )}

            {/* 載入中的脈動動畫 */}
            {!loaded && !hasError && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
            )}

            {/* 圖片載入失敗 */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-light dark:bg-surface-dark">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark text-xs">
                        📷 無法載入圖片
                    </span>
                </div>
            )}
        </div>
    );
};

export default LazyImage;
