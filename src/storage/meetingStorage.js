import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_MEETINGS } from '../data/demoMeetings';

const MEETINGS_KEY = '@meetmaster/meetings';
const DEMO_MODE_KEY = '@meetmaster/demoMode';
const DELETED_DEMO_MEETINGS_KEY = '@meetmaster/deletedDemoMeetings';

function parseDeletedDemoMeetingIds(raw) {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function sortMeetings(meetings) {
  return [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function loadMeetings() {
  const [raw, deletedDemoIdsRaw] = await Promise.all([
    AsyncStorage.getItem(MEETINGS_KEY),
    AsyncStorage.getItem(DELETED_DEMO_MEETINGS_KEY),
  ]);
  const deletedDemoIds = parseDeletedDemoMeetingIds(deletedDemoIdsRaw);
  let stored = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      stored = Array.isArray(parsed) ? parsed : [];
    } catch {
      stored = [];
    }
  }

  const byId = new Map(stored.map((meeting) => [meeting.id, meeting]));
  DEMO_MEETINGS.forEach((demo) => {
    if (deletedDemoIds.has(demo.id)) {
      byId.delete(demo.id);
      return;
    }
    const existing = byId.get(demo.id);
    const completedById = new Map((existing?.action_items || []).map((item) => [item.id, item]));
    byId.set(demo.id, {
      ...demo,
      action_items: demo.action_items.map((item) => ({
        ...item,
        completed: completedById.get(item.id)?.completed ?? item.completed,
        notificationId: completedById.get(item.id)?.notificationId,
      })),
    });
  });

  const merged = Array.from(byId.values());
  await AsyncStorage.setItem(MEETINGS_KEY, JSON.stringify(merged));
  return sortMeetings(merged);
}

export async function saveMeetings(meetings) {
  await AsyncStorage.setItem(MEETINGS_KEY, JSON.stringify(meetings));
}

export async function removeMeeting(meetingId) {
  const meetings = await loadMeetings();
  const meeting = meetings.find((item) => item.id === meetingId);
  if (!meeting) return meetings;

  const next = meetings.filter((item) => item.id !== meetingId);
  const entries = [[MEETINGS_KEY, JSON.stringify(next)]];
  if (meeting.isDemo) {
    const rawDeletedDemoIds = await AsyncStorage.getItem(DELETED_DEMO_MEETINGS_KEY);
    const deletedDemoIds = parseDeletedDemoMeetingIds(rawDeletedDemoIds);
    deletedDemoIds.add(meetingId);
    entries.push([DELETED_DEMO_MEETINGS_KEY, JSON.stringify([...deletedDemoIds])]);
  }
  await AsyncStorage.multiSet(entries);
  return sortMeetings(next);
}

export async function loadDemoMode() {
  const raw = await AsyncStorage.getItem(DEMO_MODE_KEY);
  if (raw === null) return true;
  return raw === 'true';
}

export async function saveDemoMode(enabled) {
  await AsyncStorage.setItem(DEMO_MODE_KEY, enabled ? 'true' : 'false');
}

export async function upsertMeeting(meeting) {
  const meetings = await loadMeetings();
  const index = meetings.findIndex((item) => item.id === meeting.id);
  const next = [...meetings];
  if (index >= 0) {
    next[index] = meeting;
  } else {
    next.unshift(meeting);
  }
  await saveMeetings(next);
  return sortMeetings(next);
}

export async function updateActionItem(meetingId, actionItemId, patch) {
  const meetings = await loadMeetings();
  const next = meetings.map((meeting) => {
    if (meeting.id !== meetingId) return meeting;
    return {
      ...meeting,
      action_items: (meeting.action_items || []).map((item) =>
        item.id === actionItemId ? { ...item, ...patch } : item
      ),
    };
  });
  await saveMeetings(next);
  return sortMeetings(next);
}
