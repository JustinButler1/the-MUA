import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

/**
 * Presents a form to create a new group in the system.
 *
 * How it works:
 * - Collects a group name (required) and optional description.
 * - Generates a slug from the name (kebab-case) and attempts to insert a new `grp` row.
 * - On success, adds the creator as `owner` in `grp_member` and creates a `subscription` for the user.
 * - Navigates back on success and surfaces validation/insert errors via alerts.
 *
 * @returns A screen with inputs and actions to create a group.
 */
export default function CreateGroupScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slug = useMemo(() =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, ''),
  [name]);

  const handleCancel = () => {
    router.back();
  };

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Not signed in', 'You must be signed in to create a group.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a group name.');
      return;
    }

    if (!slug) {
      Alert.alert('Invalid name', 'Please choose a different name.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1) Create the group
      const { data: group, error: grpError } = await supabase
        .from('grp')
        .insert({
          name: name.trim(),
          slug,
          description: description.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (grpError) {
        if (grpError.code === '23505' || grpError.message?.toLowerCase().includes('unique')) {
          Alert.alert('Name unavailable', 'A group with a similar slug already exists. Try another name.');
        } else {
          Alert.alert('Create failed', 'Could not create the group.');
        }
        return;
      }

      if (!group?.id) {
        Alert.alert('Create failed', 'Unexpected error creating the group.');
        return;
      }

      // 2) Add creator as owner
      const { error: memberError } = await supabase
        .from('grp_member')
        .insert({
          grp_id: group.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        console.error('grp_member insert error', memberError);
        Alert.alert('Partial success', 'Group created but failed to add you as owner.');
        // Continue to try subscription regardless
      }

      // 3) Subscribe creator to group
      const { error: subError } = await supabase
        .from('subscription')
        .insert({
          grp_id: group.id,
          user_id: user.id,
        });

      if (subError && subError.code !== '23505') {
        console.error('subscription insert error', subError);
      }

      Alert.alert('Group created', 'Your group has been created successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error('Create group error', e);
      Alert.alert('Create failed', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: colors.text }]}>Group Name</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: '#1A1A24' }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter a group name"
            placeholderTextColor="#9BA1A6"
            autoCapitalize="words"
            autoCorrect
          />
          {!!slug && (
            <ThemedText style={[styles.hint, { color: colors.text, opacity: 0.6 }]}>Slug: {slug}</ThemedText>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: colors.text }]}>Description (optional)</ThemedText>
          <TextInput
            style={[styles.textarea, { color: colors.text, backgroundColor: '#1A1A24' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the purpose of this group"
            placeholderTextColor="#9BA1A6"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isSubmitting}>
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.disabled]}
            onPress={handleCreate}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ECEDEE" />
            ) : (
              <ThemedText style={styles.saveText}>Create Group</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 30,
    flexGrow: 1,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 0,
  },
  textarea: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1A1A24',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  cancelText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  saveText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
});
