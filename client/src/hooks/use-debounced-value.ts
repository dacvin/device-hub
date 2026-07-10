import { useEffect, useState } from 'react';

/** Returns `value` delayed by `delayMs`; the latest value wins if it changes again within the window. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => {
      clearTimeout(id);
    };
  }, [value, delayMs]);

  return debounced;
}
