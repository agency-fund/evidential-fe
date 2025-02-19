import { useEffect } from 'react';

export const useCustomEventListener = (eventName: string, handler: () => void) => {
  useEffect(() => {
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [eventName, handler]);
};
