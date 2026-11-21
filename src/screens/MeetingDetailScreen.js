import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { SpeakerBubble } from '../components/SpeakerBubble';
import { TaskRow } from '../components/TaskRow';
import { useMeetings } from '../context/MeetingsContext';
import { askMeetingQuestion } from '../services/geminiMeetingService';
import { exportMeetingPdf } from '../services/pdfService';
import { colors, radius, spacing } from '../theme';
import { confirmMeetingDeletion, showMeetingDeletionError } from '../utils/confirmMeetingDeletion';
import { formatDate, formatElapsed } from '../utils/format';

export default function MeetingDetailScreen({ navigation, route }) {
  const { meetingId } = route.params;
  const { getMeeting, toggleTask, deleteMeeting } = useMeetings();
  const meeting = getMeeting(meetingId);

  const player = useAudioPlayer(meeting?.audioUri ? { uri: meeting.audioUri } : null);
  const status = useAudioPlayerStatus(player);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: meeting?.title || 'Meeting' });
  }, [navigation, meeting?.title]);

  useEffect(() => {
    if (meeting?.audioUri) {
      player.replace({ uri: meeting.audioUri });
    }
  }, [meeting?.audioUri]);

  if (!meeting) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>This meeting is hidden or was not found. Turn Offline Demo Mode on if it is a sample meeting.</Text>
      </View>
    );
  }

  const playAudio = () => {
    if (!meeting.audioUri) {
      Alert.alert('No audio file', 'Demo meetings include transcripts only. Record a live meeting to enable playback.');
      return;
    }
    player.play();
  };

  const pauseAudio = () => {
    player.pause();
  };

  const requestMeetingDeletion = () => {
    confirmMeetingDeletion(meeting, async () => {
      setDeleting(true);
      try {
        player.pause();
        player.replace(null);
        await deleteMeeting(meeting.id);
        navigation.goBack();
      } catch (error) {
        showMeetingDeletionError(error);
      } finally {
        setDeleting(false);
      }
    });
  };

  const askQuestion = async () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setAsking(true);
    try {
      const result = await askMeetingQuestion(meeting, trimmed);
      setAnswer(result);
    } catch (error) {
      Alert.alert('Q&A failed', error.message || String(error));
    } finally {
      setAsking(false);
    }
  };

  const sharePdf = async () => {
    setExporting(true);
    try {
      await exportMeetingPdf(meeting);
    } catch (error) {
      Alert.alert('PDF export failed', error.message || String(error));
    } finally {
      setExporting(false);
    }
  };

  const durationLabel = formatElapsed((status.duration || 0) * 1000);
  const currentLabel = formatElapsed((status.currentTime || 0) * 1000);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.date}>{formatDate(meeting.date)}</Text>

      <View style={styles.card}>
        <Text style={styles.section}>Audio playback</Text>
        <Text style={styles.playMeta}>
          {meeting.audioUri ? `${currentLabel} / ${durationLabel}` : 'Transcript-only demo meeting'}
        </Text>
        <View style={styles.playRow}>
          <Pressable style={styles.playBtn} onPress={status.playing ? pauseAudio : playAudio} disabled={deleting}>
            <Text style={styles.playText}>{status.playing ? 'Pause' : 'Play'}</Text>
          </Pressable>
          <Pressable style={styles.deleteBtn} onPress={requestMeetingDeletion} disabled={deleting}>
            {deleting ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.deleteText}>Delete</Text>}
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Executive summary</Text>
        <Text style={styles.body}>{meeting.summary}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Key decisions</Text>
        {(meeting.key_decisions || []).map((decision, index) => (
          <View key={`${decision}-${index}`} style={styles.decision}>
            <Text style={styles.decisionMark}>▸</Text>
            <Text style={styles.body}>{decision}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Speaker transcript</Text>
        {(meeting.speaker_segments || []).map((segment, index) => (
          <SpeakerBubble key={segment.id || `${segment.timestamp}-${index}`} segment={segment} />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Extracted tasks</Text>
        {(meeting.action_items || []).map((item) => (
          <TaskRow
            key={item.id}
            item={item}
            onToggle={() => toggleTask(meeting.id, item.id)}
          />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>AI Q&A</Text>
        <Text style={styles.hint}>Ask things like “What was decided about the deadline?” or “Who owns what?”</Text>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask this meeting..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
        />
        <Pressable style={styles.playBtn} onPress={askQuestion} disabled={asking}>
          {asking ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.playText}>Ask MeetMaster</Text>}
        </Pressable>
        {answer ? (
          <View style={styles.answer}>
            <Text style={styles.answerLabel}>GROUNDED ANSWER</Text>
            <Text style={styles.body}>{answer}</Text>
          </View>
        ) : null}
      </View>

      <Pressable style={styles.pdfBtn} onPress={sharePdf} disabled={exporting}>
        {exporting ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.playText}>Export MeetMaster Minutes PDF</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  missing: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  missingText: {
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  date: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  section: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  body: {
    color: colors.text,
    lineHeight: 21,
    flex: 1,
  },
  decision: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  decisionMark: {
    color: colors.teal,
    fontWeight: '800',
  },
  playMeta: {
    color: colors.muted,
    marginBottom: 10,
  },
  playRow: {
    flexDirection: 'row',
    gap: 10,
  },
  playBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  playText: {
    color: colors.bg,
    fontWeight: '800',
  },
  deleteBtn: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteText: {
    color: colors.danger,
    fontWeight: '800',
  },
  hint: {
    color: colors.muted,
    marginBottom: 10,
  },
  input: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    padding: 12,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  answer: {
    marginTop: 12,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  answerLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 1,
  },
  pdfBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
});
