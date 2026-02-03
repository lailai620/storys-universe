import React from 'react';
import { useChildMode } from '../../context/ChildModeContext';

/**
 * 👓 MagicGlassesButton - 魔法眼鏡切換按鈕
 * ========================================
 * 功能：
 * 1. 切換注音顯示（開/關）
 * 2. 視覺狀態明確區分
 * 3. 固定位置，浮動在畫面右上角
 * 
 * 視覺設計：
 * - ON: 蜜桃粉背景 + 發光效果 + 實心眼鏡圖示
 * - OFF: 淡天藍背景 + 無發光 + 空心眼鏡圖示
 */

// 眼鏡 SVG 圖示
const GlassesIcon = ({ filled = false, size = 32 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {/* 左鏡片 */}
        <circle
            cx="6"
            cy="12"
            r="4"
            fill={filled ? 'currentColor' : 'none'}
            opacity={filled ? 0.3 : 1}
        />
        {/* 右鏡片 */}
        <circle
            cx="18"
            cy="12"
            r="4"
            fill={filled ? 'currentColor' : 'none'}
            opacity={filled ? 0.3 : 1}
        />
        {/* 鏡橋 */}
        <path d="M10 12h4" />
        {/* 左鏡腿 */}
        <path d="M2 12h0" />
        {/* 右鏡腿 */}
        <path d="M22 12h0" />
        {/* 發光效果（開啟時） */}
        {filled && (
            <>
                <circle cx="6" cy="12" r="3" fill="currentColor" opacity="0.5" />
                <circle cx="18" cy="12" r="3" fill="currentColor" opacity="0.5" />
            </>
        )}
    </svg>
);

const MagicGlassesButton = ({
    position = 'fixed',  // 'fixed' | 'absolute' | 'relative'
    className = '',
}) => {
    const { isGlassesOn, toggleGlasses, isChildModeActive } = useChildMode();

    // 如果不在兒童模式內，不渲染
    if (!isChildModeActive) return null;

    return (
        <button
            onClick={toggleGlasses}
            className={`
        ${position === 'fixed' ? 'fixed top-6 right-6' : ''}
        ${position === 'absolute' ? 'absolute top-4 right-4' : ''}
        z-50
        flex items-center justify-center gap-3
        px-6 py-4
        rounded-full
        font-bold text-lg
        border-4
        transition-all duration-300 ease-out
        cursor-pointer
        ${isGlassesOn
                    ? 'bg-[#FFB7B2] border-[#4A403A]/30 text-[#4A403A] shadow-[0_0_25px_rgba(255,183,178,0.6)]'
                    : 'bg-[#E0F7FA] border-[#4A403A]/20 text-[#4A403A] shadow-lg'
                }
        hover:scale-105
        active:scale-98
        ${className}
      `}
            style={{ fontFamily: 'inherit' }}
            aria-label={isGlassesOn ? '關閉注音' : '開啟注音'}
            aria-pressed={isGlassesOn}
        >
            <GlassesIcon filled={isGlassesOn} size={28} />
            <span className="hidden sm:inline">
                {isGlassesOn ? '關閉注音' : '開啟注音'}
            </span>

            {/* 發光動畫（開啟時） */}
            {isGlassesOn && (
                <span
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                        background: 'radial-gradient(circle, rgba(255,183,178,0.4) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }}
                />
            )}
        </button>
    );
};

export default MagicGlassesButton;
