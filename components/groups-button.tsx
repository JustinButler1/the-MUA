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
      style={[styles.button, { backgroundColor: colors.tint }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <IconSymbol name="person.3.fill" size={24} color={colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
