import { useState, useEffect, useRef, useCallback } from 'react';
import './Shuffle.css';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';

const Shuffle = ({
    text = '',
    tag = 'p',
    className = '',
    style = {},
    shuffleDirection = 'right',
    duration = 0.35,
    shuffleTimes = 1,
    ease = 'power3.out',
    stagger = 0.03,
    triggerOnHover = true,
    loop = false,
    loopDelay = 2000,
    textAlign = 'center'
}) => {
    const [displayText, setDisplayText] = useState(text);
    const [isAnimating, setIsAnimating] = useState(false);
    const intervalRef = useRef(null);
    const animatedRef = useRef(false);

    const scramble = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);

        const original = text;
        const totalDuration = (duration * 1000) + (original.length * stagger * 1000);
        const iterations = Math.max(shuffleTimes * 3, 5);
        let currentIteration = 0;

        intervalRef.current = setInterval(() => {
            currentIteration++;
            const progress = currentIteration / iterations;

            const newText = original
                .split('')
                .map((char, index) => {
                    if (char === ' ') return ' ';
                    // Characters resolve left-to-right based on progress
                    const charThreshold = index / original.length;
                    if (progress > charThreshold + 0.5) return char;
                    return CHARS[Math.floor(Math.random() * CHARS.length)];
                })
                .join('');

            setDisplayText(newText);

            if (currentIteration >= iterations) {
                clearInterval(intervalRef.current);
                setDisplayText(original);
                setIsAnimating(false);
            }
        }, totalDuration / iterations);
    }, [text, duration, stagger, shuffleTimes, isAnimating]);

    // Initial animation on mount
    useEffect(() => {
        if (!animatedRef.current) {
            animatedRef.current = true;
            // Start with scrambled text
            const scrambled = text.split('').map(c => c === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
            setDisplayText(scrambled);
            const timer = setTimeout(() => scramble(), 300);
            return () => clearTimeout(timer);
        }
    }, []);

    // Loop effect
    useEffect(() => {
        if (!loop) return;
        const loopInterval = setInterval(() => {
            scramble();
        }, (duration * 1000) + loopDelay + 500);
        return () => clearInterval(loopInterval);
    }, [loop, loopDelay, duration, scramble]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const Tag = tag;
    return (
        <Tag
            className={`shuffle-parent is-ready ${className}`}
            style={{ textAlign, cursor: triggerOnHover ? 'pointer' : 'default', ...style }}
            onMouseEnter={triggerOnHover ? scramble : undefined}
        >
            {displayText}
        </Tag>
    );
};

export default Shuffle;
