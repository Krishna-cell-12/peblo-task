// src/hooks/useDebounce.js
// Returns a debounced value that only updates after the specified delay.
// Used for auto-save: prevents saving on every keystroke.

import { useState, useEffect } from 'react';

export const useDebounce = (value, delay = 1500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
