import React, { useEffect, useState, useRef } from 'react';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number; // delay between letters in ms
  duration?: number; // duration of transition in seconds
  animationFrom?: React.CSSProperties;
  animationTo?: React.CSSProperties;
  textAlign?: React.CSSProperties['textAlign'];
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 20,
  duration = 0.4,
  animationFrom = { opacity: 0, transform: 'translateY(15px)' },
  animationTo = { opacity: 1, transform: 'translateY(0)' },
  textAlign = 'left',
  tag = 'div',
}) => {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Triggers animation when text changes or component renders
  useEffect(() => {
    // Small delay to ensure render is complete
    const timeout = setTimeout(() => {
      setVisible(true);
    }, 50);
    return () => {
      clearTimeout(timeout);
      setVisible(false);
    };
  }, [text]);

  const words = text.split(' ');
  const Tag = tag as React.ElementType;

  return (
    <Tag
      ref={containerRef}
      className={className}
      style={{ textAlign, display: 'inline-block', width: '100%' }}
    >
      {words.map((word, wIdx) => {
        const chars = word.split('');
        return (
          <span
            key={wIdx}
            style={{
              display: 'inline-block',
              marginRight: '0.25em',
              whiteSpace: 'nowrap',
            }}
          >
            {chars.map((char, cIdx) => {
              // Calculate global character index for staggered delay
              const prevWordsLength = words
                .slice(0, wIdx)
                .reduce((acc, w) => acc + w.length, 0);
              const globalIdx = prevWordsLength + cIdx;

              const currentStyle = visible ? animationTo : animationFrom;

              return (
                <span
                  key={cIdx}
                  style={{
                    display: 'inline-block',
                    transition: `opacity ${duration}s cubic-bezier(0.25, 1, 0.5, 1), transform ${duration}s cubic-bezier(0.25, 1, 0.5, 1)`,
                    transitionDelay: `${globalIdx * delay}ms`,
                    ...currentStyle,
                  }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        );
      })}
    </Tag>
  );
};

export default SplitText;
