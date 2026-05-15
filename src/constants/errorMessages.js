export const AI_ERROR_MESSAGES = {
  timeout:
    'This is taking longer than expected. Your content may be complex — please try with a shorter text or try again.',
  rateLimit: (seconds) =>
    `You've made several requests quickly. Please wait ${seconds} seconds before trying again.`,
  serviceUnavailable:
    "Our AI service is temporarily down. We're aware and working on it. Try again in a few minutes.",
  contentTooLong: (maxWords) =>
    `Your text exceeds the maximum length of ${maxWords} words. Please shorten it and try again.`,
  emptyInput: 'Please add some text or upload a file before generating.',
  invalidFileType:
    'We support .pdf, .txt, and .docx files. Please upload a supported file type.',
};

export const AUTH_ERROR_MESSAGES = {
  wrongPassword: (attemptsRemaining) =>
    `Incorrect password.${attemptsRemaining ? ` ${attemptsRemaining} attempts remaining before lockout.` : ''}`,
  accountNotFound:
    'No account found with this email. Would you like to sign up instead?',
  accountLocked: (timeText) =>
    `Account temporarily locked after too many attempts. Try again in ${timeText} or reset your password.`,
  networkError: 'Connection issue. Please check your internet and try again.',
  sessionExpired: 'Your session has expired. Please log in again.',
};

export const DATA_ERROR_MESSAGES = {
  saveFailed: (item) =>
    `Couldn't save your ${item || 'content'}. We'll keep trying in the background.`,
  deleteFailed: "Couldn't delete this item. Please try again.",
  loadFailed: (item) =>
    `Couldn't load your ${item || 'content'}.`,
};

const errorMessages = {
  ai: AI_ERROR_MESSAGES,
  auth: AUTH_ERROR_MESSAGES,
  data: DATA_ERROR_MESSAGES,
};

export default errorMessages;
