import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { isOverdue } from '../utils/format';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.warn('Notification handler setup skipped:', error?.message || error);
}

export async function configureNotifications() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('meetmaster-deadlines', {
        name: 'MeetMaster Deadlines',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 180, 80, 180],
        lightColor: '#5B8CFF',
      });
    }

    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    return status === 'granted';
  } catch (error) {
    console.warn('Notification configuration skipped in Expo Go:', error?.message || error);
    return false;
  }
}

export async function scheduleActionReminders(meeting) {
  try {
    const granted = await configureNotifications();
    if (!granted) return meeting;

    const items = meeting.action_items || [];
    const nextItems = [];

    for (const item of items) {
      if (item.completed || !item.deadline || isOverdue(item.deadline, false)) {
        nextItems.push(item);
        continue;
      }

      const fireDate = new Date(item.deadline);
      if (Number.isNaN(fireDate.getTime()) || fireDate.getTime() <= Date.now() + 15000) {
        nextItems.push(item);
        continue;
      }

      if (item.notificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(item.notificationId);
        } catch {
          // Ignore stale notification ids from previous schedules.
        }
      }

      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'MeetMaster deadline',
            body: `${item.assignee || 'Someone'}: ${item.task}`,
            data: { meetingId: meeting.id, actionItemId: item.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireDate,
            channelId: 'meetmaster-deadlines',
          },
        });

        nextItems.push({ ...item, notificationId });
      } catch (itemError) {
        console.warn('Skipping reminder for action item:', itemError?.message || itemError);
        nextItems.push(item);
      }
    }

    return { ...meeting, action_items: nextItems };
  } catch (error) {
    console.warn('Scheduling reminders skipped:', error?.message || error);
    return meeting;
  }
}

export async function cancelActionReminder(notificationId) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already fired or cancelled.
  }
}