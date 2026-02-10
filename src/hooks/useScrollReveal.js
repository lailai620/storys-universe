import { useEffect, useRef, useState } from 'react';

/**
 * 🌊 Scroll Reveal Hook
 * 使用 IntersectionObserver 偵測元素進入視窗
 * 回傳 ref 和 isVisible 狀態
 */
export const useScrollReveal = (options = {}) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // 尊重 prefers-reduced-motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (triggerOnce) {
                        observer.unobserve(element);
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold, rootMargin, triggerOnce]);

    return [ref, isVisible];
};

export default useScrollReveal;
