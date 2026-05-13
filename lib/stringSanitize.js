/**
 * Remove ASCII control characters except tab, LF, CR (aligned with legacy sanitizer intent).
 */
export function stripUnsafeAsciiControls(str) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c === 9 || c === 10 || c === 13 || (c >= 32 && c <= 126) || c >= 160) {
      out += str[i];
    }
  }
  return out;
}

export function sanitizeText(value, maxLength = 1000) {
  if (typeof value !== 'string') {
    return '';
  }

  return stripUnsafeAsciiControls(value)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}
