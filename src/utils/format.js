export function pad2(value) {
  return String(value).padStart(2, '0');
}

export function formatElapsed(millis) {
  const totalSeconds = Math.max(0, Math.floor((millis || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  }
  return `${pad2(minutes)}:${pad2(seconds)}`;
}

export function formatDate(iso) {
  if (!iso) return 'No date';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDeadline(iso) {
  if (!iso) return 'No deadline';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function startOfDay(date) {
  const next = new Date(date);
  startOfDayInternal(next);
  return next;
}

function startOfDayInternal(date) {
  date.setHours(0, 0, 0, 0);
}

export function isOverdue(iso, completed) {
  if (completed || !iso) return false;
  const deadline = new Date(iso);
  if (Number.isNaN(deadline.getTime())) return false;
  return startOfDay(deadline).getTime() < startOfDay(new Date()).getTime();
}

export function isUpcoming(iso, completed) {
  if (completed || !iso) return false;
  const deadline = new Date(iso);
  if (Number.isNaN(deadline.getTime())) return false;
  const today = startOfDay(new Date()).getTime();
  const due = startOfDay(deadline).getTime();
  const inSevenDays = today + 7 * 24 * 60 * 60 * 1000;
  return due >= today && due <= inSevenDays;
}

export function daysFromNow(days, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
