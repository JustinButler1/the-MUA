import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

/**
 * Groups button component for navigating to teams/groups page
 * Displays as a prominent button with icon and text
 */
export function GroupsButton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const handlePress = () => {
    router.push('/groups');
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.tint,
          borderColor: colors.tint,
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <IconSymbol
        name="person.3.fill"
        size={20}
        color="#FFFFFF"
      />
      <ThemedText style={styles.buttonText}>
        Groups
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
