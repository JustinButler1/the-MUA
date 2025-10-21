import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function AccountManagementScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

