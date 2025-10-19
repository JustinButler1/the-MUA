import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

// Mock data for team
const mockTeam = {
  id: '1',
  name: 'yes team test team',
  members: [
    {
      id: '1',
      name: 'Test',
      type: 'REGISTERED USER',
    },
    {
      id: '2',
      name: 'guestalex',
      type: 'GUEST PLAYER',
    },
  ],
};

export default function TeamManagerScreen() {
  const colorScheme = useColorScheme();
  const [teamName, setTeamName] = useState(mockTeam.name);

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Team Name Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>TEAM NAME</ThemedText>
          <TextInput
            style={styles.teamNameInput}
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Enter team name"
            placeholderTextColor="#9BA1A6"
          />
        </View>

        {/* Roster Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>ROSTER</ThemedText>
          {mockTeam.members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <ThemedText style={styles.memberName}>{member.name}</ThemedText>
                <ThemedText style={styles.memberType}>{member.type}</ThemedText>
              </View>
              {member.type === 'GUEST PLAYER' && (
                <TouchableOpacity style={styles.replaceButton}>
                  <ThemedText style={styles.replaceButtonText}>Replace with Registered Player</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton}>
            <ThemedText style={styles.buttonText}>Show Team QR</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <ThemedText style={styles.buttonText}>Save Changes</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dangerButton}>
            <ThemedText style={styles.buttonText}>Archive Team</ThemedText>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEDEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#0A0A0F',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerTitle: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ECEDEE',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  teamNameInput: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    color: '#ECEDEE',
    borderWidth: 0,
  },
  memberCard: {
    backgroundColor: '#1A1A24',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEDEE',
  },
  memberType: {
    fontSize: 12,
    color: '#9BA1A6',
    fontWeight: '500',
  },
  replaceButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  replaceButtonText: {
    color: '#ECEDEE',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 16,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  dangerButton: {
    backgroundColor: '#991B1B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
