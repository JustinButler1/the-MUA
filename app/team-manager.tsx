import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// Types for team data
interface TeamMember {
  id: string;
  name: string;
  type: 'REGISTERED USER' | 'GUEST PLAYER';
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}

export default function TeamManagerScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId || !user) {
        Alert.alert('Error', 'No team ID provided');
        router.back();
        return;
      }

      try {
        // Fetch team data
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id, name')
          .eq('id', teamId)
          .single();

        if (teamError) {
          console.error('Error fetching team:', teamError);
          Alert.alert('Error', 'Failed to load team data');
          return;
        }

        // Fetch team members
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select(`
            slot,
            profiles(display_name),
            team_guests(display_name)
          `)
          .eq('team_id', teamId)
          .order('slot', { ascending: true });

        if (membersError) {
          console.error('Error fetching team members:', membersError);
          Alert.alert('Error', 'Failed to load team members');
          return;
        }

        // Process members data
        const members: TeamMember[] = membersData?.map((member: any) => {
          if (member.profiles?.display_name) {
            return {
              id: `user-${member.slot}`,
              name: member.profiles.display_name,
              type: 'REGISTERED USER' as const
            };
          } else if (member.team_guests?.display_name) {
            return {
              id: `guest-${member.slot}`,
              name: member.team_guests.display_name,
              type: 'GUEST PLAYER' as const
            };
          }
          return null;
        }).filter((member): member is TeamMember => member !== null) || [];

        const teamInfo: Team = {
          id: teamData.id,
          name: teamData.name,
          members
        };

        setTeam(teamInfo);
        setTeamName(teamData.name);
      } catch (error) {
        console.error('Error fetching team data:', error);
        Alert.alert('Error', 'Failed to load team data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, user]);

  const handleSaveChanges = async () => {
    if (!team || !teamId) return;

    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: teamName.trim() })
        .eq('id', teamId);

      if (error) {
        console.error('Error updating team:', error);
        Alert.alert('Error', 'Failed to save changes');
        return;
      }

      Alert.alert('Success', 'Team updated successfully!');
    } catch (error) {
      console.error('Error saving team:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handleArchiveTeam = async () => {
    if (!team || !teamId) return;

    Alert.alert(
      'Archive Team',
      'Are you sure you want to archive this team? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('teams')
                .update({ archived: true })
                .eq('id', teamId);

              if (error) {
                console.error('Error archiving team:', error);
                Alert.alert('Error', 'Failed to archive team');
                return;
              }

              Alert.alert('Success', 'Team archived successfully!', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error archiving team:', error);
              Alert.alert('Error', 'Failed to archive team');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <ThemedText style={styles.loadingText}>Loading team data...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!team) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.errorText}>Team not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

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
          {team.members.map((member) => (
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
          <TouchableOpacity style={styles.primaryButton} onPress={() => setShowQRModal(true)}>
            <ThemedText style={styles.buttonText}>Show Team QR</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveChanges}>
            <ThemedText style={styles.buttonText}>Save Changes</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleArchiveTeam}>
            <ThemedText style={styles.buttonText}>Archive Team</ThemedText>
          </TouchableOpacity>
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
              <ThemedText style={styles.qrModalTitle}>Team QR Code</ThemedText>
              <ThemedText style={styles.qrModalSubtitle}>{team.name}</ThemedText>
              
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={teamId || ''}
                  size={240}
                  backgroundColor="white"
                  color="black"
                />
              </View>
              
              <ThemedText style={styles.qrModalDescription}>
                Share this QR code with others to let them join your team
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
    paddingTop: 30,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#ECEDEE',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
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
