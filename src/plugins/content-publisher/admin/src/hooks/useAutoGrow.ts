// hooks/useAutoGrow.ts
//
// Makes a textarea grow with its text and shrink back when it is cleared, like the message
// box in ChatGPT or Claude. Its CSS max-height decides when it stops growing and scrolls.

import { useEffect, useRef } from 'react';

export const useAutoGrow = (text: string) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    box.style.height = 'auto';
    box.style.height = `${box.scrollHeight}px`;
  }, [text]);

  return ref;
};
