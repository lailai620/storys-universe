import React from 'react';

/**
 * ♿ SkipToContent - 跳過導航連結
 * ================================
 * 讓使用螢幕閱讀器或鍵盤導航的用戶
 * 可以快速跳過重複的導航區塊，直接進入主要內容
 * 
 * 使用方式：
 * 1. 在 App.jsx 最上方加入 <SkipToContent />
 * 2. 在主要內容區塊加入 id="main-content"
 */

const SkipToContent = ({ targetId = 'main-content' }) => {
    return (
        <a
            href={`#${targetId}`}
            className="
        sr-only focus:not-sr-only
        fixed top-4 left-4 z-[9999]
        px-6 py-3
        bg-indigo-600 text-white font-bold
        rounded-lg shadow-lg
        focus:outline-none focus:ring-4 focus:ring-indigo-400
        transition-all
      "
        >
            跳至主要內容
        </a>
    );
};

export default SkipToContent;
