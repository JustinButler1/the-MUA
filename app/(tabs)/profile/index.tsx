import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface PlayerStats {
  games: number;
  wins: number;
  losses: number;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchProfileData = async () => {
    if (!user?.id) return;

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch player stats
      const { data: statsData, error: statsError } = await supabase
        .from('player_stats_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        // PGRST116 is "not found" error - it's ok if user has no stats yet
        throw statsError;
      }
      console.log('statsData', statsData);
      console.log('user.id', user.id);
      setStats(statsData || { games: 0, wins: 0, losses: 0});
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
  };

  const getWinPercentage = () => {
    if (!stats || stats.games === 0) return '0';
    return ((stats.wins / stats.games) * 100).toFixed(0);
  };

  const getInitials = () => {
    if (!user) return '?';
    if (profile?.display_name) {
      return profile.display_name.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  };
  
  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.errorText}>Please sign in to view your profile</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: '#1A1A24' }]}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: '#2A2A3A' }]}>
            <ThemedText style={styles.avatarText}>{getInitials()}</ThemedText>
          </View>
          
          {/* Name */}
          <ThemedText style={styles.userName}>
            {profile?.display_name || user.email?.split('@')[0] || 'User'}
          </ThemedText>
          
          {/* Buttons */}
          <TouchableOpacity 
            style={[styles.accountButton, { backgroundColor: '#2A2A3A' }]}
            onPress={() => router.push('/(tabs)/profile/account')}
          >
            <ThemedText style={styles.buttonText}>Manage Account</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.qrButton, { backgroundColor: '#EF4444' }]}
            onPress={() => setShowQRModal(true)}
          >
            <ThemedText style={styles.buttonText}>Show Profile QR</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.signOutButton, { backgroundColor: '#2A2A3A', borderColor: '#EF4444' }]}
            onPress={handleSignOut}
          >
            <ThemedText style={[styles.buttonText, { color: '#EF4444' }]}>Sign Out</ThemedText>
          </TouchableOpacity>
        </View>
        {/* Game Records Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Game Records</ThemedText>
          <View style={[styles.recordsCard, { backgroundColor: '#1A1A24' }]}>
            <ThemedText style={styles.comingSoonText}>Coming Soon</ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowQRModal(false)}
        >
          <View style={styles.qrModalContent}>
            <TouchableOpacity 
              style={styles.qrModalInner}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <ThemedText style={styles.qrModalTitle}>Profile QR Code</ThemedText>
              <ThemedText style={styles.qrModalSubtitle}>
                {profile?.display_name || user?.email?.split('@')[0] || 'User'}
              </ThemedText>
              
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={JSON.stringify({ 
                    type: 'profile', 
                    userId: user?.id, 
                    displayName: profile?.display_name || user?.email?.split('@')[0] || 'User'
                  })}
                  size={240}
                  backgroundColor="white"
                  color="black"
                />
              </View>
              
              <ThemedText style={styles.qrModalDescription}>
                Share this QR code with others to connect your profile
              </ThemedText>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowQRModal(false)}
              >
                <ThemedText style={styles.closeButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  errorText: {
    fontSize: 16,
    color: '#9BA1A6',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flex: 1,
  },
  profileCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ECEDEE',
    lineHeight: 32,
    textAlign: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 8,
  },
  userDetail: {
    fontSize: 14,
    color: '#9BA1A6',
    marginBottom: 4,
  },
  accountButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  qrButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  signOutButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEDEE',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEDEE',
    marginBottom: 16,
  },
  recordsCard: {
    padding: 20,
    borderRadius: 12,
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 16,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#9BA1A6',
    textAlign: 'center',
    paddingVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9BA1A6',
  },
  additionalStats: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3A',
    alignItems: 'center',
  },
  statDetail: {
    fontSize: 14,
    color: '#9BA1A6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContent: {
    width: '85%',
    maxWidth: 400,
  },
  qrModalInner: {
    backgroundColor: '#1A1A24',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ECEDEE',
    marginBottom: 8,
    textAlign: 'center',
  },
  qrModalSubtitle: {
    fontSize: 16,
    color: '#9BA1A6',
    marginBottom: 24,
    textAlign: 'center',
  },
  qrCodeContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  qrModalDescription: {
    fontSize: 14,
    color: '#9BA1A6',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  closeButtonText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
