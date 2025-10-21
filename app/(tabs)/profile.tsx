import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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
          
          {/* Email */}
          {user.email && (
            <ThemedText style={styles.userDetail}>Email · {user.email}</ThemedText>
          )}
          
          {/* User ID */}
          <ThemedText style={styles.userDetail}>User ID · {String(user.id)}</ThemedText>
          
          {/* Buttons */}
          <TouchableOpacity style={[styles.accountButton, { backgroundColor: '#2A2A3A' }]}>
            <ThemedText style={styles.buttonText}>Manage Account</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.qrButton, { backgroundColor: '#EF4444' }]}>
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
            <ThemedText style={styles.gameName}>Spades</ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{String(stats?.wins || 0)}</ThemedText>
                <ThemedText style={styles.statLabel}>WINS</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{String(stats?.losses || 0)}</ThemedText>
                <ThemedText style={styles.statLabel}>LOSSES</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{String(stats?.games || 0)}</ThemedText>
                <ThemedText style={styles.statLabel}>GAMES</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{getWinPercentage()}%</ThemedText>
                <ThemedText style={styles.statLabel}>WIN %</ThemedText>
              </View>
            </View>
          </View>
        </View>
        
        {/* Quick Actions Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#1A1A24' }]}>
              <ThemedText style={styles.actionTitle}>Share ID</ThemedText>
              <ThemedText style={styles.actionDescription}>Invite friends to a table</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#1A1A24' }]}>
              <ThemedText style={styles.actionTitle}>History</ThemedText>
              <ThemedText style={styles.actionDescription}>View full match log</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEDEE',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#9BA1A6',
  },
});
