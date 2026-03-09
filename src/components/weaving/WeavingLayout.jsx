import React from 'react';
import WeavingBottomNav from './WeavingBottomNav';
import DataProtectionBanner from './DataProtectionBanner';

/**
 * 🌟 織光頁面佈局容器
 * 提供統一的背景效果、最大寬度限制和底部導航
 */
const WeavingLayout = ({ children, showNav = true, className = '' }) => {
    return (
        <div className={`relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark ${className}`}>
            {/* 背景光暈效果 */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute top-40 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-full h-40 bg-gradient-to-t from-primary/5 to-transparent" />
            </div>

            {/* 💾 資料保護提示 */}
            {showNav && <DataProtectionBanner />}

            {/* 頁面內容 */}
            {children}

            {/* 底部導航 */}
            {showNav && <WeavingBottomNav />}
        </div>
    );
};

export default WeavingLayout;
