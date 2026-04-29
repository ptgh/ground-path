import jsPDF from 'jspdf';
import { Note, isAIConversationNote, isPinned } from '@/services/notesService';

const escapeCsv = (value: string): string => {
  if (value == null) return '';
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportNotesToCsv = (notes: Note[], filename = 'groundpath-notes.csv') => {
  const header = ['Type', 'Pinned', 'Title', 'Created', 'Updated', 'Content'];
  const rows = notes.map((n) => [
    isAIConversationNote(n) ? 'AI Conversation' : 'Note',
    isPinned(n) ? 'Yes' : 'No',
    n.title ?? '',
    n.created_at ? formatDate(n.created_at) : '',
    n.updated_at ? formatDate(n.updated_at) : '',
    n.content ?? '',
  ]);
  const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\r\n');
  // BOM so Excel detects UTF-8
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
};

export const exportNotesToPdf = (notes: Note[], filename = 'groundpath-notes.pdf') => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureRoom = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeWrapped = (text: string, size: number, opts: { bold?: boolean; color?: [number, number, number] } = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    if (opts.color) doc.setTextColor(...opts.color);
    else doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(text || '', contentWidth);
    const lineHeight = size * 1.3;
    lines.forEach((line: string) => {
      ensureRoom(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    });
  };

  // Header
  writeWrapped('groundpath — notes export', 18, { bold: true, color: [60, 90, 70] });
  writeWrapped(
    `${notes.length} item${notes.length === 1 ? '' : 's'} · exported ${formatDate(new Date().toISOString())}`,
    10,
    { color: [110, 110, 110] }
  );
  y += 8;

  notes.forEach((n, idx) => {
    const isAI = isAIConversationNote(n);
    const pinned = isPinned(n);
    ensureRoom(60);

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    // Meta row
    const tag = `${pinned ? '★ ' : ''}[${isAI ? 'AI Conversation' : 'Note'}]`;
    writeWrapped(`${idx + 1}. ${tag} ${n.title || 'Untitled'}`, 12, { bold: true });
    writeWrapped(
      `Created ${formatDate(n.created_at)}${
        n.updated_at && n.updated_at !== n.created_at ? ` · Updated ${formatDate(n.updated_at)}` : ''
      }`,
      9,
      { color: [120, 120, 120] }
    );
    y += 4;
    writeWrapped(n.content || '(no content)', 10);
    y += 10;
  });

  doc.save(filename);
};
