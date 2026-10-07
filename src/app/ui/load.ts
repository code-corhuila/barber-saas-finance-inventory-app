import { signal } from '@angular/core';
import { userMessage } from '../shell-context';

/** The four states every view shows: loading, error with retry, empty and data. */
export type Load<T> =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty' }
  | { kind: 'data'; value: T };

/** A signal holding the state of one request; `run` repeats it (retry). */
export function loader<T>(request: () => Promise<T>, isEmpty: (value: T) => boolean = () => false) {
  const state = signal<Load<T>>({ kind: 'loading' });
  const run = async (): Promise<void> => {
    state.set({ kind: 'loading' });
    try {
      const value = await request();
      state.set(isEmpty(value) ? { kind: 'empty' } : { kind: 'data', value });
    } catch (err) {
      state.set({ kind: 'error', message: userMessage(err) });
    }
  };
  return { state: state.asReadonly(), run };
}
