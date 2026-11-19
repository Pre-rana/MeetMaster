import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMeetings } from '../context/MeetingsContext';
import { buildLocalMeeting, processMeetingAudio } from '../services/geminiMeetingService';
import { colors, radius, spacing } from '../theme';
import { formatElapsed } from '../utils/format';

export default function RecordScreen({ navigation }) {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    directory: 'document',
  });
  const recorderState = useAudioRecorderState(recorder, 200);
  const { addMeeting } = useMeetings();

  const [phase, setPhase] = useState('idle');
  const [pickedUri, setPickedUri] = useState(null);
  const [pickedMime, setPickedMime] = useState(null);
  const [statusText, setStatusText] = useState('Ready to capture a meeting.');

  const elapsed = useMemo(() => formatElapsed(recorderState.durationMillis), [recorderState.durationMillis]);
  const isRecording = phase === 'recording';
  const isPaused = phase === 'paused';
  const isBusy = phase === 'processing';

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone blocked', 'MeetMaster needs microphone access to record a meeting.');
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPickedUri(null);
      setPickedMime(null);
      setPhase('recording');
      setStatusText('Recording in progress. Speak clearly toward the phone.');
    } catch (error) {
      Alert.alert('Could not start recording', error.message || String(error));
    }
  };

  const pauseRecording = () => {
    recorder.pause();
    setPhase('paused');
    setStatusText('Recording paused. Resume or stop when the discussion ends.');
  };

  const resumeRecording = () => {
    recorder.record();
    setPhase('recording');
    setStatusText('Recording resumed.');
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      const uri = recorder.uri;
      if (!uri) {
        setPhase('idle');
        Alert.alert('No audio saved', 'The recorder did not return a file URI.');
        return;
      }
      setPickedUri(uri);
      setPickedMime('audio/mp4');
      setPhase('idle');
      setStatusText('Audio saved on this device. Process with Gemini or pick a different clip.');
    } catch (error) {
      Alert.alert('Stop failed', error.message || String(error));
    }
  };

  const pickSampleAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      setPickedUri(asset.uri);
      setPickedMime(asset.mimeType || null);
      setStatusText(`Loaded ${asset.name || 'audio clip'}. Ready to process.`);
    } catch (error) {
      Alert.alert('Picker failed', error.message || String(error));
    }
  };

  const processAudio = async () => {
    if (!pickedUri) {
      Alert.alert('No audio yet', 'Record a meeting or pick a sample clip first.');
      return;
    }
    setPhase('processing');
    setStatusText('Sending audio to Gemini for minutes, speakers, and tasks...');
    try {
      const processed = await processMeetingAudio(pickedUri, pickedMime);
      const meeting = buildLocalMeeting(processed, pickedUri);
      const saved = await addMeeting(meeting);
      navigation.replace('MeetingDetail', { meetingId: saved.id });
    } catch (error) {
      setPhase('idle');
      setStatusText('Processing failed. Check the Gemini key, then try again.');
      Alert.alert('Gemini processing failed', error.message || String(error));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.stage}>
        <View style={[styles.ring, isRecording && styles.ringLive]}>
          <Text style={styles.timer}>{isBusy ? 'AI' : elapsed}</Text>
          <Text style={styles.timerLabel}>
            {isBusy ? 'Processing' : isRecording ? 'Recording' : isPaused ? 'Paused' : pickedUri ? 'Audio ready' : 'Standby'}
          </Text>
        </View>
        <Text style={styles.status}>{statusText}</Text>
        {pickedUri ? <Text style={styles.uri} numberOfLines={2}>{pickedUri}</Text> : null}
      </View>

      <View style={styles.controls}>
        {phase === 'idle' && !isBusy ? (
          <Pressable style={styles.primary} onPress={startRecording}>
            <Text style={styles.primaryText}>Start recording</Text>
          </Pressable>
        ) : null}
        {isRecording ? (
          <View style={styles.row}>
            <Pressable style={styles.secondary} onPress={pauseRecording}>
              <Text style={styles.secondaryText}>Pause</Text>
            </Pressable>
            <Pressable style={styles.danger} onPress={stopRecording}>
              <Text style={styles.primaryText}>Stop</Text>
            </Pressable>
          </View>
        ) : null}
        {isPaused ? (
          <View style={styles.row}>
            <Pressable style={styles.primary} onPress={resumeRecording}>
              <Text style={styles.primaryText}>Resume</Text>
            </Pressable>
            <Pressable style={styles.danger} onPress={stopRecording}>
              <Text style={styles.primaryText}>Stop</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable style={styles.ghost} onPress={pickSampleAudio} disabled={isBusy || isRecording || isPaused}>
          <Text style={styles.ghostText}>Pick sample audio clip</Text>
        </Pressable>
        <Pressable
          style={[styles.process, !pickedUri || isBusy ? styles.processDisabled : null]}
          onPress={processAudio}
          disabled={!pickedUri || isBusy}
        >
          {isBusy ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryText}>Process with Gemini</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  ring: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 8,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLive: {
    borderColor: colors.danger,
  },
  timer: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '800',
  },
  timerLabel: {
    color: colors.muted,
    marginTop: 6,
    fontWeight: '700',
    letterSpacing: 1,
  },
  status: {
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 22,
  },
  uri: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
  controls: {
    padding: spacing.md,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
  },
  primaryText: {
    color: colors.bg,
    fontWeight: '800',
    fontSize: 16,
  },
  secondary: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  danger: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
  },
  ghost: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostText: {
    color: colors.teal,
    fontWeight: '800',
  },
  process: {
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  processDisabled: {
    opacity: 0.45,
  },
});
