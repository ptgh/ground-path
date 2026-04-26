import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { Message } from './messagingService';

interface ExportContext {
  ownerName: string; // current user
  otherPartyName: string;
  isSelfConversation: boolean;
}

function formatTranscriptText(messages: Message[], ctx: ExportContext): string {
  const header = ctx.isSelfConversation
    ? `Personal Notes — ${ctx.ownerName}\nExported: ${format(new Date(), 'PPpp')}\n${'='.repeat(60)}\n`
    : `Conversation: ${ctx.ownerName} ↔ ${ctx.otherPartyName}\nExported: ${format(new Date(), 'PPpp')}\n${'='.repeat(60)}\n`;

  const body = messages
    .map((m) => {
      const ts = format(new Date(m.created_at), 'PPp');
      const sender = m.sender_name || 'Unknown';
      const text = m.message_text?.trim() || '';
      const attach = m.attachment_name ? ` [Attachment: ${m.attachment_name}]` : '';
      const resource = m.resource_url ? ` [Resource: ${m.resource_title || m.resource_url}]` : '';
      return `[${ts}] ${sender}:\n${text}${attach}${resource}\n`;
    })
    .join('\n');

  return `${header}\n${body}\n${'='.repeat(60)}\nGroundpath — confidential. For authorised use only.`;
}

function formatMessageWithMetadata(m: Message): string {
  const ts = format(new Date(m.created_at), 'PPp');
  const sender = m.sender_name || 'Unknown';
  return `[${ts}] ${sender}: ${m.message_text || ''}`;
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildPdf(messages: Message[], ctx: ExportContext): Blob {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  // Header band
  pdf.setFillColor(86, 119, 96); // sage
  pdf.rect(0, 0, pageWidth, 22, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(ctx.isSelfConversation ? 'Personal Notes' : 'Secure Conversation Transcript', margin, 14);

  y = 30;
  pdf.setTextColor(40, 40, 40);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  if (ctx.isSelfConversation) {
    pdf.text(`Author: ${ctx.ownerName}`, margin, y);
  } else {
    pdf.text(`Participants: ${ctx.ownerName} ↔ ${ctx.otherPartyName}`, margin, y);
  }
  y += 6;
  pdf.text(`Exported: ${format(new Date(), 'PPpp')}`, margin, y);
  y += 4;
  pdf.setDrawColor(220, 220, 220);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;

  pdf.setFontSize(11);
  let lastDate = '';

  for (const m of messages) {
    const dateLabel = format(new Date(m.created_at), 'PPPP');
    if (dateLabel !== lastDate) {
      if (y > pageHeight - 30) { pdf.addPage(); y = margin; }
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(110, 110, 110);
      pdf.setFontSize(9);
      pdf.text(dateLabel.toUpperCase(), margin, y);
      y += 5;
      lastDate = dateLabel;
    }

    const ts = format(new Date(m.created_at), 'p');
    const sender = m.sender_name || 'Unknown';
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(10);
    const headLine = `${sender}  ·  ${ts}`;
    pdf.text(headLine, margin, y);
    y += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(45, 45, 45);
    pdf.setFontSize(10);
    const body = m.message_text?.trim() || '(no text)';
    const lines = pdf.splitTextToSize(body, maxWidth);
    for (const line of lines) {
      if (y > pageHeight - 20) { pdf.addPage(); y = margin; }
      pdf.text(line, margin, y);
      y += 5;
    }

    if (m.attachment_name) {
      if (y > pageHeight - 20) { pdf.addPage(); y = margin; }
      pdf.setTextColor(86, 119, 96);
      pdf.setFontSize(9);
      pdf.text(`Attachment: ${m.attachment_name}`, margin, y);
      y += 5;
      pdf.setTextColor(45, 45, 45);
      pdf.setFontSize(10);
    }
    if (m.resource_url) {
      if (y > pageHeight - 20) { pdf.addPage(); y = margin; }
      pdf.setTextColor(86, 119, 96);
      pdf.setFontSize(9);
      pdf.text(`Resource: ${m.resource_title || m.resource_url}`, margin, y);
      y += 5;
      pdf.setTextColor(45, 45, 45);
      pdf.setFontSize(10);
    }

    y += 3;
  }

  // Footer on every page
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(140, 140, 140);
    pdf.text(
      'Groundpath — confidential. Handle in line with your professional record-keeping obligations.',
      margin,
      pageHeight - 8,
    );
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 8);
  }

  return pdf.output('blob');
}

export const messageExportService = {
  async exportPDF(messages: Message[], ctx: ExportContext): Promise<void> {
    const blob = buildPdf(messages, ctx);
    const safeName = ctx.isSelfConversation ? 'personal-notes' : `conversation-${ctx.otherPartyName}`;
    const filename = `${safeName.replace(/[^a-zA-Z0-9-]+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    downloadBlob(blob, filename);
  },

  async exportText(messages: Message[], ctx: ExportContext): Promise<void> {
    const text = formatTranscriptText(messages, ctx);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const safeName = ctx.isSelfConversation ? 'personal-notes' : `conversation-${ctx.otherPartyName}`;
    const filename = `${safeName.replace(/[^a-zA-Z0-9-]+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    downloadBlob(blob, filename);
  },

  async copyTranscript(messages: Message[], ctx: ExportContext): Promise<void> {
    await copyToClipboard(formatTranscriptText(messages, ctx));
  },

  async copyMessage(message: Message, withMetadata = false): Promise<void> {
    const text = withMetadata ? formatMessageWithMetadata(message) : (message.message_text || '');
    await copyToClipboard(text);
  },
};
