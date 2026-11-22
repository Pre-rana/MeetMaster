import { Platform } from 'react-native';
import { createId } from '../utils/format';

const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', '	gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

const MEETING_PROMPT = `You are MeetMaster, a meeting-intelligence engine.
Listen to the meeting audio and return STRICT JSON only (no markdown) with this shape:
{
  "title": "short auto-generated meeting title",
  "summary": "concise executive overview in 3-5 sentences",
  "key_decisions": ["decision 1", "decision 2"],
  "speaker_segments": [
    { "speaker": "Speaker 1", "timestamp": "MM:SS", "text": "utterance" }
  ],
  "action_items": [
    { "id": "task-1", "task": "clear action", "assignee": "name or Unassigned", "deadline": "YYYY-MM-DD", "completed": false }
  ]
}
Rules:
- Use only "Speaker 1" or "Speaker 2" in speaker_segments.
- If a deadline is mentioned, convert it to YYYY-MM-DD. If unknown, use an empty string.
- Invent no extra keys. Arrays may be empty but must exist.`;

const QA_PROMPT = `You are MeetMaster Q&A. Answer using ONLY the meeting context below.
If the answer is not in the context, say you cannot find it in this meeting.
Keep answers short and grounded. Mention owners, deadlines, and decisions when they exist.`;

function getApiKey() {
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
}

function normalizeMimeType(rawMime) {
  if (!rawMime) return '';
  return String(rawMime).split(';')[0].trim().toLowerCase();
}

function mimeFromUri(uri, fallbackMime) {
  const cleanedFallback = normalizeMimeType(fallbackMime);
  if (cleanedFallback && cleanedFallback.startsWith('audio/')) {
    return cleanedFallback;
  }

  const lower = (uri || '').toLowerCase();
  if (lower.includes('.wav')) return 'audio/wav';
  if (lower.includes('.mp3')) return 'audio/mpeg';
  if (lower.includes('.aac')) return 'audio/aac';
  if (lower.includes('.3gp')) return 'audio/3gpp';
  if (lower.includes('.ogg')) return 'audio/ogg';
  if (lower.includes('.webm')) return 'audio/webm';
  if (lower.startsWith('blob:') && Platform.OS === 'web') return 'audio/webm';
  return 'audio/mp4';
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new Error('FileReader is not available in this environment.'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      if (!base64) {
        reject(new Error('Empty base64 audio payload.'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read audio blob as base64.'));
    reader.readAsDataURL(blob);
  });
}

export async function readAudioAsBase64(uri, fallbackMime) {
  if (!uri) {
    throw new Error('No audio recording URI found.');
  }

  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio (${response.status})`);
    }
    const blob = await response.blob();
    const detectedMime = normalizeMimeType(blob.type);
    const base64 = await blobToBase64(blob);
    return {
      base64,
      mimeType: mimeFromUri(uri, detectedMime || fallbackMime),
    };
  } catch (webOrFetchError) {
    if (Platform.OS === 'web') {
      throw new Error(`Web audio read failed: ${webOrFetchError.message}`);
    }

    const LegacyFS = await import('expo-file-system/legacy');
    const base64 = await LegacyFS.readAsStringAsync(uri, {
      encoding: LegacyFS.EncodingType.Base64,
    });
    return {
      base64,
      mimeType: mimeFromUri(uri, fallbackMime),
    };
  }
}

function extractText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part.text || '')
    .join('\n')
    .trim();
}

function parseStrictJson(raw) {
  const trimmed = (raw || '').trim();
  const fenced =
    trimmed.match(/```json([\s\S]*?)```/i) || trimmed.match(/```([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Gemini did not return valid JSON.');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function normalizeMeeting(parsed) {
  const segments = Array.isArray(parsed.speaker_segments) ? parsed.speaker_segments : [];
  const decisions = Array.isArray(parsed.key_decisions) ? parsed.key_decisions : [];
  const items = Array.isArray(parsed.action_items) ? parsed.action_items : [];

  return {
    title: parsed.title || 'Untitled meeting',
    summary: parsed.summary || 'No summary was generated.',
    key_decisions: decisions.map((item) => String(item)),
    speaker_segments: segments.map((segment, index) => ({
      speaker: segment.speaker === 'Speaker 2' ? 'Speaker 2' : 'Speaker 1',
      timestamp: segment.timestamp || '00:00',
      text: segment.text || '',
      id: `seg-${index}`,
    })),
    action_items: items.map((item, index) => ({
      id: item.id || `task-${index + 1}`,
      task: item.task || 'Untitled task',
      assignee: item.assignee || 'Unassigned',
      deadline: item.deadline || '',
      completed: Boolean(item.completed),
    })),
  };
}

async function callGemini({ parts, generationConfig }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY in .env');
  }

  let lastError = null;
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      lastError =
        payload?.error?.message || `Gemini ${model} failed (${response.status})`;
      continue;
    }

    const text = extractText(payload);
    if (!text) {
      lastError =
        payload?.error?.message || `Gemini ${model} returned an empty response.`;
      continue;
    }

    return text;
  }

  throw new Error(lastError || 'All Gemini models failed.');
}

export async function processMeetingAudio(uri, mimeType) {
  const { base64, mimeType: resolvedMime } = await readAudioAsBase64(uri, mimeType);
  const raw = await callGemini({
    parts: [
      { text: MEETING_PROMPT },
      {
        inline_data: {
          mime_type: resolvedMime,
          data: base64,
        },
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  return normalizeMeeting(parseStrictJson(raw));
}

export async function askMeetingQuestion(meeting, question) {
  const context = [
    `Title: ${meeting.title}`,
    `Date: ${meeting.date}`,
    `Summary: ${meeting.summary}`,
    `Decisions: ${(meeting.key_decisions || []).join(' | ')}`,
    `Tasks: ${(meeting.action_items || [])
      .map(
        (item) =>
          `${item.task} (owner: ${item.assignee}, deadline: ${
            item.deadline || 'none'
          }, done: ${item.completed})`
      )
      .join(' | ')}`,
    `Transcript: ${(meeting.speaker_segments || [])
      .map((segment) => `[${segment.timestamp}] ${segment.speaker}: ${segment.text}`)
      .join('\n')}`,
  ].join('\n');

  return callGemini({
    parts: [
      {
        text: `${QA_PROMPT}\n\nMEETING CONTEXT:\n${context}\n\nQUESTION:\n${question}`,
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  });
}

export function buildLocalMeeting(processed, audioUri) {
  return {
    id: createId('meeting'),
    isDemo: false,
    title: processed.title,
    date: new Date().toISOString(),
    audioUri,
    summary: processed.summary,
    key_decisions: processed.key_decisions,
    speaker_segments: processed.speaker_segments,
    action_items: processed.action_items,
  };
}