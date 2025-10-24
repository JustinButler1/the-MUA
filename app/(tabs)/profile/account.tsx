import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { checkUsernameAvailability, updateUsername, validateUsernameFormat } from '@/lib/username-validation';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function AccountManagementScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const colors = Colors[colorScheme ?? 'dark'];

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  // Debounced username validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (newUsername && newUsername !== profile?.display_name) {
        validateUsername(newUsername);
      } else {
        setUsernameError(null);
        setUsernameValid(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [newUsername]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateUsername = async (username: string) => {
    setIsCheckingUsername(true);
    setUsernameError(null);

    const formatCheck = validateUsernameFormat(username);
    if (!formatCheck.valid) {
      setUsernameError(formatCheck.error || null);
      setUsernameValid(false);
      setIsCheckingUsername(false);
      return;
    }

    const availabilityCheck = await checkUsernameAvailability(username, user?.id);
    if (!availabilityCheck.available) {
      setUsernameError(availabilityCheck.error || null);
      setUsernameValid(false);
    } else {
      setUsernameError(null);
      setUsernameValid(true);
    }

    setIsCheckingUsername(false);
  };

  const handleUpdateUsername = async () => {
    if (!user?.id || !usernameValid) return;

    setIsSaving(true);
    const result = await updateUsername(user.id, newUsername);

    if (result.success) {
      Alert.alert('Success', 'Username updated successfully');
      setShowUsernameModal(false);
      setNewUsername('');
      fetchProfile();
    } else {
      Alert.alert('Error', result.error || 'Failed to update username');
    }

    setIsSaving(false);
  };

  const openUsernameModal = () => {
    setNewUsername(profile?.display_name || '');
    setShowUsernameModal(true);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Account Settings</ThemedText>
          </View>

          <View style={[styles.settingsCard, { backgroundColor: '#1A1A24' }]}>
            {/* Username */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={openUsernameModal}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="person-outline" size={24} color="#EF4444" />
                <View style={styles.settingContent}>
                  <ThemedText style={styles.settingLabel}>Username</ThemedText>
                  <ThemedText style={styles.settingValue}>
                    {profile?.display_name || 'Not set'}
                  </ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9BA1A6" />
            </TouchableOpacity>

            {/* Email (read-only) */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="mail-outline" size={24} color="#EF4444" />
                <View style={styles.settingContent}>
                  <ThemedText style={styles.settingLabel}>Email</ThemedText>
                  <ThemedText style={styles.settingValue}>
                    {user?.email || 'Not set'}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Archived Teams Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Archived Teams</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Teams you've archived from Team Manager
            </ThemedText>
          </View>
          
          <View style={[styles.emptyState, { backgroundColor: '#1A1A24' }]}>
            <Ionicons name="people-outline" size={48} color="#9BA1A6" style={styles.emptyIcon} />
            <ThemedText style={styles.emptyText}>No archived teams</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Archived teams will appear here and can be restored
            </ThemedText>
          </View>
        </View>

        {/* Archived Games Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Archived Games</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Games you've archived from your history
            </ThemedText>
          </View>
          
          <View style={[styles.emptyState, { backgroundColor: '#1A1A24' }]}>
            <Ionicons name="game-controller-outline" size={48} color="#9BA1A6" style={styles.emptyIcon} />
            <ThemedText style={styles.emptyText}>No archived games</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Archived games will appear here and can be restored
            </ThemedText>
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoCard, { backgroundColor: '#1A1A24' }]}>
          <Ionicons name="information-circle-outline" size={24} color="#EF4444" />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>About Archiving</ThemedText>
            <ThemedText style={styles.infoText}>
              Archiving teams and games helps keep your active lists organized. 
              Archived items can be restored at any time and won't be deleted.
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Username Edit Modal */}
      <Modal
        visible={showUsernameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUsernameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#1A1A24' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Change Username</ThemedText>
              <TouchableOpacity onPress={() => setShowUsernameModal(false)}>
                <Ionicons name="close" size={28} color="#9BA1A6" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>New Username</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: '#2a2a2f',
                    color: colors.text,
                    borderWidth: usernameError ? 2 : 0,
                    borderColor: usernameError ? '#ff4444' : 'transparent',
                  }]}
                  placeholder="Enter new username"
                  placeholderTextColor="#9BA1A6"
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isCheckingUsername && (
                  <ActivityIndicator
                    size="small"
                    color="#EF4444"
                    style={styles.inputIcon}
                  />
                )}
                {!isCheckingUsername && usernameValid && newUsername && (
                  <Text style={[styles.inputIcon, { color: '#00aa00', fontSize: 20 }]}>✓</Text>
                )}
              </View>
              {usernameError && (
                <Text style={styles.validationError}>{usernameError}</Text>
              )}
              {!usernameError && newUsername && usernameValid && newUsername !== profile?.display_name && (
                <Text style={styles.validationSuccess}>Username is available!</Text>
              )}
              <Text style={[styles.inputHint, { color: '#9BA1A6' }]}>
                3-20 characters: letters, numbers, underscores, hyphens
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: '#2a2a2f' }]}
                onPress={() => setShowUsernameModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: usernameValid && newUsername !== profile?.display_name ? '#EF4444' : '#555',
                    opacity: usernameValid && newUsername !== profile?.display_name ? 1 : 0.5,
                  },
                ]}
                onPress={handleUpdateUsername}
                disabled={!usernameValid || isSaving || newUsername === profile?.display_name}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ECEDEE',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9BA1A6',
  },
  settingsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3A',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingContent: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: '#9BA1A6',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEDEE',
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEDEE',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9BA1A6',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEDEE',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#9BA1A6',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3A',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ECEDEE',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWithIcon: {
    position: 'relative',
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: 15,
  },
  validationError: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  validationSuccess: {
    color: '#00aa00',
    fontSize: 12,
    marginTop: 4,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9BA1A6',
  },
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

