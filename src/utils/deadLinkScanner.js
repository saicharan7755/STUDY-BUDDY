const DEAD_HREFS = new Set(['', '#', 'javascript:void(0)', 'javascript:;', 'javascript: void(0)', 'javascript:;']);

const buildDomPath = (node) => {
  if (!node || node.nodeType !== 1) return '';
  const parts = [];
  let current = node;

  while (current && current.nodeType === 1 && current.tagName !== 'HTML') {
    const tagName = current.tagName.toLowerCase();
    const siblings = Array.from(current.parentNode?.children || []).filter(
      (child) => child.tagName === current.tagName
    );
    const index = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(current) + 1})` : '';
    parts.unshift(`${tagName}${index}`);
    current = current.parentNode;
  }

  return parts.join(' > ');
};

export function startDeadLinkScanner() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const anchors = Array.from(document.querySelectorAll('a'));
  const deadLinks = anchors
    .map((anchor) => {
      const href = anchor.getAttribute('href');
      const normalizedHref = href?.trim();
      const reason = [];

      if (normalizedHref === undefined || normalizedHref === null) {
        reason.push('missing href');
      }
      if (DEAD_HREFS.has(normalizedHref)) {
        reason.push('dead href');
      }
      if (normalizedHref?.toLowerCase().startsWith('javascript:')) {
        reason.push('javascript href');
      }

      if (reason.length === 0) {
        return null;
      }

      return {
        href: normalizedHref,
        text: anchor.textContent?.trim() || '(no text)',
        selector: buildDomPath(anchor),
        reason: reason.join(', '),
      };
    })
    .filter(Boolean);

  if (deadLinks.length > 0) {
    console.groupCollapsed('Dead link scanner detected potential invalid links');
    console.table(deadLinks);
    console.groupEnd();
  } else {
    console.log('Dead link scanner: no invalid anchor href values found.');
  }
}
