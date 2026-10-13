import { useId, type ReactNode } from 'react';

export function useFieldIds({ hint, error }: { hint?: ReactNode; error?: string }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return { id, hintId, errorId, describedBy };
}