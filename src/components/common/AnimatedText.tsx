import React, { useEffect, useState } from 'react';

interface AnimatedTextProps {
  text: string;
  className?: string;
  duration?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({ 
  text, 
  className = "",
  duration = 800
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (text !== displayText) {
      setIsAnimating(true);
      
      // 清除文字
      const timeout1 = setTimeout(() => {
        setDisplayText("");
        
        // 添加新文字
        const timeout2 = setTimeout(() => {
          setDisplayText(text);
          setIsAnimating(false);
        }, duration / 2);

        return () => clearTimeout(timeout2);
      }, duration / 2);

      return () => clearTimeout(timeout1);
    }
  }, [text, duration, displayText]);

  return (
    <span className={`inline-block transition-opacity duration-300 ${className} 
                     ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
      {displayText}
    </span>
  );
};

export default AnimatedText;