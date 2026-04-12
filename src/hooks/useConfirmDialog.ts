import { useState, useCallback } from 'react';

interface ConfirmState {
  open: boolean;
  message: string;
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState>({ open: false, message: '', onConfirm: () => {} });

  const requestConfirm = useCallback((message: string, onConfirm: () => void) => {
    setState({ open: true, message, onConfirm });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return { ...state, requestConfirm, closeConfirm: close };
}
