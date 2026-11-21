import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

export function SpeakerBubble({ segment }) {
  const isSecond = segment.speaker === 'Speaker 2';
  return (
    <View style={[styles.wrap, isSecond ? styles.right : styles.left]}>
      <View style={[styles.bubble, isSecond ? styles.bubbleTwo : styles.bubbleOne]}>
        <View style={styles.header}>
          <View style={[styles.tag, isSecond ? styles.tagTwo : styles.tagOne]}>
            <Text style={styles.tagText}>{segment.speaker}</Text>
          </View>
          <Text style={styles.time}>{segment.timestamp}</Text>
        </View>
        <Text style={styles.text}>{segment.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
    maxWidth: '92%',
  },
  left: {
    alignSelf: 'flex-start',
  },
  right: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
  },
  bubbleOne: {
    backgroundColor: colors.speaker1Soft,
    borderColor: colors.speaker1,
  },
  bubbleTwo: {
    backgroundColor: colors.speaker2Soft,
    borderColor: colors.speaker2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 10,
  },
  tag: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagOne: {
    backgroundColor: colors.speaker1,
  },
  tagTwo: {
    backgroundColor: colors.speaker2,
  },
  tagText: {
    color: colors.bg,
    fontSize: 11,
    fontWeight: '800',
  },
  time: {
    color: colors.muted,
    fontSize: 12,
  },
  text: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
