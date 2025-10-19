import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  
  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: '#1A1A24' }]}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: '#2A2A3A' }]}>
            <ThemedText style={styles.avatarText}>T</ThemedText>
          </View>
          
          {/* Name */}
          <ThemedText style={styles.userName}>Test</ThemedText>
          
          {/* Email */}
          <ThemedText style={styles.userDetail}>Email · test@gmail.com</ThemedText>
          
          {/* User ID */}
          <ThemedText style={styles.userDetail}>User ID · cfe7e067-51a8-4f36-9f2e-9baa7ff010f4</ThemedText>
          
          {/* Buttons */}
          <TouchableOpacity style={[styles.accountButton, { backgroundColor: '#2A2A3A' }]}>
            <ThemedText style={styles.buttonText}>Manage Account</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.qrButton, { backgroundColor: '#EF4444' }]}>
            <ThemedText style={styles.buttonText}>Show Profile QR</ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Game Records Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Game Records</ThemedText>
          <View style={[styles.recordsCard, { backgroundColor: '#1A1A24' }]}>
            <ThemedText style={styles.gameName}>Spades</ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>2</ThemedText>
                <ThemedText style={styles.statLabel}>WINS</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>1</ThemedText>
                <ThemedText style={styles.statLabel}>LOSSES</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>3</ThemedText>
                <ThemedText style={styles.statLabel}>GAMES</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>67%</ThemedText>
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
