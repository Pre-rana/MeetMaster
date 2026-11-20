import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  loadDemoMode,
  loadMeetings,
  saveDemoMode,
  saveMeetings,
  updateActionItem,
  upsertMeeting,
} from '../storage/meetingStorage';
import { cancelActionReminder, configureNotifications, scheduleActionReminders } from '../services/notificationService';
import { isOverdue, isUpcoming } from '../utils/format';

const MeetingsContext = createContext(null);

export function MeetingsProvider({ children }) {
  const [meetings, setMeetings] = useState([]);
  const [demoMode, setDemoMode] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [storedMeetings, storedDemoMode] = await Promise.all([loadMeetings(), loadDemoMode()]);
      if (!mounted) return;
      setMeetings(storedMeetings);
      setDemoMode(storedDemoMode);
      setReady(true);
      try {
        await configureNotifications();
      } catch (err) {
        console.warn('Notification setup skipped:', err?.message || err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleMeetings = useMemo(() => {
    if (demoMode) return meetings;
    return meetings.filter((meeting) => !meeting.isDemo);
  }, [meetings, demoMode]);

  const allTasks = useMemo(() => {
    return visibleMeetings.flatMap((meeting) =>
      (meeting.action_items || []).map((item) => ({
        ...item,
        meetingId: meeting.id,
        meetingTitle: meeting.title,
      }))
    );
  }, [visibleMeetings]);

  const stats = useMemo(() => {
    const pending = allTasks.filter((item) => !item.completed);
    const overdue = pending.filter((item) => isOverdue(item.deadline, false));
    const upcoming = pending.filter((item) => isUpcoming(item.deadline, false));
    return {
      totalMeetings: visibleMeetings.length,
      pendingTasks: pending.length,
      overdueDeadlines: overdue.length,
      upcomingDeadlines: upcoming.length,
    };
  }, [allTasks, visibleMeetings]);

  const toggleDemoMode = useCallback(async () => {
    const next = !demoMode;
    setDemoMode(next);
    await saveDemoMode(next);
  }, [demoMode]);

  const addMeeting = useCallback(async (meeting) => {
    let meetingToSave = meeting;
    try {
      meetingToSave = await scheduleActionReminders(meeting);
    } catch (err) {
      console.warn('Reminder scheduling skipped, saving meeting anyway:', err?.message || err);
      meetingToSave = meeting;
    }
    const next = await upsertMeeting(meetingToSave);
    setMeetings(next);
    return meetingToSave;
  }, []);

  const toggleTask = useCallback(async (meetingId, actionItemId) => {
    const meeting = meetings.find((item) => item.id === meetingId);
    const task = meeting?.action_items?.find((item) => item.id === actionItemId);
    if (!task) return;
    const completed = !task.completed;
    if (completed && task.notificationId) {
      try {
        await cancelActionReminder(task.notificationId);
      } catch (err) {
        console.warn('Cancel reminder skipped:', err?.message || err);
      }
    }
    const next = await updateActionItem(meetingId, actionItemId, {
      completed,
      notificationId: completed ? null : task.notificationId,
    });
    setMeetings(next);
  }, [meetings]);

  const getMeeting = useCallback(
    (meetingId) => meetings.find((meeting) => meeting.id === meetingId),
    [meetings]
  );

  const replaceMeetings = useCallback(async (nextMeetings) => {
    await saveMeetings(nextMeetings);
    setMeetings(nextMeetings);
  }, []);

  const value = {
    ready,
    demoMode,
    meetings: visibleMeetings,
    allTasks,
    stats,
    toggleDemoMode,
    addMeeting,
    toggleTask,
    getMeeting,
    replaceMeetings,
  };

  return <MeetingsContext.Provider value={value}>{children}</MeetingsContext.Provider>;
}

export function useMeetings() {
  const value = useContext(MeetingsContext);
  if (!value) {
    throw new Error('useMeetings must be used inside MeetingsProvider');
  }
  return value;
}