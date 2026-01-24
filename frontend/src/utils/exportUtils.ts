import jsPDF from 'jspdf';
import { Message } from '../types';

/**
 * Export conversation to PDF
 */
export function exportConversationToPDF(
  messages: Message[],
  conversationName: string = 'conversation'
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Autism Parent Assistant', margin, yPosition);
  yPosition += 10;

  // Conversation name
  doc.setFontSize(14);
  doc.text(conversationName, margin, yPosition);
  yPosition += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Exported: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 15;

  // Messages
  messages.forEach((message) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    // Message header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const role = message.role === 'user' ? 'You' : 'Assistant';
    doc.text(role, margin, yPosition);
    yPosition += 7;

    // Message content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(message.content, maxWidth);

    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });

    yPosition += 10; // Space between messages
  });

  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    'This information is for educational purposes only.',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save
  doc.save(`${conversationName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}

/**
 * Export conversation to text file
 */
export function exportConversationToText(
  messages: Message[],
  conversationName: string = 'conversation'
) {
  let content = `AUTISM PARENT ASSISTANT\n`;
  content += `Conversation: ${conversationName}\n`;
  content += `Exported: ${new Date().toLocaleString()}\n`;
  content += `${'='.repeat(60)}\n\n`;

  messages.forEach((message) => {
    const role = message.role === 'user' ? 'YOU' : 'ASSISTANT';
    content += `[${role}]\n`;
    content += `${message.content}\n\n`;
    content += `-`.repeat(60) + '\n\n';
  });

  content += `\nThis information is for educational purposes only.\n`;
  content += `Not a substitute for professional medical advice.\n`;

  // Create blob and download
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${conversationName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
