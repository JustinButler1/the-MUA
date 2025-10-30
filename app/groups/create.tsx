import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [bannerImageUri, setBannerImageUri] = useState<string | null>(null);

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

  /**
   * Opens the device image library to pick a single image and stores the URI in the provided setter.
   * Uses expo-image-picker; the selected URI will be used later for upload after the group is created.
   *
   * @param setUri - React state setter for the chosen image URI
   */
  const handlePickImage = async (setUri: (uri: string | null) => void) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow photo library access to pick an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('pick image error', e);
      Alert.alert('Image picker error', 'Could not open image library.');
    }
  };

  /**
   * Uploads a local image URI to Supabase Storage and returns a public URL.
   * Saves under the 'media' bucket at groups/{groupId}/{kind}-{timestamp}.jpg.
   *
   * @param groupId - Group owner id to build the storage path
   * @param localUri - Local file URI (from ImagePicker)
   * @param kind - 'profile' | 'banner' used in filename
   * @returns Publicly accessible URL string
   */
  const uploadGroupImageAndGetUrl = async (groupId: string, localUri: string, kind: 'profile' | 'banner'): Promise<string | null> => {
    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const ext = blob.type === 'image/png' ? 'png' : 'jpg';
      const path = `groups/${groupId}/${kind}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, arrayBuffer, {
          contentType: blob.type || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('storage upload error', uploadError);
        return null;
      }

      const { data: publicData } = supabase.storage.from('media').getPublicUrl(path);
      return publicData?.publicUrl ?? null;
    } catch (e) {
      console.error('upload image error', e);
      return null;
    }
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

      // 1b) If images were chosen, upload and create media_asset rows
      try {
        const inserts: Array<Promise<any>> = [];
        if (profileImageUri) {
          inserts.push((async () => {
            const url = await uploadGroupImageAndGetUrl(group.id, profileImageUri, 'profile');
            if (url) {
              const { error } = await supabase
                .from('media_asset')
                .insert({
                  owner_type: 'group',
                  owner_id: group.id,
                  url,
                  mime: 'image/jpeg',
                  is_primary: true,
                  sort_order: 0,
                  meta: { kind: 'profile' },
                });
              if (error) console.error('media_asset insert (profile) error', error);
            }
          })());
        }
        if (bannerImageUri) {
          inserts.push((async () => {
            const url = await uploadGroupImageAndGetUrl(group.id, bannerImageUri, 'banner');
            if (url) {
              const { error } = await supabase
                .from('media_asset')
                .insert({
                  owner_type: 'group',
                  owner_id: group.id,
                  url,
                  mime: 'image/jpeg',
                  is_primary: false,
                  sort_order: 1,
                  meta: { kind: 'banner' },
                });
              if (error) console.error('media_asset insert (banner) error', error);
            }
          })());
        }
        if (inserts.length) await Promise.all(inserts);
      } catch (mediaErr) {
        console.error('media upload error', mediaErr);
        // Non-blocking; continue
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

        {/* Optional Images */}
        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: colors.text }]}>Group Picture (optional)</ThemedText>
          {profileImageUri ? (
            <View style={{ gap: 10 }}>
              <View style={styles.imagePreviewSquare}>
                <Image source={{ uri: profileImageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: '#1A1A24' }]}
                  onPress={() => handlePickImage(setProfileImageUri)}
                >
                  <ThemedText style={[styles.secondaryButtonText]}>Change</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: '#1A1A24' }]}
                  onPress={() => setProfileImageUri(null)}
                >
                  <ThemedText style={[styles.secondaryButtonText]}>Remove</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.pickButton, { backgroundColor: '#1A1A24' }]}
              onPress={() => handlePickImage(setProfileImageUri)}
            >
              <ThemedText style={styles.pickButtonText}>Pick a profile image</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: colors.text }]}>Banner (optional)</ThemedText>
          {bannerImageUri ? (
            <View style={{ gap: 10 }}>
              <View style={styles.imagePreviewBanner}>
                <Image source={{ uri: bannerImageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: '#1A1A24' }]}
                  onPress={() => handlePickImage(setBannerImageUri)}
                >
                  <ThemedText style={[styles.secondaryButtonText]}>Change</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: '#1A1A24' }]}
                  onPress={() => setBannerImageUri(null)}
                >
                  <ThemedText style={[styles.secondaryButtonText]}>Remove</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.pickButton, { backgroundColor: '#1A1A24' }]}
              onPress={() => handlePickImage(setBannerImageUri)}
            >
              <ThemedText style={styles.pickButtonText}>Pick a banner image</ThemedText>
            </TouchableOpacity>
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
  pickButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  pickButtonText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ECEDEE',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewSquare: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  imagePreviewBanner: {
    width: '100%',
    aspectRatio: 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
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
