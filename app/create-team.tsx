import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateTeamScreen() {
  const colorScheme = useColorScheme();
  const [teamName, setTeamName] = useState('Late Night Renegades');
  const [partnerType, setPartnerType] = useState<'registered' | 'guest'>('registered');
  const [guestName, setGuestName] = useState('Alex Guest');

  const player1Info = {
    name: 'Test',
    id: 'cfe7e067-51a8-4f36-9f2e-9baa7ff010f4',
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Create Team Title */}
        <ThemedText style={styles.title}>Create Team</ThemedText>

        {/* Team Name Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Team Name</ThemedText>
          <TextInput
            style={styles.teamNameInput}
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Enter team name"
            placeholderTextColor="#9BA1A6"
          />
        </View>

        {/* Player 1 Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Player 1</ThemedText>
          <View style={styles.playerInfoCard}>
            <ThemedText style={styles.playerName}>{player1Info.name}</ThemedText>
            <ThemedText style={styles.playerId}>{player1Info.id}</ThemedText>
          </View>
        </View>

        {/* Partner Type Selection */}
        <View style={styles.section}>
          <View style={styles.partnerTypeContainer}>
            <TouchableOpacity
              style={[
                styles.partnerTypeButton,
                partnerType === 'registered' && styles.partnerTypeButtonSelected
              ]}
              onPress={() => setPartnerType('registered')}
            >
              <ThemedText style={[
                styles.partnerTypeButtonText,
                partnerType === 'registered' && styles.partnerTypeButtonTextSelected
              ]}>
                Registered Partner
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.partnerTypeButton,
                partnerType === 'guest' && styles.partnerTypeButtonSelected
              ]}
              onPress={() => setPartnerType('guest')}
            >
              <ThemedText style={[
                styles.partnerTypeButtonText,
                partnerType === 'guest' && styles.partnerTypeButtonTextSelected
              ]}>
                Guest Partner
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Teammate Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Teammate</ThemedText>
          
          {partnerType === 'registered' ? (
            <View>
              <ThemedText style={styles.teammateDescription}>
                Scan a profile QR code to add a registered teammate.
              </ThemedText>
              <TouchableOpacity style={styles.scanQRButton}>
                <ThemedText style={styles.scanQRButtonText}>Scan Profile QR</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <ThemedText style={styles.sectionLabel}>Guest Name</ThemedText>
              <TextInput
                style={styles.guestNameInput}
                value={guestName}
                onChangeText={setGuestName}
                placeholder="Enter guest name"
                placeholderTextColor="#9BA1A6"
              />
              <ThemedText style={styles.guestDescription}>
                A guest profile ID will be generated automatically.
              </ThemedText>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton}>
            <ThemedText style={styles.saveButtonText}>Save Team</ThemedText>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ECEDEE',
    textAlign: 'center',
    marginBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEDEE',
    marginBottom: 12,
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
  playerInfoCard: {
    backgroundColor: '#1A1A24',
    padding: 16,
    borderRadius: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEDEE',
    marginBottom: 4,
  },
  playerId: {
    fontSize: 14,
    color: '#9BA1A6',
  },
  partnerTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  partnerTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1A1A24',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  partnerTypeButtonSelected: {
    borderColor: '#EF4444',
  },
  partnerTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ECEDEE',
    textAlign: 'center',
  },
  partnerTypeButtonTextSelected: {
    color: '#EF4444',
  },
  teammateDescription: {
    fontSize: 14,
    color: '#ECEDEE',
    marginBottom: 16,
    lineHeight: 20,
  },
  scanQRButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  scanQRButtonText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  guestNameInput: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    color: '#ECEDEE',
    borderWidth: 0,
    marginBottom: 8,
  },
  guestDescription: {
    fontSize: 12,
    color: '#9BA1A6',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1A1A24',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  cancelButtonText: {
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
  saveButtonText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
