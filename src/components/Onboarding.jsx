import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronLeft, X, Sparkles, Check, GripHorizontal } from 'lucide-react';

/**
 * Onboarding 新手導覽系統 v3
 * -------------------------
 * 功能：
 * 1. Spotlight 高亮目標元素
 * 2. 目標元素發光效果 (Glow)
 * 3. Tooltip 智慧定位 + 可拖曳移動
 * 4. 進度指示器
 * 5. localStorage 記錄完成狀態
 */

// 預設導覽步驟 (Creator 頁面專用)
const CREATOR_ONBOARDING_STEPS = [
    {
        id: 'welcome',
        target: null,
        title: '🌌 歡迎來到創作工作室！',
        content: '這是您的星際創作基地。讓我帶您快速了解如何開始您的第一個故事。',
        position: 'center',
    },
    {
        id: 'title',
        target: '[data-onboarding="title-input"]',
        title: '📝 故事標題',
        content: '在這裡輸入您故事的標題。一個好的標題能吸引更多讀者！',
        position: 'bottom',
    },
    {
        id: 'mode-switch',
        target: '[data-onboarding="mode-switch"]',
        title: '🎨 創作模式',
        content: '選擇「分頁製作」手動編輯，或「AI 全自動」讓 AI 幫您生成完整故事。',
        position: 'right',
    },
    {
        id: 'canvas',
        target: '[data-onboarding="canvas"]',
        title: '🖼️ 視覺畫布',
        content: '這是您的封面展示區。可以上傳圖片，或點擊右下角讓 AI 幫您生成場景！',
        position: 'top',
    },
    {
        id: 'text-editor',
        target: '[data-onboarding="text-editor"]',
        title: '✍️ 內容編輯',
        content: '在這裡撰寫故事內容。支援語音輸入，點擊麥克風圖示即可開始說話。',
        position: 'top',
    },
    {
        id: 'save-button',
        target: '[data-onboarding="save-button"]',
        title: '💾 封存作品',
        content: '完成後點擊這裡封存您的作品。登入用戶可同步到雲端，訪客則儲存在本地。',
        position: 'bottom',
    },
    {
        id: 'complete',
        target: null,
        title: '🎉 準備就緒！',
        content: '您已經了解基本操作了！現在開始創作您的第一個故事吧。祝您靈感源源不絕！',
        position: 'center',
    },
];

// Onboarding Context
const OnboardingContext = React.createContext(null);

export const useOnboarding = () => {
    const context = React.useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within OnboardingProvider');
    }
    return context;
};

// Onboarding Provider
export const OnboardingProvider = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState(CREATOR_ONBOARDING_STEPS);

    const hasCompletedOnboarding = useCallback((key = 'creator') => {
        return localStorage.getItem(`onboarding_${key}_completed`) === 'true';
    }, []);

    const markAsCompleted = useCallback((key = 'creator') => {
        localStorage.setItem(`onboarding_${key}_completed`, 'true');
    }, []);

    const startOnboarding = useCallback((customSteps = null) => {
        if (customSteps) {
            setSteps(customSteps);
        }
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    const endOnboarding = useCallback((markComplete = true) => {
        setIsActive(false);
        if (markComplete) {
            markAsCompleted('creator');
        }
    }, [markAsCompleted]);

    const nextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            endOnboarding(true);
        }
    }, [currentStep, steps.length, endOnboarding]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const goToStep = useCallback((index) => {
        if (index >= 0 && index < steps.length) {
            setCurrentStep(index);
        }
    }, [steps.length]);

    const value = {
        isActive,
        currentStep,
        steps,
        hasCompletedOnboarding,
        startOnboarding,
        endOnboarding,
        nextStep,
        prevStep,
        goToStep,
    };

    return (
        <OnboardingContext.Provider value={value}>
            {children}
            {isActive && <OnboardingOverlay />}
        </OnboardingContext.Provider>
    );
};

