"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook that triggers a reveal animation when an element scrolls into view.
 * Returns a ref to attach to the element and a boolean for visibility.
 */
export function useScrollReveal(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(el); // Only trigger once
                }
            },
            { threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return { ref, isVisible };
}

/**
 * Hook for animating a number from 0 to target when visible.
 */
export function useCountUp(target: number, duration = 2000) {
    const [count, setCount] = useState(0);
    const { ref, isVisible } = useScrollReveal(0.3);

    useEffect(() => {
        if (!isVisible) return;

        let startTime: number;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [isVisible, target, duration]);

    return { ref, count };
}

/**
 * Hook for parallax-style scroll offset.
 */
export function useParallax(speed = 0.3) {
    const containerRef = useRef<HTMLDivElement>(null);
    const targetRef = useRef<HTMLDivElement>(null);

    const handleScroll = useCallback(() => {
        if (!containerRef.current || !targetRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const windowH = window.innerHeight;
        // Only calculate when element is near viewport
        if (rect.top < windowH && rect.bottom > 0) {
            const scrolled = (windowH - rect.top) / (windowH + rect.height);
            const offset = (scrolled - 0.5) * speed * 200;
            targetRef.current.style.transform = `translateY(${offset}px)`;
        }
    }, [speed]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial setup
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return { containerRef, targetRef };
}
