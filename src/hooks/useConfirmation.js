import { useCallback, useRef, useState } from 'react';

const DEFAULT_STATE = {
  isOpen: false,
  title: '',
  message: '',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
  type: 'warning',
  requireTyping: false,
  onConfirm: async () => {},
  onCancel: () => {},
  isConfirming: false,
  error: '',
  returnFocusRef: null,
};

const useConfirmation = () => {
  const [state, setState] = useState(DEFAULT_STATE);
  const actionRef = useRef(null);

  const closeConfirmation = useCallback(() => {
    setState((current) => ({ ...current, isOpen: false, isConfirming: false, error: '' }));
  }, []);

  const openConfirmation = useCallback((options) => {
    actionRef.current = options.onConfirm || (async () => {});
    setState({
      ...DEFAULT_STATE,
      ...options,
      isOpen: true,
      isConfirming: false,
      error: '',
    });
  }, []);

  const onCancel = useCallback(() => {
    if (state.isConfirming) return;
    state.onCancel?.();
    closeConfirmation();
  }, [closeConfirmation, state.isConfirming, state.onCancel]);

  const onConfirm = useCallback(async () => {
    if (state.isConfirming) return;
    setState((current) => ({ ...current, isConfirming: true, error: '' }));

    try {
      await actionRef.current();
      closeConfirmation();
    } catch (error) {
      const message = error?.message || 'Unable to complete this action. Please try again.';
      setState((current) => ({ ...current, isConfirming: false, error: message }));
    }
  }, [closeConfirmation, state.isConfirming]);

  return {
    openConfirmation,
    confirmationProps: {
      ...state,
      onConfirm,
      onCancel,
    },
  };
};

export default useConfirmation;
