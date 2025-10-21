import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

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
  const [gameHands, setGameHands] = useState(hands);
  const [selectedTeam1, setSelectedTeam1] = useState(availableTeams[0]);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [showTargetScoreModal, setShowTargetScoreModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [team1Bid, setTeam1Bid] = useState(0);
  const [team2Bid, setTeam2Bid] = useState(0);
  const [team1Book, setTeam1Book] = useState(0);
  const [team2Book, setTeam2Book] = useState(0);
  const [waitingForBooks, setWaitingForBooks] = useState(false);
  const [targetScore, setTargetScore] = useState(500);
  const [tempTargetScore, setTempTargetScore] = useState(500);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);

  const addHand = () => {
    if (waitingForBooks) {
      setShowBookModal(true);
    } else {
      setShowBidModal(true);
    }
  };

  const undoLast = () => {
    if (gameHands.length === 0) {
      // Don't show modal if there are no hands
      return;
    }
    setShowUndoModal(true);
  };

  const confirmUndo = () => {
    if (gameHands.length === 0) {
      setShowUndoModal(false);
      return;
    }

    const lastHand = gameHands[gameHands.length - 1];
    const updatedHands = [...gameHands];
    
    if (lastHand.status === 'completed') {
      // Last action was adding books - revert to waiting for books
      // Subtract the points from scores
      setTeam1Score(prevScore => prevScore - (lastHand.team1Points || 0));
      setTeam2Score(prevScore => prevScore - (lastHand.team2Points || 0));
      
      // Update the hand to remove books and go back to waiting state
      updatedHands[updatedHands.length - 1] = {
        ...lastHand,
        team1Books: null,
        team2Books: null,
        team1Points: undefined,
        team2Points: undefined,
        status: 'waiting_for_books'
      };
      
      setGameHands(updatedHands);
      setWaitingForBooks(true);
    } else if (lastHand.status === 'waiting_for_books') {
      // Last action was adding bids - remove the entire hand
      updatedHands.pop();
      setGameHands(updatedHands);
      
      // Check if there's still a hand waiting for books
      if (updatedHands.length > 0) {
        const newLastHand = updatedHands[updatedHands.length - 1];
        if (newLastHand.status === 'waiting_for_books') {
          setWaitingForBooks(true);
        } else {
          setWaitingForBooks(false);
        }
      } else {
        setWaitingForBooks(false);
      }
    }
    
    setShowUndoModal(false);
  };

  const cancelUndo = () => {
    setShowUndoModal(false);
  };

  const openTargetScoreModal = () => {
    setTempTargetScore(targetScore);
    setShowTargetScoreModal(true);
  };

  const incrementTargetScore = () => {
    setTempTargetScore(prev => {
      if (prev === 500) return 100;
      return prev + 50;
    });
  };

  const decrementTargetScore = () => {
    setTempTargetScore(prev => {
      if (prev === 100) return 500;
      return prev - 50;
    });
  };

  const saveTargetScore = () => {
    setTargetScore(tempTargetScore);
    setShowTargetScoreModal(false);
  };

  const cancelTargetScore = () => {
    setShowTargetScoreModal(false);
  };

  const finishGame = () => {
    // This would finish the game and save it
    console.log('Finish game pressed');
  };

  const scanTeamQR = async () => {
    if (!permission) {
      // Request permission if we don't have it yet
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to scan QR codes.');
        return;
      }
    } else if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to scan QR codes.');
        return;
      }
    }
    
    setHasScanned(false);
    setShowQRScanner(true);
  };

  const validateQRCode = (data: string): boolean => {
    // For now, we'll check if the QR code contains a team ID
    // Format: team:{teamId} or just check if it's in our availableTeams
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(data);
      if (parsed.type === 'team' && parsed.teamId) {
        // Check if team exists in our available teams
        return availableTeams.some(team => team.id === parsed.teamId);
      }
    } catch {
      // If not JSON, check if it matches team:{id} format
      if (data.startsWith('team:')) {
        const teamId = data.split(':')[1];
        return availableTeams.some(team => team.id === teamId);
      }
    }
    return false;
  };

  const handleBarcodeScanned = ({ data }: { type: string; data: string }) => {
    if (hasScanned) return;
    
    setHasScanned(true);
    const isValid = validateQRCode(data);
    
    if (isValid) {
      Alert.alert('Valid QR Code', 'This is a valid team QR code!', [
        {
          text: 'OK',
          onPress: () => setShowQRScanner(false),
        },
      ]);
    } else {
      Alert.alert('Invalid QR Code', 'This QR code is not valid or does not belong to a team.', [
        {
          text: 'OK',
          onPress: () => setShowQRScanner(false),
        },
      ]);
    }
  };

  const selectTeam = (team: typeof availableTeams[0]) => {
    setSelectedTeam1(team);
    setShowTeamSelection(false);
  };

  const incrementTeam1Bid = () => {
    setTeam1Bid(prev => {
      if (prev === 13) return 0;
      if (prev === 0) return 4;
      return prev + 1;
    });
  };

  const decrementTeam1Bid = () => {
    setTeam1Bid(prev => {
      if (prev === 0) return 13;
      if (prev === 4) return 0;
      return prev - 1;
    });
  };

  const incrementTeam2Bid = () => {
    setTeam2Bid(prev => {
      if (prev === 13) return 0;
      if (prev === 0) return 4;
      return prev + 1;
    });
  };

  const decrementTeam2Bid = () => {
    setTeam2Bid(prev => {
      if (prev === 0) return 13;
      if (prev === 4) return 0;
      return prev - 1;
    });
  };

  const incrementTeam1Book = () => {
    setTeam1Book(prev => {
      if (prev === 13) return 0;
      return prev + 1;
    });
  };

  const decrementTeam1Book = () => {
    setTeam1Book(prev => {
      if (prev === 0) return 13;
      return prev - 1;
    });
  };

  const incrementTeam2Book = () => {
    setTeam2Book(prev => {
      if (prev === 13) return 0;
      return prev + 1;
    });
  };

  const decrementTeam2Book = () => {
    setTeam2Book(prev => {
      if (prev === 0) return 13;
      return prev - 1;
    });
  };

  const saveBid = () => {
    // Create new hand entry with bids
    const newHand = {
      id: Date.now(),
      team1Bid,
      team2Bid,
      team1Books: null,
      team2Books: null,
      status: 'waiting_for_books'
    };
    
    setGameHands([...gameHands, newHand]);
    setWaitingForBooks(true);
    setShowBidModal(false);
  };

  const saveBook = () => {
    // Update the last hand with book values
    const updatedHands = [...gameHands];
    const lastHandIndex = updatedHands.length - 1;
    const lastHand = updatedHands[lastHandIndex];
    
    // Calculate scores for each team
    const calculateScore = (bid: number, books: number) => {
      if (books >= bid) {
        // Made the bid: 10 points per bid + 1 point per overtrick (bag)
        const bidPoints = bid * 10;
        const bags = books - bid;
        return bidPoints + bags;
      } else {
        // Failed to make bid: lose 10 points per bid
        return bid * -10;
      }
    };
    
    const team1Points = calculateScore(lastHand.team1Bid, team1Book);
    const team2Points = calculateScore(lastHand.team2Bid, team2Book);
    
    updatedHands[lastHandIndex] = {
      ...updatedHands[lastHandIndex],
      team1Books: team1Book,
      team2Books: team2Book,
      team1Points,
      team2Points,
      status: 'completed'
    };
    
    setGameHands(updatedHands);
    setTeam1Score(prevScore => prevScore + team1Points);
    setTeam2Score(prevScore => prevScore + team2Points);
    setWaitingForBooks(false);
    setTeam1Book(0);
    setTeam2Book(0);
    setShowBookModal(false);
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
            <TouchableOpacity 
              style={styles.targetScorePill}
              onPress={openTargetScoreModal}
            >
              <ThemedText style={styles.targetScoreText}>{targetScore} pts</ThemedText>
            </TouchableOpacity>
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
                  Tap 'Add Bid' to capture bids and books for each round.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.handsList}>
                {gameHands.map((hand, index) => (
                  <View key={hand.id} style={styles.handItem}>
                    <ThemedText style={styles.handNumber}>Hand {index + 1}</ThemedText>
                    <View style={styles.handDetails}>
                      <View style={styles.handTeamRow}>
                        <ThemedText style={styles.handLabel}>Team 1 Bid:</ThemedText>
                        <ThemedText style={styles.handValue}>{hand.team1Bid}</ThemedText>
                      </View>
                      <View style={styles.handTeamRow}>
                        <ThemedText style={styles.handLabel}>Team 2 Bid:</ThemedText>
                        <ThemedText style={styles.handValue}>{hand.team2Bid}</ThemedText>
                      </View>
                      {hand.status === 'waiting_for_books' ? (
                        <ThemedText style={styles.waitingText}>Waiting for books...</ThemedText>
                      ) : (
                        <>
                          <View style={styles.handTeamRow}>
                            <ThemedText style={styles.handLabel}>Team 1 Books:</ThemedText>
                            <ThemedText style={styles.handValue}>{hand.team1Books}</ThemedText>
                          </View>
                          <View style={styles.handTeamRow}>
                            <ThemedText style={styles.handLabel}>Team 2 Books:</ThemedText>
                            <ThemedText style={styles.handValue}>{hand.team2Books}</ThemedText>
                          </View>
                          <View style={styles.handDivider} />
                          <View style={styles.handTeamRow}>
                            <ThemedText style={styles.handLabel}>Team 1 Points:</ThemedText>
                            <ThemedText style={[
                              styles.handValue,
                              hand.team1Points > 0 ? styles.positivePoints : styles.negativePoints
                            ]}>
                              {hand.team1Points > 0 ? '+' : ''}{hand.team1Points}
                            </ThemedText>
                          </View>
                          <View style={styles.handTeamRow}>
                            <ThemedText style={styles.handLabel}>Team 2 Points:</ThemedText>
                            <ThemedText style={[
                              styles.handValue,
                              hand.team2Points > 0 ? styles.positivePoints : styles.negativePoints
                            ]}>
                              {hand.team2Points > 0 ? '+' : ''}{hand.team2Points}
                            </ThemedText>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <View style={styles.topButtons}>
            <TouchableOpacity style={styles.addHandButton} onPress={addHand}>
              <ThemedText style={styles.addHandButtonText}>
                {waitingForBooks ? 'Add Book' : 'Add Bid'}
              </ThemedText>
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

      {/* Add Bid Modal */}
      <Modal
        visible={showBidModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBidModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bidModalContent}>
            <ThemedText style={styles.modalTitle}>Add Bid</ThemedText>
            
            <View style={styles.bidsContainer}>
              {/* Team 1 Bid */}
              <View style={styles.bidSection}>
                <ThemedText style={styles.bidTeamHeader}>Team 1</ThemedText>
                <View style={styles.bidControls}>
                  <TouchableOpacity 
                    style={styles.bidButton}
                    onPress={decrementTeam1Bid}
                  >
                    <ThemedText style={styles.bidButtonText}>-</ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.bidValue}>{team1Bid}</ThemedText>
                  <TouchableOpacity 
                    style={styles.bidButton}
                    onPress={incrementTeam1Bid}
                  >
                    <ThemedText style={styles.bidButtonText}>+</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Team 2 Bid */}
              <View style={styles.bidSection}>
                <ThemedText style={styles.bidTeamHeader}>Team 2</ThemedText>
                <View style={styles.bidControls}>
                  <TouchableOpacity 
                    style={styles.bidButton}
                    onPress={decrementTeam2Bid}
                  >
                    <ThemedText style={styles.bidButtonText}>-</ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.bidValue}>{team2Bid}</ThemedText>
                  <TouchableOpacity 
                    style={styles.bidButton}
                    onPress={incrementTeam2Bid}
                  >
                    <ThemedText style={styles.bidButtonText}>+</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.bidModalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowBidModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveBid}
              >
                <ThemedText style={styles.saveButtonText}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Book Modal */}
      <Modal
        visible={showBookModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBookModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bidModalContent}>
            <ThemedText style={styles.modalTitle}>Add Book</ThemedText>
            
            <View style={styles.bidsContainer}>
              {/* Team 1 Book */}
              <View style={styles.bidSection}>
                <ThemedText style={styles.bidTeamHeader}>Team 1</ThemedText>
                <View style={styles.bidControls}>
                  <TouchableOpacity 
                    style={styles.bidButton}
                    onPress={decrementTeam1Book}
                  >
                    <ThemedText style={styles.bidButtonText}>-</ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.bidValue}>{team1Book}</ThemedText>
                  <TouchableOpacity 
                    style={styles.bidButton}
                    onPress={incrementTeam1Book}
                  >
                    <ThemedText style={styles.bidButtonText}>+</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Team 2 Book */}
              <View style={styles.bidSection}>
                <ThemedText style={styles.bidTeamHeader}>Team 2</ThemedText>
                <View style={styles.bidControls}>
                  <TouchableOpacity 
                    style={styles.bidButton}
                    onPress={decrementTeam2Book}
                  >
                    <ThemedText style={styles.bidButtonText}>-</ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.bidValue}>{team2Book}</ThemedText>
                  <TouchableOpacity 
                    style={styles.bidButton}
                    onPress={incrementTeam2Book}
                  >
                    <ThemedText style={styles.bidButtonText}>+</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.bidModalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowBookModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveBook}
              >
                <ThemedText style={styles.saveButtonText}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Undo Confirmation Modal */}
      <Modal
        visible={showUndoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUndoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <ThemedText style={styles.modalTitle}>Are you sure?</ThemedText>
            <ThemedText style={styles.confirmModalText}>
              Do you want to undo the last hand?
            </ThemedText>
            
            <View style={styles.bidModalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={cancelUndo}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={confirmUndo}
              >
                <ThemedText style={styles.saveButtonText}>Confirm</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Target Score Modal */}
      <Modal
        visible={showTargetScoreModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTargetScoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bidModalContent}>
            <ThemedText style={styles.modalTitle}>Target Score</ThemedText>
            
            <View style={styles.targetScoreSection}>
              <View style={styles.bidControls}>
                <TouchableOpacity 
                  style={styles.bidButton}
                  onPress={decrementTargetScore}
                >
                  <ThemedText style={styles.bidButtonText}>-</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.bidValue}>{tempTargetScore}</ThemedText>
                <TouchableOpacity 
                  style={styles.bidButton}
                  onPress={incrementTargetScore}
                >
                  <ThemedText style={styles.bidButtonText}>+</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.bidModalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={cancelTargetScore}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveTargetScore}
              >
                <ThemedText style={styles.saveButtonText}>Confirm</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <ThemedText style={styles.scannerTitle}>Scan Team QR Code</ThemedText>
            <TouchableOpacity
              style={styles.closeScannerButton}
              onPress={() => setShowQRScanner(false)}
            >
              <ThemedText style={styles.closeScannerButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </View>
          
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame} />
              <ThemedText style={styles.scannerInstructions}>
                Position the QR code within the frame
              </ThemedText>
            </View>
          </CameraView>
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
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 8,
    lineHeight: 28,
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
    lineHeight: 48,
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
    gap: 12,
  },
  handItem: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  handNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
  },
  handDetails: {
    gap: 8,
  },
  handTeamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  handLabel: {
    fontSize: 14,
    color: '#9BA1A6',
  },
  handValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEDEE',
  },
  waitingText: {
    fontSize: 14,
    color: '#EF4444',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  handDivider: {
    height: 1,
    backgroundColor: '#3A3A3A',
    marginVertical: 8,
  },
  positivePoints: {
    color: '#22C55E',
  },
  negativePoints: {
    color: '#EF4444',
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
  // Bid Modal styles
  bidModalContent: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  bidsContainer: {
    gap: 24,
    marginBottom: 24,
  },
  bidSection: {
    alignItems: 'center',
  },
  bidTeamHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 16,
  },
  bidControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  bidButton: {
    backgroundColor: '#EF4444',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bidButtonText: {
    color: '#ECEDEE',
    fontSize: 32,
    fontWeight: '600',
  },
  bidValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ECEDEE',
    minWidth: 80,
    textAlign: 'center',
  },
  bidModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
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
  // Confirmation Modal styles
  confirmModalContent: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  confirmModalText: {
    fontSize: 16,
    color: '#9BA1A6',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  targetScoreSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  // QR Scanner styles
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
    backgroundColor: '#0A0A0F',
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ECEDEE',
  },
  closeScannerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeScannerButtonText: {
    fontSize: 24,
    color: '#ECEDEE',
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#EF4444',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerInstructions: {
    fontSize: 16,
    color: '#ECEDEE',
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
