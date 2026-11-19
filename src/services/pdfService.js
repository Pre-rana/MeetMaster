import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
    <title>MeetMaster Minutes</title>
    <style>
      body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #122033; padding: 28px; }
      h1 { margin: 0 0 6px; }
      .brand { color: #3558d4; letter-spacing: 0.08em; font-size: 12px; font-weight: 700; text-transform: uppercase; }
      .muted { color: #5b6b80; margin-bottom: 22px; }
      h2 { margin-top: 26px; border-bottom: 1px solid #d9e1ee; padding-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d9e1ee; padding: 8px; text-align: left; font-size: 13px; }
      th { background: #eef3ff; }
    </style>
  </head>
  <body>
    <div class="brand">MeetMaster Minutes</div>
    <h1>${escapeHtml(meeting.title)}</h1>
    <div class="muted">${escapeHtml(formatDate(meeting.date))}</div>
    <h2>Summary</h2>
    <p>${escapeHtml(meeting.summary)}</p>
    <h2>Key Decisions</h2>
    <ul>${decisions || '<li>None recorded</li>'}</ul>
    <h2>Speaker Transcript</h2>
    ${transcript || '<p>No transcript available.</p>'}
    <h2>Action Items</h2>
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

export async function exportMeetingPdf(meeting) {
  const html = buildMinutesHtml(meeting);
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share MeetMaster Minutes',
    UTI: 'com.adobe.pdf',
  });
  return uri;
}
