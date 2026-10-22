import { useEffect, useState } from 'react';

import { SEARCH_EXAMPLES } from '../data/mock';
import { INITIAL_TYPING, TYPING_TICK_MS, TypingState, stepTyping } from './typing';

// The letters of the example word typed so far ("Ind"), updating every 120 ms while `active`.
// Pass active = false when the box has text in it or the screen is not showing, so it stops
// using the processor.
export function useTypingPlaceholder(active: boolean, examples: readonly string[] = SEARCH_EXAMPLES): string {
  const [state, setState] = useState<TypingState>(INITIAL_TYPING);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setState((current) => stepTyping(current, examples)), TYPING_TICK_MS);
    return () => clearInterval(timer);
  }, [active, examples]);
  return state.typed;
}
