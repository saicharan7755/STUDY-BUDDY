import { createContext } from 'react';

export const ToastContext = createContext({
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
  addToast: () => {},
  removeToast: () => {},
});
