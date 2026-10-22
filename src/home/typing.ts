// The search box "types" examples letter by letter: Try 'I', Try 'In', ... Try 'Indian', waits,
// then moves to the next example. Copied from the prototype's tickType(): one step every 120 ms,
// and a pause of 14 steps (about 1.7 seconds) once a word is complete.

export const TYPING_TICK_MS = 120;
export const TYPING_HOLD_TICKS = 14;

export interface TypingState {
  example: number; // which example word we are on
  chars: number; // how many letters are showing
  hold: number; // pause steps left
  typed: string; // the letters showing now
}

export const INITIAL_TYPING: TypingState = { example: 0, chars: 0, hold: 0, typed: '' };

export function stepTyping(state: TypingState, examples: readonly string[]): TypingState {
  if (examples.length === 0) return state;
  if (state.hold > 0) {
    const hold = state.hold - 1;
    // When the pause ends we start the next word from nothing (the screen updates on the next step).
    if (hold === 0) return { ...state, hold, chars: 0, example: (state.example + 1) % examples.length };
    return { ...state, hold };
  }
  const word = examples[state.example];
  const chars = Math.min(state.chars + 1, word.length);
  return { example: state.example, chars, hold: chars >= word.length ? TYPING_HOLD_TICKS : 0, typed: word.slice(0, chars) };
}
