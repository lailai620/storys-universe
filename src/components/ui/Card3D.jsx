import React, { useRef, useState } from 'react';

/**
 * 🃏 Card3D - 3D 傾斜效果卡片包裝元件
 * =====================================
 * 滑鼠移動時產生 3D 傾斜效果，提升視覺吸引力
 * 
 * 使用方式：
 * <Card3D>
 *   <YourCardContent />
 * </Card3D>
 */

const Card3D = ({
    children,
    className = '',
    intensity = 10, // 傾斜強度 (度)
    glare = true,   // 是否顯示光暈
    scale = 1.02,   // hover 時縮放
    ...props
}) => {
    const cardRef = useRef(null);
    const [transform, setTransform] = useState('');
    const [glareStyle, setGlareStyle] = useState({});

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // 計算滑鼠相對於卡片中心的位置 (-1 到 1)
        const percentX = (e.clientX - centerX) / (rect.width / 2);
        const percentY = (e.clientY - centerY) / (rect.height / 2);

        // 計算旋轉角度 (注意：X 軸旋轉對應 Y 位移，Y 軸旋轉對應 X 位移)
        const rotateX = -percentY * intensity;
        const rotateY = percentX * intensity;

        setTransform(
            `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
        );

        // 光暈效果
        if (glare) {
            const glareX = 50 + percentX * 30;
            const glareY = 50 + percentY * 30;
            setGlareStyle({
                background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
                opacity: 1,
            });
        }
    };

    const handleMouseLeave = () => {
        setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
        setGlareStyle({ opacity: 0 });
    };

    return (
        <div
            ref={cardRef}
            className={`relative transition-transform duration-300 ease-out ${className}`}
            style={{ transform, transformStyle: 'preserve-3d' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {children}

            {/* 光暈層 */}
            {glare && (
                <div
                    className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300 z-20"
                    style={glareStyle}
                />
            )}
        </div>
    );
};

export default Card3D;
