import { useState, useEffect } from 'react';

const CHARS = '!<>-_\\/[]{}—=+*^?#________';

export default function ScrambleText({ text, as: Component = 'span', className = '' }) {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    let iteration = 0;
    let interval = null;

    interval = setInterval(() => {
      setDisplayText(text.split('').map((letter, index) => {
        if (index < iteration) {
          return text[index];
        }
        if (text[index] === ' ') {
          return ' ';
        }
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join(''));

      if (iteration >= text.length) {
        clearInterval(interval);
      }
      
      iteration += 1 / 3;
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return <Component className={className}>{displayText}</Component>;
}
