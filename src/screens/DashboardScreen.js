import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskRow } from '../components/TaskRow';
import { useMeetings } from '../context/MeetingsContext';
import { colors, radius, spacing } from '../theme';
import { confirmMeetingDeletion, showMeetingDeletionError } from '../utils/confirmMeetingDeletion';
import { formatDate } from '../utils/format';

export default function DashboardScreen({ navigation }) {
  const { demoMode, toggleDemoMode, meetings, allTasks, stats, toggleTask, deleteMeeting, ready } = useMeetings();
  const [taskFilter, setTaskFilter] = useState('pending');
  const [deletingMeetingId, setDeletingMeetingId] = useState(null);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((item) => (taskFilter === 'completed' ? item.completed : !item.completed));
  }, [allTasks, taskFilter]);

  const openMeeting = (meetingId) => {
    navigation.navigate('MeetingDetail', { meetingId });
  };

  const requestMeetingDeletion = (meeting) => {
    confirmMeetingDeletion(meeting, async () => {
      setDeletingMeetingId(meeting.id);
      try {
        await deleteMeeting(meeting.id);
      } catch (error) {
        showMeetingDeletionError(error);
      } finally {
        setDeletingMeetingId(null);
      }
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.kicker}>AI MEETING INTELLIGENCE</Text>
            <Text style={styles.brand}>MeetMaster</Text>
          </View>
          <View style={styles.demoBox}>
            <Text style={styles.demoLabel}>Offline Demo Mode</Text>
            <Switch
              value={demoMode}
              onValueChange={toggleDemoMode}
              thumbColor={demoMode ? colors.teal : colors.muted}
              trackColor={{ false: colors.border, true: colors.accentSoft }}
            />
          </View>
        </View>

        <Pressable style={styles.cta} onPress={() => navigation.navigate('Record')}>
          <Text style={styles.ctaEyebrow}>CAPTURE</Text>
          <Text style={styles.ctaTitle}>Record Meeting</Text>
          <Text style={styles.ctaSub}>Mic recording or pick a sample clip, then Gemini writes the minutes.</Text>
        </Pressable>

        <View style={styles.statsRow}>
          <StatCard label="Total Meetings" value={ready ? stats.totalMeetings : '—'} />
          <StatCard label="Pending Tasks" value={ready ? stats.pendingTasks : '—'} accent={colors.pending} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Overdue" value={ready ? stats.overdueDeadlines : '—'} accent={colors.danger} />
          <StatCard label="Upcoming Deadlines" value={ready ? stats.upcomingDeadlines : '—'} accent={colors.teal} />
        </View>

        <Text style={styles.section}>Recent meetings</Text>
        {meetings.slice(0, 6).map((meeting) => (
          <View key={meeting.id} style={styles.meetingCard}>
            <View style={styles.meetingTop}>
              <Pressable style={styles.meetingHeading} onPress={() => openMeeting(meeting.id)}>
                <Text style={styles.meetingTitle}>{meeting.title}</Text>
              </Pressable>
              <View style={styles.meetingActions}>
                {meeting.isDemo ? (
                  <View style={styles.demoTag}>
                    <Text style={styles.demoTagText}>DEMO</Text>
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${meeting.title}`}
                  disabled={deletingMeetingId !== null}
                  hitSlop={8}
                  onPress={() => requestMeetingDeletion(meeting)}
                  style={styles.deleteMeetingButton}
                >
                  {deletingMeetingId === meeting.id ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <Text style={styles.deleteMeetingIcon}>×</Text>
                  )}
                </Pressable>
              </View>
            </View>
            <Pressable style={styles.meetingBody} onPress={() => openMeeting(meeting.id)}>
              <Text style={styles.meetingMeta}>{formatDate(meeting.date)}</Text>
              <Text style={styles.meetingSummary} numberOfLines={2}>
                {meeting.summary}
              </Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Action items & deadlines</Text>
          <View style={styles.filters}>
            <FilterChip label="Pending" active={taskFilter === 'pending'} onPress={() => setTaskFilter('pending')} />
            <FilterChip label="Completed" active={taskFilter === 'completed'} onPress={() => setTaskFilter('completed')} />
          </View>
        </View>

        {filteredTasks.length === 0 ? (
          <Text style={styles.empty}>No {taskFilter} tasks yet.</Text>
        ) : (
          filteredTasks.map((item) => (
            <TaskRow
              key={`${item.meetingId}-${item.id}`}
              item={item}
              showMeeting
              onToggle={(task) => toggleTask(task.meetingId, task.id)}
              onOpenMeeting={openMeeting}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: 12,
  },
  kicker: {
    color: colors.teal,
    fontSize: 11,
    letterSpacing: 1.4,
    fontWeight: '800',
  },
  brand: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 2,
  },
  demoBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  demoLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  cta: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  ctaEyebrow: {
    color: colors.accent,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontSize: 11,
  },
  ctaTitle: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  ctaSub: {
    color: colors.accent,
    marginTop: 6,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 12,
  },
  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionRow: {
    marginTop: 8,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 12,
  },
  chipTextActive: {
    color: colors.accent,
  },
  meetingCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  meetingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meetingHeading: {
    flex: 1,
  },
  meetingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteMeetingButton: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteMeetingIcon: {
    color: colors.danger,
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '700',
  },
  meetingTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  demoTag: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  demoTagText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  meetingMeta: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 12,
  },
  meetingSummary: {
    color: colors.text,
    marginTop: 8,
    lineHeight: 20,
  },
  meetingBody: {
    marginTop: 4,
  },
  empty: {
    color: colors.muted,
    marginBottom: spacing.md,
  },
});