// Spotlight 遮罩層
const OnboardingOverlay = () => {
    const { currentStep, steps, nextStep, prevStep, endOnboarding } = useOnboarding();
    const [targetRect, setTargetRect] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const tooltipRef = useRef(null);
    const step = steps[currentStep];

    // 拖曳開始
    const handleDragStart = (e) => {
        e.preventDefault();
        if (tooltipRef.current) {
            const rect = tooltipRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
            setIsDragging(true);
        }
    };

    // 拖曳中
    const handleDragMove = useCallback((e) => {
        if (isDragging) {
            const newLeft = e.clientX - dragOffset.x;
            const newTop = e.clientY - dragOffset.y;
            setTooltipPosition({
                left: Math.max(10, Math.min(window.innerWidth - 360, newLeft)),
                top: Math.max(10, Math.min(window.innerHeight - 280, newTop)),
            });
        }
    }, [isDragging, dragOffset]);

    // 拖曳結束
    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // 加入全域事件監聽
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleDragMove);
                window.removeEventListener('mouseup', handleDragEnd);
            };
        }
    }, [isDragging, handleDragMove, handleDragEnd]);

    // 計算目標元素位置並添加高亮效果
    useEffect(() => {
        if (!step.target) {
            setTargetRect(null);
            // 置中顯示
            setTooltipPosition({
                top: window.innerHeight / 2 - 140,
                left: window.innerWidth / 2 - 180,
            });
            return;
        }

        const element = document.querySelector(step.target);
        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect({
                top: rect.top - 8,
                left: rect.left - 8,
                width: rect.width + 16,
                height: rect.height + 16,
            });

            // 為目標元素添加發光 class
            element.classList.add('onboarding-highlight');

            // 滾動到可見區域
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // 智慧計算 Tooltip 初始位置
            const tooltipWidth = 360;
            const tooltipHeight = 280;
            const padding = 24;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let top, left;

            switch (step.position) {
                case 'bottom':
                    top = rect.bottom + padding;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    break;
                case 'top':
                    top = rect.top - tooltipHeight - padding;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.left - tooltipWidth - padding;
                    break;
                case 'right':
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.right + padding;
                    break;
                default:
                    top = viewportHeight / 2 - tooltipHeight / 2;
                    left = viewportWidth / 2 - tooltipWidth / 2;
            }

            // 邊界修正
            if (left < padding) left = padding;
            if (left + tooltipWidth > viewportWidth - padding) left = viewportWidth - tooltipWidth - padding;
            if (top < padding) top = padding;
            if (top + tooltipHeight > viewportHeight - padding) top = viewportHeight - tooltipHeight - padding;

            setTooltipPosition({ top, left });

            return () => {
                element.classList.remove('onboarding-highlight');
            };
        } else {
            setTargetRect(null);
        }
    }, [step.target, step.position, currentStep]);

    return createPortal(
        <div className="fixed inset-0 z-[9999]">
            {/* 全域發光樣式 */}
            <style>{`
        .onboarding-highlight {
          position: relative;
          z-index: 10000 !important;
          animation: onboarding-glow 1.5s ease-in-out infinite alternate;
          box-shadow: 0 0 20px 5px rgba(99, 102, 241, 0.6), 
                      0 0 40px 10px rgba(99, 102, 241, 0.4),
                      0 0 60px 15px rgba(99, 102, 241, 0.2) !important;
          border-color: rgba(99, 102, 241, 0.8) !important;
        }
        
        @keyframes onboarding-glow {
          0% {
            box-shadow: 0 0 20px 5px rgba(99, 102, 241, 0.6), 
                        0 0 40px 10px rgba(99, 102, 241, 0.4),
                        0 0 60px 15px rgba(99, 102, 241, 0.2);
          }
          100% {
            box-shadow: 0 0 30px 10px rgba(99, 102, 241, 0.8), 
                        0 0 60px 20px rgba(99, 102, 241, 0.5),
                        0 0 90px 30px rgba(99, 102, 241, 0.3);
          }
        }
      `}</style>

            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/70 transition-all duration-500"
                onClick={() => endOnboarding(false)}
            />

            {/* Spotlight 挖空區域 */}
            {targetRect && (
                <div
                    className="absolute rounded-2xl transition-all duration-300 pointer-events-none"
                    style={{
                        top: targetRect.top,
                        left: targetRect.left,
                        width: targetRect.width,
                        height: targetRect.height,
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
                    }}
                />
            )}

            {/* Tooltip 卡片 (可拖曳) */}
            <div
                ref={tooltipRef}
                className={`w-[360px] bg-gradient-to-br from-[#1a1b26] to-[#13141c] border-2 border-indigo-500/50 rounded-2xl shadow-2xl shadow-indigo-500/30 ${isDragging ? 'cursor-grabbing' : ''}`}
                style={{
                    position: 'fixed',
                    top: `${tooltipPosition.top}px`,
                    left: `${tooltipPosition.left}px`,
                    userSelect: 'none',
                }}
            >
                {/* 發光邊框效果 */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 blur-xl -z-10" />

                {/* 可拖曳的標題區 */}
                <div
                    onMouseDown={handleDragStart}
                    className="flex items-center justify-between p-4 border-b border-white/10 cursor-grab rounded-t-2xl hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <GripHorizontal size={16} className="text-slate-500" />
                        <span className="text-xs text-slate-500 uppercase tracking-wider">可拖曳移動</span>
                    </div>
                    <button
                        onClick={() => endOnboarding(false)}
                        className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* 內容區 */}
                <div className="p-6">
                    {/* 標題 */}
                    <h3 className="text-2xl font-bold text-white mb-4">
                        {step.title}
                    </h3>

                    {/* 內容 */}
                    <p className="text-slate-300 text-base leading-relaxed mb-6">
                        {step.content}
                    </p>

                    {/* 進度指示器 */}
                    <div className="flex items-center gap-2 mb-5">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep
                                        ? 'bg-indigo-500 w-8'
                                        : i < currentStep
                                            ? 'bg-indigo-500/50 w-3'
                                            : 'bg-slate-700 w-3'
                                    }`}
                            />
                        ))}
                        <span className="ml-auto text-xs text-slate-500">
                            {currentStep + 1} / {steps.length}
                        </span>
                    </div>

                    {/* 導航按鈕 */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className="flex items-center gap-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-xl hover:bg-white/5"
                        >
                            <ChevronLeft size={18} />
                            上一步
                        </button>

                        <button
                            onClick={nextStep}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-105"
                        >
                            {currentStep === steps.length - 1 ? (
                                <>
                                    <Check size={18} />
                                    開始創作
                                </>
                            ) : (
                                <>
                                    下一步
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// 觸發導覽的按鈕元件
export const OnboardingTrigger = ({ className = '' }) => {
    const { startOnboarding, hasCompletedOnboarding } = useOnboarding();

    return (
        <button
            onClick={() => startOnboarding()}
            className={`flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl hover:bg-indigo-500/30 transition-all ${className}`}
        >
            <Sparkles size={16} />
            {hasCompletedOnboarding() ? '重新檢視導覽' : '開始新手導覽'}
        </button>
    );
};

export default OnboardingProvider;
