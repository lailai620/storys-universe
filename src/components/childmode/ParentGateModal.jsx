import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * 🛡️ ParentGateModal - 家長閘門（長按解鎖）
 * =========================================
 * 功能：
 * 1. 防止兒童誤觸離開兒童模式
 * 2. 需長按 3 秒才能解鎖並離開
 * 3. 視覺化的進度條圍繞鎖頭圖示
 * 
 * 實作規範：
 * - 使用 Portal 時指定 target 為 #child-universe-root
 * - 嚴禁直接掛載到 document.body
 */

// 長按所需時間（毫秒）
const HOLD_DURATION = 3000;

// 鎖頭 SVG 圖示
const LockIcon = ({ size = 48, unlocked = false }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
    >
        {unlocked ? (
            // 解鎖狀態
            <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </>
        ) : (
            // 鎖定狀態
            <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </>
        )}
    </svg>
);

// 圓形進度條 SVG
const CircleProgress = ({ progress, size = 120, strokeWidth = 6 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg
            width={size}
            height={size}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90"
        >
            {/* 背景圓 */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(74, 64, 58, 0.2)"
                strokeWidth={strokeWidth}
            />
            {/* 進度圓 */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#B5EAD7"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-100 ease-out"
                style={{
                    filter: progress > 0 ? 'drop-shadow(0 0 8px rgba(181, 234, 215, 0.8))' : 'none',
                }}
            />
        </svg>
    );
};

const ParentGateModal = ({
    isOpen,
    onClose,
    onUnlock,
    title = '需要家長協助',
    message = '長按下方按鈕 3 秒離開兒童模式',
}) => {
    const [progress, setProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);

    const timerRef = useRef(null);
    const startTimeRef = useRef(null);
    const animationRef = useRef(null);

    // 開始長按
    const handlePressStart = useCallback(() => {
        setIsHolding(true);
        startTimeRef.current = Date.now();

        const updateProgress = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
            setProgress(newProgress);

            if (newProgress >= 100) {
                // 解鎖成功
                setIsUnlocked(true);
                setIsHolding(false);

                // 延遲執行回調，讓動畫完成
                timerRef.current = setTimeout(() => {
                    onUnlock?.();
                }, 500);
            } else {
                animationRef.current = requestAnimationFrame(updateProgress);
            }
        };

        animationRef.current = requestAnimationFrame(updateProgress);
    }, [onUnlock]);

    // 結束長按
    const handlePressEnd = useCallback(() => {
        setIsHolding(false);

        // 取消動畫
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        // 未完成時重置進度
        if (progress < 100) {
            setProgress(0);
        }
    }, [progress]);

    // 清理
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    // 重置狀態（Modal 關閉時）
    useEffect(() => {
        if (!isOpen) {
            setProgress(0);
            setIsHolding(false);
            setIsUnlocked(false);
        }
    }, [isOpen]);

    // 如果未開啟，不渲染
    if (!isOpen) return null;

    // 嘗試找到兒童模式容器
    const container = typeof document !== 'undefined'
        ? document.getElementById('child-universe-root') || document.body
        : null;

    if (!container) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ fontFamily: 'inherit' }}
        >
            {/* 毛玻璃背景 */}
            <div
                className="absolute inset-0 bg-[#FEF9E7]/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal 內容 */}
            <div className="relative z-10 max-w-sm w-full mx-4">
                {/* 卡片 */}
                <div className="cm-card text-center">
                    {/* 標題 */}
                    <h2
                        className="text-2xl font-bold mb-2"
                        style={{ color: '#4A403A' }}
                    >
                        {title}
                    </h2>

                    {/* 說明文字 */}
                    <p
                        className="text-lg mb-8 opacity-80"
                        style={{ color: '#6B5B50' }}
                    >
                        {message}
                    </p>

                    {/* 長按解鎖區域 */}
                    <div className="flex flex-col items-center gap-6">
                        {/* 鎖頭與進度條 */}
                        <div
                            className={`
                relative w-32 h-32 
                flex items-center justify-center 
                rounded-full 
                transition-all duration-300
                cursor-pointer
                select-none
                ${isHolding ? 'bg-[#B5EAD7]/30' : 'bg-[#4A403A]/10'}
                ${isUnlocked ? 'bg-[#B5EAD7]/50 scale-110' : ''}
              `}
                            onMouseDown={handlePressStart}
                            onMouseUp={handlePressEnd}
                            onMouseLeave={handlePressEnd}
                            onTouchStart={handlePressStart}
                            onTouchEnd={handlePressEnd}
                            role="button"
                            aria-label="長按解鎖"
                        >
                            {/* 進度圓環 */}
                            <CircleProgress progress={progress} />

                            {/* 鎖頭圖示 */}
                            <div
                                className={`
                  relative z-10 
                  transition-all duration-300
                  ${isUnlocked ? 'text-[#B5EAD7]' : 'text-[#4A403A]'}
                  ${isHolding ? 'scale-110' : ''}
                `}
                            >
                                <LockIcon size={48} unlocked={isUnlocked} />
                            </div>
                        </div>

                        {/* 提示文字 */}
                        <p
                            className="text-sm opacity-60"
                            style={{ color: '#4A403A' }}
                        >
                            {isUnlocked ? '✓ 已解鎖！' : isHolding ? '繼續按住...' : '按住鎖頭不放'}
                        </p>
                    </div>

                    {/* 取消按鈕 */}
                    <button
                        onClick={onClose}
                        className="
              mt-8 px-8 py-3 
              rounded-full 
              font-bold text-lg
              bg-white/50 
              border-2 border-[#4A403A]/20
              text-[#4A403A]
              hover:bg-white/80
              transition-all duration-200
            "
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>,
        container
    );
};

export default ParentGateModal;
