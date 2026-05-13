import { jsPDF } from 'jspdf';

const APP_NAME = 'CRAM AI Study Buddy';
const SHARE_PARAM = 'cards';
const SHARE_TITLE_PARAM = 'deck';

const asText = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const sanitizeFileName = (name) =>
  asText(name)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'flashcards';

const getQuestion = (card) => card?.question || card?.front || card?.prompt || '';
const getAnswer = (card) => card?.answer || card?.back || card?.correctAnswer || '';

export const normalizeFlashcards = (cards = [], defaults = {}) =>
  (Array.isArray(cards) ? cards : [])
    .map((card, index) => {
      const tags = Array.isArray(card?.tags) ? card.tags : [];
      return {
        id: card?.id || card?.cardId || `card-${index + 1}`,
        question: getQuestion(card),
        answer: getAnswer(card),
        topic: card?.topic || card?.topicTitle || defaults.topic || card?.topicId || tags[0] || '',
        difficulty: card?.difficulty || defaults.difficulty || '',
        tags,
        sourceText: card?.sourceText || defaults.sourceText || '',
      };
    })
    .filter((card) => card.question || card.answer);

const downloadTextFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const escapeCsv = (value) => `"${asText(value).replace(/"/g, '""')}"`;
const escapeTsv = (value) => asText(value).replace(/\t/g, ' ').replace(/\r?\n/g, '<br>');

export const exportFlashcardsAsCsv = (cards, deckName = 'flashcards') => {
  const normalized = normalizeFlashcards(cards, { topic: deckName });
  const rows = [
    ['Question', 'Answer', 'Topic', 'Difficulty'],
    ...normalized.map((card) => [card.question, card.answer, card.topic, card.difficulty]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(',')).join('\n')}`;
  downloadTextFile(csv, `${sanitizeFileName(deckName)}.csv`, 'text/csv;charset=utf-8');
};

export const exportFlashcardsForAnki = (cards, deckName = 'flashcards') => {
  const normalized = normalizeFlashcards(cards, { topic: deckName });
  const tsv = normalized
    .map((card) =>
      [
        card.question,
        card.answer,
        card.topic,
        card.difficulty,
        card.tags.join(', '),
        card.sourceText,
        card.id,
      ]
        .map(escapeTsv)
        .join('\t')
    )
    .join('\n');
  downloadTextFile(tsv, `${sanitizeFileName(deckName)}-anki.txt`, 'text/tab-separated-values;charset=utf-8');
};

export const exportFlashcardsAsPdf = (cards, deckName = 'flashcards') => {
  const normalized = normalizeFlashcards(cards, { topic: deckName });
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addBranding = () => {
    doc.setFillColor(124, 58, 237);
    doc.roundedRect(margin, y, 34, 34, 8, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('AI', margin + 8, y + 22);
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(16);
    doc.text(APP_NAME, margin + 44, y + 22);
    y += 58;
  };

  const ensureRoom = (height) => {
    if (y + height <= pageHeight - margin) return;
    doc.addPage();
    y = margin;
    addBranding();
  };

  addBranding();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(17, 24, 39);
  doc.text(deckName || 'Flashcards', margin, y);
  y += 34;

  normalized.forEach((card, index) => {
    const questionLines = doc.splitTextToSize(card.question, contentWidth - 32);
    const answerLines = doc.splitTextToSize(card.answer, contentWidth - 32);
    const estimatedHeight = 96 + questionLines.length * 18 + answerLines.length * 15;

    ensureRoom(Math.max(estimatedHeight, 150));

    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y, contentWidth, Math.max(estimatedHeight, 150), 10, 10, 'FD');

    doc.setTextColor(124, 58, 237);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`CARD ${index + 1}`, margin + 16, y + 28);

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(16);
    doc.text(questionLines, margin + 16, y + 56);

    const answerY = y + 72 + questionLines.length * 18;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(10);
    doc.text('ANSWER', margin + 16, answerY);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(answerLines, margin + 16, answerY + 20);

    y += Math.max(estimatedHeight, 150) + 18;
  });

  doc.save(`${sanitizeFileName(deckName)}.pdf`);
};

export const buildFlashcardsText = (cards, deckName = 'Flashcards') => {
  const normalized = normalizeFlashcards(cards, { topic: deckName });
  return normalized
    .map((card, index) => `${index + 1}. ${card.question}\nAnswer: ${card.answer}`)
    .join('\n\n');
};

export const copyFlashcardsAsText = async (cards, deckName) => {
  await navigator.clipboard.writeText(buildFlashcardsText(cards, deckName));
};

const toBase64Url = (value) =>
  btoa(encodeURIComponent(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const fromBase64Url = (value) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return decodeURIComponent(atob(padded));
};

export const createFlashcardsShareLink = (cards, deckName = 'Flashcards', baseUrl = window.location.href) => {
  const url = new URL(baseUrl);
  url.pathname = '/try';
  url.searchParams.set(SHARE_PARAM, toBase64Url(JSON.stringify(normalizeFlashcards(cards, { topic: deckName }))));
  url.searchParams.set(SHARE_TITLE_PARAM, deckName);
  return url.toString();
};

export const copyFlashcardsShareLink = async (cards, deckName) => {
  const link = createFlashcardsShareLink(cards, deckName);
  await navigator.clipboard.writeText(link);
  return link;
};

export const readFlashcardsFromShareParams = (search = window.location.search) => {
  const params = new URLSearchParams(search);
  const encoded = params.get(SHARE_PARAM);
  if (!encoded) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(encoded));
    const deckName = params.get(SHARE_TITLE_PARAM) || 'Shared Flashcards';
    const cards = normalizeFlashcards(parsed, { topic: deckName }).map((card, index) => ({
      id: card.id || `shared-${index + 1}`,
      front: card.question,
      back: card.answer,
      topic: card.topic,
      difficulty: card.difficulty,
      tags: card.tags,
      sourceText: card.sourceText,
    }));
    return { deckName, cards };
  } catch (error) {
    console.error('Unable to read shared flashcards', error);
    return null;
  }
};
