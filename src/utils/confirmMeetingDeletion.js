import { Alert, Platform } from 'react-native';

export function confirmMeetingDeletion(meeting, onConfirm) {
  const message = 'This permanently deletes the recording, transcript, summary, and tasks.';
  if (Platform.OS === 'web') {
    if (window.confirm(`Delete "${meeting.title}"?\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert('Delete meeting?', message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

export function showMeetingDeletionError(error) {
  const message = error?.message || String(error);
  if (Platform.OS === 'web') {
    window.alert(`Could not delete meeting\n\n${message}`);
    return;
  }
  Alert.alert('Could not delete meeting', message);
}
