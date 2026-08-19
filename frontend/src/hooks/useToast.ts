'use client';

import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastId = 0;

const toastsState: { toasts: Toast[]; listeners: Array<(toasts: Toast[]) => void> } = {
  toasts: [],
  listeners: [],
};

function notifyListeners() {
  toastsState.listeners.forEach((listener) => listener(toastsState.toasts));
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastsState.toasts);

  const listener = useCallback((newToasts: Toast[]) => {
    setToasts(newToasts);
  }, []);

  useState(() => {
    toastsState.listeners.push(listener);
    return () => {
      toastsState.listeners = toastsState.listeners.filter((l) => l !== listener);
    };
  });

  const toast = useCallback(
    (props: Omit<Toast, 'id'>) => {
      const id = String(++toastId);
      const newToast = { ...props, id };
      toastsState.toasts = [...toastsState.toasts, newToast];
      notifyListeners();

      setTimeout(() => {
        dismiss(id);
      }, 5000);

      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    toastsState.toasts = toastsState.toasts.filter((t) => t.id !== id);
    notifyListeners();
  }, []);

  return { toasts, toast, dismiss };
}
