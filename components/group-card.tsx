import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface GroupCardProps {
  groupId: string;
  groupName: string;
  groupDescription?: string;
  memberCount: number;
  eventCount: number;
  isSubscribed?: boolean;
  onPress: (groupId: string) => void;
}

/**
 * Group card component displaying group information
 * Shows group name, description, member count, and event count
 */
export function GroupCard({ 
  groupId, 
  groupName, 
  groupDescription, 
  memberCount, 
  eventCount, 
  isSubscribed = true,
  onPress 
}: GroupCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <TouchableOpacity 
      style={[
        styles.groupCard,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        }
      ]}
      onPress={() => onPress(groupId)}
      activeOpacity={0.7}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupIcon}>
          <IconSymbol
            name="person.3.fill"
            size={24}
            color={colors.tint}
          />
        </View>
        <View style={styles.groupInfo}>
          <ThemedText style={[styles.groupName, { color: colors.text }]}>
            {groupName}
          </ThemedText>
          {groupDescription && (
            <ThemedText style={[styles.groupDescription, { color: colors.text, opacity: 0.7 }]}>
              {groupDescription}
            </ThemedText>
          )}
        </View>
      </View>
      
      <View style={styles.groupStats}>
        <View style={styles.statItem}>
          <IconSymbol
            name="person.fill"
            size={14}
            color={colors.text}
            style={{ opacity: 0.6 }}
          />
          <ThemedText style={[styles.statText, { color: colors.text, opacity: 0.7 }]}>
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </ThemedText>
        </View>
        
        <View style={styles.statItem}>
          <IconSymbol
            name="calendar"
            size={14}
            color={colors.text}
            style={{ opacity: 0.6 }}
          />
          <ThemedText style={[styles.statText, { color: colors.text, opacity: 0.7 }]}>
            {eventCount} event{eventCount !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
});
