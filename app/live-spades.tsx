import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

// Mock data
const availableTeams = [
  {
    id: '1',
    name: 'New Boiled',
    members: 'Test · Nana',
  },
  {
    id: '2',
    name: 'yes team test team',
    members: 'Test · guestalex',
  },
  {
    id: '3',
    name: 'Spades Champions',
    members: 'Alice · Bob',
  },
  {
    id: '4',
    name: 'Card Masters',
    members: 'Charlie · Diana',
  },
];

const hands: any[] = [
  // Mock hands data - empty initially
];

export default function LiveSpadesScreen() {
  const colorScheme = useColorScheme();
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [targetScore] = useState(500);
  const [gameHands, setGameHands] = useState(hands);
  const [selectedTeam1, setSelectedTeam1] = useState(availableTeams[0]);
  const [showTeamSelection, setShowTeamSelection] = useState(false);

  const addHand = () => {
    // This would open a modal or navigate to add hand screen
    console.log('Add hand pressed');
  };

  const undoLast = () => {
    // This would undo the last hand
    console.log('Undo last pressed');
  };

  const finishGame = () => {
    // This would finish the game and save it
    console.log('Finish game pressed');
  };

  const scanTeamQR = () => {
    // This would open QR scanner
    console.log('Scan team QR pressed');
  };

  const selectTeam = (team: typeof availableTeams[0]) => {
    setSelectedTeam1(team);
    setShowTeamSelection(false);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Live Spades Game Title */}
        <ThemedText style={styles.title}>Live Spades Game</ThemedText>
        <ThemedText style={styles.description}>
          Track each hand as you play. When you finish, the match will be saved to your library.
        </ThemedText>

        {/* Team 1 Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>TEAM 1</ThemedText>
          <TouchableOpacity 
            style={styles.teamCard}
            onPress={() => setShowTeamSelection(true)}
          >
            <ThemedText style={styles.teamName}>{selectedTeam1.name}</ThemedText>
            <ThemedText style={styles.teamMembers}>{selectedTeam1.members}</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Team 2 Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>TEAM 2</ThemedText>
          <View style={styles.teamCard}>
            <ThemedText style={styles.teamInstructions}>
              Scan the team QR from its details page to set the opponent.
            </ThemedText>
            <TouchableOpacity style={styles.scanQRButton} onPress={scanTeamQR}>
              <ThemedText style={styles.scanQRButtonText}>Scan Team QR</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Score Section */}
        <View style={styles.section}>
          <View style={styles.scoreHeader}>
            <ThemedText style={styles.sectionLabel}>CURRENT SCORE</ThemedText>
            <View style={styles.targetScorePill}>
              <ThemedText style={styles.targetScoreText}>{targetScore} pts</ThemedText>
            </View>
          </View>
          <View style={styles.scoreDisplay}>
            <ThemedText style={styles.scoreText}>{team1Score} - {team2Score}</ThemedText>
          </View>
        </View>

        {/* Hands History Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>HANDS</ThemedText>
          <View style={styles.handsCard}>
            {gameHands.length === 0 ? (
              <View style={styles.emptyHands}>
                <ThemedText style={styles.emptyHandsTitle}>No hands yet</ThemedText>
                <ThemedText style={styles.emptyHandsDescription}>
                  Tap 'Add Hand' to capture bids and books for each round.
                </ThemedText>
              </View>
            ) : (
              <View>
                {/* This would render the hands list */}
                <ThemedText style={styles.handsList}>Hands will appear here</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <View style={styles.topButtons}>
            <TouchableOpacity style={styles.addHandButton} onPress={addHand}>
              <ThemedText style={styles.addHandButtonText}>Add Hand</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.undoButton} onPress={undoLast}>
              <ThemedText style={styles.undoButtonText}>Undo Last</ThemedText>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.finishButton} onPress={finishGame}>
            <ThemedText style={styles.finishButtonText}>Finish Game</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Team Selection Modal */}
      <Modal
        visible={showTeamSelection}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTeamSelection(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Select Team</ThemedText>
            
            <ScrollView style={styles.teamsList}>
              {availableTeams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.teamOption,
                    selectedTeam1.id === team.id && styles.teamOptionSelected
                  ]}
                  onPress={() => selectTeam(team)}
                >
                  <ThemedText style={[
                    styles.teamOptionName,
                    selectedTeam1.id === team.id && styles.teamOptionNameSelected
                  ]}>
                    {team.name}
                  </ThemedText>
                  <ThemedText style={[
                    styles.teamOptionMembers,
                    selectedTeam1.id === team.id && styles.teamOptionMembersSelected
                  ]}>
                    {team.members}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#9BA1A6',
    lineHeight: 24,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9BA1A6',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  teamCard: {
    backgroundColor: '#1A1A24',
    padding: 16,
    borderRadius: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 4,
  },
  teamMembers: {
    fontSize: 14,
    color: '#9BA1A6',
  },
  teamInstructions: {
    fontSize: 14,
    color: '#9BA1A6',
    marginBottom: 16,
    lineHeight: 20,
  },
  scanQRButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'center',
  },
  scanQRButtonText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetScorePill: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  targetScoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ECEDEE',
  },
  scoreDisplay: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ECEDEE',
  },
  handsCard: {
    backgroundColor: '#1A1A24',
    padding: 16,
    borderRadius: 12,
  },
  emptyHands: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyHandsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 8,
  },
  emptyHandsDescription: {
    fontSize: 14,
    color: '#9BA1A6',
    textAlign: 'center',
    lineHeight: 20,
  },
  handsList: {
    fontSize: 14,
    color: '#ECEDEE',
  },
  actionButtons: {
    marginTop: 32,
    gap: 16,
  },
  topButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  addHandButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addHandButtonText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  undoButton: {
    flex: 1,
    backgroundColor: '#1A1A24',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  undoButtonText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  finishButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  finishButtonText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 20,
    textAlign: 'center',
  },
  teamsList: {
    maxHeight: 300,
  },
  teamOption: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  teamOptionSelected: {
    backgroundColor: '#3A2A2A',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  teamOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 4,
  },
  teamOptionNameSelected: {
    color: '#EF4444',
  },
  teamOptionMembers: {
    fontSize: 14,
    color: '#9BA1A6',
  },
  teamOptionMembersSelected: {
    color: '#ECEDEE',
  },
});
