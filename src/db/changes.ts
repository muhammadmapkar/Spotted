// A tiny "something changed" announcement. When places or settings change,
// other parts of the app (like the reminder watcher) can react.

type Listener = () => void;
const listeners = new Set<Listener>();

// Ask to be told whenever data changes. Returns a function that stops listening.
export function onDataChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Called by the database code after every change.
export function emitDataChanged(): void {
  listeners.forEach((listener) => listener());
}
