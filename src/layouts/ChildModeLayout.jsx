import React from 'react';
import { ChildModeProvider } from '../context/ChildModeContext';

/**
 * 🧱 ChildModeLayout - 兒童模式隔離容器
 * =====================================
 * 功能：
 * 1. 提供獨立的視覺環境（馬卡龍配色、圓體字）
 * 2. 隔離所有樣式，不汙染其他模式
 * 3. 包含 ChildModeProvider，確保 Context 只在此範圍內有效
 * 
 * 🚫 ZERO BODY MODIFICATION:
 * - 絕不修改全域 body 或 html 的背景色
 * - 使用獨立的背景容器，Unmount 時自動清除
 * 
 * CSS Scoping:
 * - 所有樣式包覆在 #child-universe-root 內
 */

// 字型設定 - 需要在 index.html 或 CSS 中載入 Google Fonts
const CHILD_MODE_FONTS = `'Zen Maru Gothic', 'Kiwi Maru', 'YuanTi TC', 'PingFang TC', sans-serif`;

// 色彩設定
const COLORS = {
    background: '#FEF9E7',      // 米黃色護眼紙張
    backgroundAlt: '#E0F7FA',   // 淡天藍（備用）
    text: '#4A403A',            // 溫暖深巧克力色
    textLight: '#6B5B50',       // 淺一點的文字色

    // 馬卡龍色系
    peach: '#FFB7B2',           // 蜜桃粉
    mint: '#B5EAD7',            // 薄荷綠
    violet: '#C7CEEA',          // 淡紫羅蘭
    yellow: '#FFEAA7',          // 檸檬黃
    sky: '#A8D8EA',             // 天空藍
};

const ChildModeLayout = ({ children }) => {
    return (
        <ChildModeProvider>
            {/* 主容器 - 所有樣式隔離在此 */}
            <div
                id="child-universe-root"
                className="cm-wrapper"
                style={{
                    fontFamily: CHILD_MODE_FONTS,
                    minHeight: '100vh',
                    position: 'relative',
                }}
            >
                {/* 🎨 獨立背景層 - Unmount 時自動消失 */}
                <div
                    id="child-universe-background"
                    className="fixed inset-0 -z-10 transition-colors duration-300"
                    style={{ backgroundColor: COLORS.background }}
                >
                    {/* 紙張紋理疊加 */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
                        }}
                    />

                    {/* 漂浮的裝飾元素 */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {/* 漂浮雲朵 1 */}
                        <div
                            className="absolute animate-float-slow"
                            style={{
                                top: '10%',
                                left: '5%',
                                width: '120px',
                                height: '60px',
                                borderRadius: '60px',
                                background: 'rgba(255, 255, 255, 0.6)',
                                boxShadow: `
                  40px -15px 0 0 rgba(255, 255, 255, 0.5),
                  -30px -10px 0 -5px rgba(255, 255, 255, 0.4)
                `,
                            }}
                        />

                        {/* 漂浮雲朵 2 */}
                        <div
                            className="absolute animate-float-medium"
                            style={{
                                top: '25%',
                                right: '10%',
                                width: '100px',
                                height: '50px',
                                borderRadius: '50px',
                                background: 'rgba(255, 255, 255, 0.5)',
                                boxShadow: `
                  30px -12px 0 0 rgba(255, 255, 255, 0.4),
                  -25px -8px 0 -5px rgba(255, 255, 255, 0.3)
                `,
                            }}
                        />

                        {/* 小星星裝飾 */}
                        <div className="absolute top-20 right-1/4 text-4xl opacity-30 animate-twinkle">✦</div>
                        <div className="absolute top-40 left-1/4 text-2xl opacity-20 animate-twinkle-delay">✧</div>
                        <div className="absolute bottom-1/3 right-1/3 text-3xl opacity-25 animate-twinkle">✦</div>
                    </div>
                </div>

                {/* 🎯 主內容區 */}
                <div className="relative z-10">
                    {children}
                </div>

                {/* 📝 隔離樣式 - 只在 child-universe-root 內生效 */}
                <style>{`
          /* === 基礎樣式 === */
          #child-universe-root {
            color: ${COLORS.text};
            line-height: 2;
          }
          
          #child-universe-root * {
            box-sizing: border-box;
          }
          
          /* === 動畫定義 === */
          @keyframes float-slow {
            0%, 100% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-15px) translateX(10px); }
          }
          
          @keyframes float-medium {
            0%, 100% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-10px) translateX(-5px); }
          }
          
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.2); }
          }
          
          @keyframes twinkle-delay {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
          }
          
          .animate-float-slow {
            animation: float-slow 8s ease-in-out infinite;
          }
          
          .animate-float-medium {
            animation: float-medium 6s ease-in-out infinite;
            animation-delay: 1s;
          }
          
          .animate-twinkle {
            animation: twinkle 3s ease-in-out infinite;
          }
          
          .animate-twinkle-delay {
            animation: twinkle-delay 3s ease-in-out infinite;
            animation-delay: 1.5s;
          }
          
          /* === Ruby 注音樣式 === */
          #child-universe-root ruby {
            ruby-position: over;
          }
          
          #child-universe-root rt {
            font-size: 0.5em;
            color: ${COLORS.textLight};
            opacity: 0.8;
            font-family: inherit;
          }
          
          /* 注音隱藏時保留高度 */
          #child-universe-root rt.cm-hidden {
            opacity: 0 !important;
            user-select: none;
            pointer-events: none;
          }
          
          /* 可點擊狀態的漢字 */
          #child-universe-root .cm-char-tappable {
            border-bottom: 2px dashed rgba(74, 64, 58, 0.3);
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          #child-universe-root .cm-char-tappable:hover {
            background: rgba(181, 234, 215, 0.3);
            border-bottom-color: ${COLORS.mint};
          }
          
          /* === 按鈕基礎樣式 === */
          #child-universe-root .cm-btn {
            padding: 16px 32px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 1.125rem;
            border: 4px solid rgba(74, 64, 58, 0.2);
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          }
          
          #child-universe-root .cm-btn:hover {
            transform: scale(1.05);
          }
          
          #child-universe-root .cm-btn:active {
            transform: scale(0.98);
          }
          
          #child-universe-root .cm-btn-peach {
            background: ${COLORS.peach};
            color: ${COLORS.text};
          }
          
          #child-universe-root .cm-btn-mint {
            background: ${COLORS.mint};
            color: ${COLORS.text};
          }
          
          #child-universe-root .cm-btn-violet {
            background: ${COLORS.violet};
            color: ${COLORS.text};
          }
          
          #child-universe-root .cm-btn-yellow {
            background: ${COLORS.yellow};
            color: ${COLORS.text};
          }
          
          /* === 卡片樣式 === */
          #child-universe-root .cm-card {
            background: rgba(255, 255, 255, 0.85);
            border: 4px solid rgba(74, 64, 58, 0.15);
            border-radius: 2rem;
            padding: 2rem;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          }
          
          /* === 字體大小變體 === */
          #child-universe-root.cm-font-medium {
            font-size: 1rem;
          }
          
          #child-universe-root.cm-font-large {
            font-size: 1.25rem;
          }
          
          #child-universe-root.cm-font-xlarge {
            font-size: 1.5rem;
          }
        `}</style>
            </div>
        </ChildModeProvider>
    );
};

export default ChildModeLayout;
