import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface ScannedPartner {
  userId: string;
  displayName: string;
}

export default function CreateTeamScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [partnerType, setPartnerType] = useState<'registered' | 'guest'>('guest');
  const [guestName, setGuestName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedPartner, setScannedPartner] = useState<ScannedPartner | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleScanQR = async () => {
    if (!permission || !permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera permission is required to scan QR codes');
        return;
      }
    }
    
    setShowScanner(true);
  };

  const handleQRScanned = async (data: string) => {
    try {
      const qrData = JSON.parse(data);
      
      // Check if it's a profile QR code
      if (qrData.type !== 'profile') {
        Alert.alert('Invalid QR Code', 'Please scan a profile QR code');
        return;
      }

      const { userId, displayName } = qrData;

      // Verify the user exists in the database
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .eq('user_id', userId)
        .single();

      if (error || !profileData) {
        Alert.alert('Error', 'Could not find user profile');
        return;
      }

      // Set the scanned partner
      setScannedPartner({
        userId: profileData.user_id,
        displayName: profileData.display_name || displayName
      });

      setShowScanner(false);
      Alert.alert('Success', `Added ${profileData.display_name || displayName} as your partner!`);
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert('Error', 'Invalid QR code format');
    }
  };

  const handleSaveTeam = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a team');
      return;
    }

    if (!teamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }

    if (partnerType === 'guest' && !guestName.trim()) {
      Alert.alert('Error', 'Please enter a guest name');
      return;
    }

    if (partnerType === 'registered' && !scannedPartner) {
      Alert.alert('Error', 'Please scan a partner\'s QR code');
      return;
    }

    setIsLoading(true);

    try {
      // Create the team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName.trim(),
          created_by: user.id
        })
        .select()
        .single();

      if (teamError) {
        console.error('Error creating team:', teamError);
        Alert.alert('Error', 'Failed to create team');
        return;
      }

      const teamId = teamData.id;

      // Add current user as team member (slot 1)
      const { error: userMemberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          slot: 1,
          user_id: user.id
        });

      if (userMemberError) {
        console.error('Error adding user to team:', userMemberError);
        Alert.alert('Error', 'Failed to add you to the team');
        return;
      }

      // Handle partner based on type
      if (partnerType === 'guest') {
        // Create guest
        const { data: guestData, error: guestError } = await supabase
          .from('team_guests')
          .insert({
            team_id: teamId,
            display_name: guestName.trim()
          })
          .select()
          .single();

        if (guestError) {
          console.error('Error creating guest:', guestError);
          Alert.alert('Error', 'Failed to create guest');
          return;
        }

        // Add guest as team member (slot 2)
        const { error: guestMemberError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            slot: 2,
            guest_id: guestData.id
          });

        if (guestMemberError) {
          console.error('Error adding guest to team:', guestMemberError);
          Alert.alert('Error', 'Failed to add guest to the team');
          return;
        }
      } else {
        // Add registered partner as team member (slot 2)
        const { error: partnerMemberError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            slot: 2,
            user_id: scannedPartner!.userId
          });

        if (partnerMemberError) {
          console.error('Error adding partner to team:', partnerMemberError);
          Alert.alert('Error', 'Failed to add partner to the team');
          return;
        }
      }

      Alert.alert('Success', 'Team created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]);
    } catch (error) {
      console.error('Error creating team:', error);
      Alert.alert('Error', 'Failed to create team');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      <ScrollView contentContainerStyle={styles.scrollContent}>

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
          <ThemedText style={styles.sectionLabel}>Player 1 (You)</ThemedText>
          <View style={styles.playerInfoCard}>
            <ThemedText style={styles.playerName}>{user?.user_metadata?.display_name || 'You'}</ThemedText>
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
              onPress={() => {
                setPartnerType('registered');
                setGuestName('');
              }}
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
              onPress={() => {
                setPartnerType('guest');
                setScannedPartner(null);
              }}
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
              {scannedPartner ? (
                <View style={styles.playerInfoCard}>
                  <ThemedText style={styles.playerName}>{scannedPartner.displayName}</ThemedText>
                  <ThemedText style={styles.playerId}>{scannedPartner.userId}</ThemedText>
                  <TouchableOpacity 
                    style={styles.changeScanButton}
                    onPress={handleScanQR}
                  >
                    <ThemedText style={styles.changeScanButtonText}>Scan Different Partner</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <ThemedText style={styles.teammateDescription}>
                    Scan a profile QR code to add a registered teammate.
                  </ThemedText>
                  <TouchableOpacity 
                    style={styles.scanQRButton}
                    onPress={handleScanQR}
                  >
                    <ThemedText style={styles.scanQRButtonText}>Scan Profile QR</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
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
          
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSaveTeam}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ECEDEE" />
            ) : (
              <ThemedText style={styles.saveButtonText}>Save Team</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* QR Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <ThemedText style={styles.scannerTitle}>Scan Profile QR Code</ThemedText>
            <TouchableOpacity
              style={styles.closeScannerButton}
              onPress={() => setShowScanner(false)}
            >
              <ThemedText style={styles.closeScannerText}>✕</ThemedText>
            </TouchableOpacity>
          </View>
          
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={({ data }) => {
              if (data) {
                handleQRScanned(data);
              }
            }}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
          
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <ThemedText style={styles.scannerInstruction}>
              Position the QR code within the frame
            </ThemedText>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 30,
    flexGrow: 1,
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  changeScanButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  changeScanButtonText: {
    color: '#ECEDEE',
    fontSize: 14,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1A1A24',
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECEDEE',
  },
  closeScannerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeScannerText: {
    fontSize: 20,
    color: '#ECEDEE',
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scannerInstruction: {
    marginTop: 20,
    fontSize: 16,
    color: '#ECEDEE',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
