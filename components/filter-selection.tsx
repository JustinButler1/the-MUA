import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export type FilterOption = 'all' | 'today' | 'this-week' | 'this-month';

interface FilterSelectionProps {
  selectedFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

/**
 * Filter selection component for home page events
 * Allows users to filter events by time period
 */
export function FilterSelection({ selectedFilter, onFilterChange }: FilterSelectionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const filterOptions: { value: FilterOption; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: 'list.bullet' },
    { value: 'today', label: 'Today', icon: 'calendar.day.timeline.left' },
    { value: 'this-week', label: 'This Week', icon: 'calendar' },
    { value: 'this-month', label: 'This Month', icon: 'calendar.badge.clock' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterButton,
              {
                backgroundColor: selectedFilter === option.value 
                  ? colors.tint 
                  : colors.background,
                borderColor: selectedFilter === option.value 
                  ? colors.tint 
                  : colors.border,
              }
            ]}
            onPress={() => onFilterChange(option.value)}
            activeOpacity={0.7}
          >
            <IconSymbol
              name={option.icon as any}
              size={16}
              color={selectedFilter === option.value ? '#FFFFFF' : colors.text}
            />
            <ThemedText
              style={[
                styles.filterText,
                {
                  color: selectedFilter === option.value ? '#FFFFFF' : colors.text,
                }
              ]}
            >
              {option.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
