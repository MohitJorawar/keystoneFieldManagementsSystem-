import React, { useState, useEffect } from 'react';

interface TextTypeProps {
  text: string;
  className?: string;
  typingSpeed?: number;
  initialDelay?: number;
  showCursor?: boolean;
  cursorCharacter?: string;
  as?: React.ElementType;
}

export const TextType: React.FC<TextTypeProps> = ({
  text,
  className = '',
  typingSpeed = 25,
  initialDelay = 100,
  showCursor = true,
  cursorCharacter = '|',
  as: Component = 'div',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setIndex(0);
    setStarted(false);
  }, [text]);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, initialDelay);
    return () => clearTimeout(startTimeout);
  }, [initialDelay, text]);

  useEffect(() => {
    if (!started) return;
    if (index >= text.length) return;

    const timeout = setTimeout(() => {
      setDisplayedText((prev) => prev + text[index]);
      setIndex((prev) => prev + 1);
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [index, started, text, typingSpeed]);

  return (
    <Component className={className}>
      <span>{displayedText}</span>
      {showCursor && index < text.length && (
        <span
          className="text-type__cursor"
          style={{
            animation: 'cursor-blink 0.8s infinite',
            marginLeft: '2px',
            display: 'inline-block',
          }}
        >
          {cursorCharacter}
        </span>
      )}
    </Component>
  );
};

export default TextType;
