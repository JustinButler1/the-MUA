/**
 * EmptyFeed component for when there are no upcoming events
 * Shows a helpful message and prompts user to join groups or create events
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Displays an empty state when there are no upcoming events
 * Provides helpful messaging to guide users toward joining groups or creating events
 * 
 * @returns A styled empty state component
 */
export function EmptyFeed() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Icon placeholder - could be replaced with actual icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.text + '20' }]}>
          <ThemedText style={[styles.iconText, { color: colors.text }]}>
            📅
          </ThemedText>
        </View>
        
        {/* Main message */}
        <ThemedText style={[styles.title, { color: colors.text }]}>
          No Upcoming Events
        </ThemedText>
        
        {/* Subtitle */}
        <ThemedText style={[styles.subtitle, { color: colors.text, opacity: 0.7 }]}>
          Join groups to see their events here, or create your own events to get started.
        </ThemedText>
        
        {/* Action suggestions */}
        <View style={styles.suggestions}>
          <ThemedText style={[styles.suggestion, { color: colors.text, opacity: 0.6 }]}>
            • Join groups you're interested in
          </ThemedText>
          <ThemedText style={[styles.suggestion, { color: colors.text, opacity: 0.6 }]}>
            • Create events for your groups
          </ThemedText>
          <ThemedText style={[styles.suggestion, { color: colors.text, opacity: 0.6 }]}>
            • Check the calendar tab for more details
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  suggestions: {
    alignItems: 'flex-start',
  },
  suggestion: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});
