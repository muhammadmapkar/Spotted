import { useEffect, useState } from 'react';

import { COUNT_EVERY_MS, nextCount } from './profileData';

// The savings number: counts up from 0 to `total` every time `runKey` changes (the tab opening),
// a little at a time. With Reduce Motion it shows the total straight away.
export function useCountUp(total: number, runKey: number, reduceMotion: boolean): number {
  const [value, setValue] = useState(reduceMotion ? total : 0);
  useEffect(() => {
    if (reduceMotion) {
      setValue(total);
      return;
    }
    setValue(0);
    const timer = setInterval(() => {
      setValue((current) => {
        const next = nextCount(current, total);
        if (next >= total) clearInterval(timer);
        return next;
      });
    }, COUNT_EVERY_MS);
    return () => clearInterval(timer);
  }, [total, runKey, reduceMotion]);
  return value;
}
