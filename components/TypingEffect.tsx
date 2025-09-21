import React, { useState, useEffect } from 'react';

interface TypingEffectProps {
    text: string;
    speed?: number;
    onComplete?: () => void;
    className?: string;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ text, speed = 70, onComplete, className }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        setDisplayedText('');
        setShowCursor(true);
        
        if (text) {
            let i = 0;
            const intervalId = setInterval(() => {
                if (i < text.length) {
                    setDisplayedText(prev => prev + text.charAt(i));
                    i++;
                } else {
                    clearInterval(intervalId);
                    // Keep cursor blinking for a moment before hiding it
                    setTimeout(() => {
                        setShowCursor(false);
                        if (onComplete) {
                            onComplete();
                        }
                    }, 500);
                }
            }, speed);

            return () => clearInterval(intervalId);
        }
    }, [text, speed, onComplete]);

    return (
        <span className={className}>
            {displayedText}
            {showCursor && <span className="inline-block w-0.5 h-[1em] bg-current align-text-bottom animate-cursorBlink"></span>}
        </span>
    );
};

export default TypingEffect;
