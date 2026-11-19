import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { formatDeadline, isOverdue } from '../utils/format';

export function TaskRow({ item, onToggle, onOpenMeeting, showMeeting }) {
  const overdue = isOverdue(item.deadline, item.completed);

  return (
    <View style={styles.row}>
      <Pressable onPress={() => onToggle(item)} style={[styles.check, item.completed && styles.checkDone]}>
        <Text style={styles.checkMark}>{item.completed ? '✓' : ''}</Text>
      </Pressable>
      <Pressable style={styles.body} onPress={() => onOpenMeeting?.(item.meetingId)}>
        <Text style={[styles.task, item.completed && styles.taskDone]}>{item.task}</Text>
        <Text style={styles.meta}>
          {item.assignee || 'Unassigned'} · {formatDeadline(item.deadline)}
          {showMeeting && item.meetingTitle ? ` · ${item.meetingTitle}` : ''}
        </Text>
      </Pressable>
      <View style={[styles.badge, item.completed ? styles.badgeDone : overdue ? styles.badgeOverdue : styles.badgePending]}>
        <Text style={styles.badgeText}>{item.completed ? 'Done' : overdue ? 'Overdue' : 'Pending'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  checkDone: {
    backgroundColor: colors.done,
    borderColor: colors.done,
  },
  checkMark: {
    color: colors.bg,
    fontWeight: '800',
  },
  body: {
    flex: 1,
  },
  task: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  taskDone: {
    textDecorationLine: 'line-through',
    color: colors.muted,
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgePending: {
    backgroundColor: colors.pendingSoft,
  },
  badgeDone: {
    backgroundColor: colors.doneSoft,
  },
  badgeOverdue: {
    backgroundColor: colors.dangerSoft,
  },
  badgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
});
