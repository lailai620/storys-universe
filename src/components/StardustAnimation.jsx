import React, { useEffect, useState } from 'react';

/**
 * 星塵消費動畫組件
 * 當觸發 AI 功能時，顯示星塵從餘額飛向中心的粒子動畫
 */
const StardustAnimation = ({ isActive, onComplete }) => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (!isActive) {
            setParticles([]);
            return;
        }

        // 創建粒子
        const newParticles = Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 6 + 2,
            delay: Math.random() * 0.5,
            duration: 1 + Math.random() * 0.5,
        }));

        setParticles(newParticles);

        // 動畫結束後清除
        const timer = setTimeout(() => {
            setParticles([]);
            if (onComplete) onComplete();
        }, 2000);

        return () => clearTimeout(timer);
    }, [isActive, onComplete]);

    if (!isActive && particles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
            {/* 中心光暈 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 rounded-full bg-amber-500/30 blur-3xl animate-pulse" />
                <div className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 opacity-50 blur-xl animate-ping" />
            </div>

            {/* 粒子 */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                    style={{
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        animation: `stardustFly ${p.duration}s ease-in ${p.delay}s forwards`,
                    }}
                />
            ))}

            {/* CSS 動畫 */}
            <style>{`
                @keyframes stardustFly {
                    0% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    100% {
                        opacity: 0;
                        left: 50%;
                        top: 50%;
                        transform: scale(0.3);
                    }
                }
            `}</style>
        </div>
    );
};

export default StardustAnimation;
