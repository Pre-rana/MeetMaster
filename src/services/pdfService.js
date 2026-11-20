import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { formatDate, formatDeadline } from '../utils/format';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildMinutesHtml(meeting) {
  const decisions = (meeting.key_decisions || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');
  const transcript = (meeting.speaker_segments || [])
    .map(
      (segment) =>
        `<p><strong>${escapeHtml(segment.speaker)}</strong> <em>${escapeHtml(segment.timestamp)}</em><br/>${escapeHtml(segment.text)}</p>`
    )
    .join('');
  const tasks = (meeting.action_items || [])
    .map((item) => {
      const status = item.completed ? 'Done' : 'Pending';
      return `<tr>
        <td>${escapeHtml(item.task)}</td>
        <td>${escapeHtml(item.assignee)}</td>
        <td>${escapeHtml(formatDeadline(item.deadline))}</td>
        <td>${status}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(meeting.title)} - MeetMaster Minutes</title>
    <style>
      @page { margin: 18mm; }
      body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #122033; }
      h1 { margin: 0 0 6px; }
      .brand { color: #3558d4; letter-spacing: 0.08em; font-size: 12px; font-weight: 700; text-transform: uppercase; }
      .muted { color: #5b6b80; margin-bottom: 22px; }
      h2 { margin-top: 26px; border-bottom: 1px solid #d9e1ee; padding-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d9e1ee; padding: 8px; text-align: left; font-size: 13px; }
      th { background: #eef3ff; }
      tr, p { break-inside: avoid; }
    </style>
  </head>
  <body>
    <div class="brand">MeetMaster Minutes</div>
    <h1>${escapeHtml(meeting.title)}</h1>
    <div class="muted">${escapeHtml(formatDate(meeting.date))}</div>
    <h2>Executive Summary</h2>
    <p>${escapeHtml(meeting.summary)}</p>
    <h2>Key Decisions</h2>
    <ul>${decisions || '<li>None recorded</li>'}</ul>
    <h2>Speaker Transcript</h2>
    ${transcript || '<p>No transcript available.</p>'}
    <h2>Extracted Tasks</h2>
    <table>
      <thead>
        <tr><th>Task</th><th>Assignee</th><th>Deadline</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${tasks || '<tr><td colspan="4">No action items</td></tr>'}
      </tbody>
    </table>
  </body>
</html>`;
}

function printHtmlOnWeb(html) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('The print window was blocked. Allow pop-ups and try exporting again.');
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    if (!printWindow.closed) {
      printWindow.print();
    }
  }, 0);
}

export async function exportMeetingPdf(meeting) {
  const html = buildMinutesHtml(meeting);
  if (Platform.OS === 'web') {
    printHtmlOnWeb(html);
    return null;
  }

  const { uri } = await Print.printToFileAsync({ html });
  let sharingError;
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share MeetMaster Minutes',
        UTI: 'com.adobe.pdf',
      });
      return uri;
    }
  } catch (error) {
    sharingError = error;
  }

  try {
    await Print.printAsync({ html });
  } catch (printError) {
    const shareMessage = sharingError
      ? ` Sharing the PDF also failed: ${sharingError.message || String(sharingError)}.`
      : '';
    throw new Error(
      `Could not open the PDF print dialog: ${printError.message || String(printError)}.${shareMessage}`
    );
  }

  return uri;
}
