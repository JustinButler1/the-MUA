/**
 * EventCard component for displaying event information in the home feed
 * Shows event title, group name, start time, location, and RSVP status
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { EventInstanceWithDetails } from '@/lib/types/events';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface EventCardProps {
  event: EventInstanceWithDetails;
  onPress?: () => void;
}

/**
 * Formats a timestamp into a human-readable relative time
 * 
 * @param timestamp - ISO timestamp string
 * @returns Formatted time string like "Tomorrow at 3pm" or "In 5 days"
 */
function formatEventTime(timestamp: string): string {
  const now = new Date();
  const eventDate = new Date(timestamp);
  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const timeStr = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (diffDays === 0) {
    return `Today at ${timeStr}`;
  } else if (diffDays === 1) {
    return `Tomorrow at ${timeStr}`;
  } else if (diffDays < 7) {
    return `In ${diffDays} days at ${timeStr}`;
  } else {
    return eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

/**
 * Gets the appropriate color for RSVP status
 * 
 * @param status - RSVP status
 * @returns Color string
 */
function getRSVPStatusColor(status?: string): string {
  switch (status) {
    case 'going':
      return '#4CAF50'; // Green
    case 'interested':
      return '#FF9800'; // Orange
    case 'waitlisted':
      return '#9C27B0'; // Purple
    case 'not_going':
      return '#F44336'; // Red
    default:
      return '#757575'; // Gray
  }
}

/**
 * Gets the display text for RSVP status
 * 
 * @param status - RSVP status
 * @returns Display text
 */
function getRSVPStatusText(status?: string): string {
  switch (status) {
    case 'going':
      return 'Going';
    case 'interested':
      return 'Interested';
    case 'waitlisted':
      return 'Waitlisted';
    case 'not_going':
      return 'Not Going';
    default:
      return 'Not RSVPed';
  }
}

/**
 * Displays an event card with title, group, time, location, and RSVP info
 * 
 * @prop event - Event instance with details to display
 * @prop onPress - Optional callback when card is tapped
 * @returns A styled card component representing the event
 */
export function EventCard({ event, onPress }: EventCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const hasRSVP = !!event.user_rsvp;
  const rsvpStatus = event.user_rsvp?.status;
  const rsvpColor = getRSVPStatusColor(rsvpStatus);
  const rsvpText = getRSVPStatusText(rsvpStatus);

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.background }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ThemedView style={styles.cardContent}>
        {/* Event Title */}
        <ThemedText style={[styles.title, { color: colors.text }]}>
          {event.event_series.title}
        </ThemedText>
        
        {/* Group Name */}
        <ThemedText style={[styles.groupName, { color: colors.text, opacity: 0.7 }]}>
          {event.group.name}
        </ThemedText>
        
        {/* Time and Location */}
        <View style={styles.detailsRow}>
          <ThemedText style={[styles.time, { color: colors.text, opacity: 0.8 }]}>
            {formatEventTime(event.starts_at)}
          </ThemedText>
          
          {(event.location_text || event.venue?.name) && (
            <ThemedText style={[styles.location, { color: colors.text, opacity: 0.6 }]}>
              {event.location_text || event.venue?.name}
            </ThemedText>
          )}
        </View>
        
        {/* RSVP Status and Count */}
        <View style={styles.rsvpRow}>
          <View style={styles.rsvpStatus}>
            <View style={[styles.rsvpDot, { backgroundColor: rsvpColor }]} />
            <ThemedText style={[styles.rsvpText, { color: rsvpColor }]}>
              {rsvpText}
            </ThemedText>
          </View>
          
          <ThemedText style={[styles.rsvpCount, { color: colors.text, opacity: 0.6 }]}>
            {event.rsvp_count} {event.rsvp_count === 1 ? 'person' : 'people'}
          </ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  detailsRow: {
    marginBottom: 12,
  },
  time: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
  },
  rsvpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rsvpStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rsvpDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  rsvpText: {
    fontSize: 13,
    fontWeight: '500',
  },
  rsvpCount: {
    fontSize: 12,
  },
});
