import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StatusBar, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

interface Team {
  id: string;
  name: string;
  members: string;
}

const hands: any[] = [
  // Mock hands data - empty initially
];

export default function LiveSpadesScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [gameHands, setGameHands] = useState(hands);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeam1, setSelectedTeam1] = useState<Team | null>(null);
  const [selectedTeam2, setSelectedTeam2] = useState<Team | null>(null);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [showTargetScoreModal, setShowTargetScoreModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [team1Bid, setTeam1Bid] = useState(4);
  const [team2Bid, setTeam2Bid] = useState(4);
  const [team1BlindBid, setTeam1BlindBid] = useState(false);
  const [team2BlindBid, setTeam2BlindBid] = useState(false);
  const [team1Book, setTeam1Book] = useState(0);
  const [team2Book, setTeam2Book] = useState(0);
  const [waitingForBooks, setWaitingForBooks] = useState(false);
  const [targetScore, setTargetScore] = useState(500);
  const [tempTargetScore, setTempTargetScore] = useState(500);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scanningRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const [gameStartTime] = useState(new Date());
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  const fetchTeams = useCallback(async () => {
    if (!user) {
      setIsLoadingTeams(false);
      return;
    }

    try {
      // Fetch teams where user is a member
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!inner(id, name)
        `)
        .eq('user_id', user.id);

      if (teamError) {
        console.error('Error fetching teams:', teamError);
        setIsLoadingTeams(false);
        return;
      }

      // Get unique team IDs
      const uniqueTeamIds = [...new Set(teamMembers?.map((member: any) => member.team_id) || [])];

      // Fetch detailed team info including all members
      const teamsData: Team[] = [];
      for (const teamId of uniqueTeamIds) {
        const { data: teamData, error: teamFetchError } = await supabase
          .from('teams')
          .select('id, name')
          .eq('id', teamId)
          .single();

        if (teamFetchError || !teamData) {
          console.error('Error fetching team:', teamFetchError);
          continue;
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
        }

        // Format members list
        const memberNames = membersData?.map((member: any) => {
          if (member.profiles?.display_name) {
            return member.profiles.display_name;
          } else if (member.team_guests?.display_name) {
            return member.team_guests.display_name;
          }
          return null;
        }).filter((name): name is string => name !== null) || [];

        teamsData.push({
          id: teamData.id,
          name: teamData.name,
          members: memberNames.join(' · '),
        });
      }

      setAvailableTeams(teamsData);
      
      // Set first team as default if not already selected
      if (teamsData.length > 0 && !selectedTeam1) {
        setSelectedTeam1(teamsData[0]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoadingTeams(false);
    }
  }, [user, selectedTeam1]);

  // Fetch teams when component mounts or when coming back to the screen
  useFocusEffect(
    useCallback(() => {
      fetchTeams();
    }, [fetchTeams])
  );

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

  const finishGame = async () => {
    // Validate that we have both teams
    if (!selectedTeam1) {
      Alert.alert('Error', 'Please select Team 1 before finishing the game.');
      return;
    }

    if (!selectedTeam2) {
      Alert.alert('Error', 'Please scan Team 2 before finishing the game.');
      return;
    }

    // Validate that we have at least one completed hand
    if (gameHands.length === 0 || gameHands.every(hand => hand.status !== 'completed')) {
      Alert.alert('Error', 'Please complete at least one hand before finishing the game.');
      return;
    }

    // Check if there's a hand waiting for books
    if (waitingForBooks) {
      Alert.alert('Error', 'Please complete the current hand before finishing the game.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to save a game.');
      return;
    }

    setIsSaving(true);

    try {
      // Determine winner (null on tie)
      const winnerTeamId: string | null =
        team1Score === team2Score
          ? null
          : (team1Score > team2Score ? selectedTeam1.id : selectedTeam2.id);
      const completedAt = new Date().toISOString();

      // Insert game record
      const { data: gameData, error: gameError } = await supabase
        .from('spades_games')
        .insert({
          team1_id: selectedTeam1.id,
          team2_id: selectedTeam2.id,
          goal_score: targetScore,
          started_at: gameStartTime.toISOString(),
          status: 'completed',
          created_by: user.id,
        })
        .select()
        .single();

      if (gameError) {
        console.error('Error inserting game:', gameError);
        Alert.alert('Error', 'Failed to save game. Please try again.');
        return;
      }

      const gameId = gameData.id;

      // Note: Team member snapshot is automatically created by database trigger
      // (trg_snapshot_game_team_members) when the game is inserted

      // Insert game outcome (this fires stats trigger)
      const { error: outcomeError } = await supabase
        .from('spades_game_outcomes')
        .insert({
          game_id: gameId,
          team1_id: selectedTeam1.id,
          team2_id: selectedTeam2.id,
          winner_team_id: winnerTeamId,
          team1_total: team1Score,
          team2_total: team2Score,
          completed_at: completedAt,
        });

      if (outcomeError) {
        console.error('Error inserting outcome:', outcomeError);
        Alert.alert('Error', 'Failed to save game outcome. Please try again.');
        return;
      }

      // Insert all hands
      const completedHands = gameHands.filter(hand => hand.status === 'completed');
      const handsToInsert = completedHands.map((hand, index) => {
        // Calculate running totals for this hand
        let team1TotalAfter = 0;
        let team2TotalAfter = 0;
        
        for (let i = 0; i <= index; i++) {
          team1TotalAfter += completedHands[i].team1Points || 0;
          team2TotalAfter += completedHands[i].team2Points || 0;
        }

        return {
          game_id: gameId,
          hand_no: index + 1,
          team1_bid: hand.team1Bid,
          team2_bid: hand.team2Bid,
          team1_books: hand.team1Books,
          team2_books: hand.team2Books,
          team1_delta: hand.team1Points || 0,
          team2_delta: hand.team2Points || 0,
          team1_total_after: team1TotalAfter,
          team2_total_after: team2TotalAfter,
        };
      });

      if (handsToInsert.length > 0) {
        const { error: handsError } = await supabase
          .from('spades_hands')
          .insert(handsToInsert);

        if (handsError) {
          console.error('Error inserting hands:', handsError);
          // Don't show error to user since game and outcome were saved
        }
      }

      // Success! Navigate back to spades screen
      Alert.alert('Success', 'Game saved successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Unexpected error saving game:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
    scanningRef.current = false;
    lastScanTimeRef.current = 0;
    setShowQRScanner(true);
  };

  const fetchTeamFromQRCode = async (data: string): Promise<Team | null> => {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(data);
      if (parsed.type === 'team' && parsed.teamId) {
        // Fetch team data from Supabase
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id, name')
          .eq('id', parsed.teamId)
          .single();

        if (teamError || !teamData) {
          console.error('Error fetching team:', teamError);
          return null;
        }

        // Fetch team members
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select(`
            slot,
            profiles(display_name),
            team_guests(display_name)
          `)
          .eq('team_id', parsed.teamId)
          .order('slot', { ascending: true });

        if (membersError) {
          console.error('Error fetching team members:', membersError);
        }

        // Format members list
        const memberNames = membersData?.map((member: any) => {
          if (member.profiles?.display_name) {
            return member.profiles.display_name;
          } else if (member.team_guests?.display_name) {
            return member.team_guests.display_name;
          }
          return null;
        }).filter((name): name is string => name !== null) || [];

        return {
          id: teamData.id,
          name: teamData.name,
          members: memberNames.join(' · '),
        };
      }
    } catch (error) {
      console.error('Error parsing QR code:', error);
    }
    return null;
  };

  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    // Immediate synchronous check to prevent concurrent scans
    if (scanningRef.current) return;
    
    // Debounce: require at least 2 seconds between scans
    const now = Date.now();
    if (now - lastScanTimeRef.current < 2000) return;
    
    // Mark as scanning immediately (synchronous)
    scanningRef.current = true;
    lastScanTimeRef.current = now;
    setHasScanned(true);
    
    // Show loading state
    const team = await fetchTeamFromQRCode(data);
    
    if (team) {
      setSelectedTeam2(team);
      Alert.alert('Team Added', `${team.name} has been set as Team 2!`, [
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

  const selectTeam = (team: Team) => {
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
      team1BlindBid,
      team2BlindBid,
      team1Books: null,
      team2Books: null,
      status: 'waiting_for_books'
    };
    
    setGameHands([...gameHands, newHand]);
    setWaitingForBooks(true);
    setShowBidModal(false);
    // Reset blind bid states for next hand
    setTeam1BlindBid(false);
    setTeam2BlindBid(false);
  };

  const saveBook = () => {
    // Update the last hand with book values
    const updatedHands = [...gameHands];
    const lastHandIndex = updatedHands.length - 1;
    const lastHand = updatedHands[lastHandIndex];
    
    // Calculate scores for each team
    const calculateScore = (bid: number, books: number, isBlind: boolean) => {
      // Special case: Bid of 0
      if (bid === 0) {
        if (books === 0) {
          // Made 0 bid: 100 points (or 200 if blind)
          return isBlind ? 200 : 100;
        } else {
          // Failed 0 bid: lose 100 points (or 200 if blind)
          return isBlind ? -200 : -100;
        }
      }
      
      if (isBlind) {
        // Blind bid: must get EXACTLY the bid amount
        if (books === bid) {
          // Success: 2x the normal bid points
          return bid * 10 * 2;
        } else {
          // Failure: lose 2x the bid points
          return bid * -10 * 2;
        }
      } else {
        // Regular bid
        if (books >= bid) {
          // Made the bid: 10 points per bid + 1 point per overtrick (bag)
          const bidPoints = bid * 10;
          const bags = books - bid;
          return bidPoints + bags;
        } else {
          // Failed to make bid: lose 10 points per bid
          return bid * -10;
        }
      }
    };
    
    const team1Points = calculateScore(lastHand.team1Bid, team1Book, lastHand.team1BlindBid);
    const team2Points = calculateScore(lastHand.team2Bid, team2Book, lastHand.team2BlindBid);
    
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
    setTeam1Bid(4);
    setTeam2Bid(4);
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
          {isLoadingTeams ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#EF4444" />
              <ThemedText style={styles.loadingText}>Loading teams...</ThemedText>
            </View>
          ) : selectedTeam1 ? (
            <TouchableOpacity 
              style={styles.teamCard}
              onPress={() => setShowTeamSelection(true)}
            >
              <ThemedText style={styles.teamName}>{selectedTeam1.name}</ThemedText>
              <ThemedText style={styles.teamMembers}>{selectedTeam1.members}</ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.teamCard}>
              <ThemedText style={styles.teamInstructions}>
                No teams available. Please create a team first.
              </ThemedText>
            </View>
          )}
        </View>

        {/* Team 2 Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>TEAM 2</ThemedText>
          {selectedTeam2 ? (
            <TouchableOpacity 
              style={styles.teamCard}
              onPress={scanTeamQR}
            >
              <ThemedText style={styles.teamName}>{selectedTeam2.name}</ThemedText>
              <ThemedText style={styles.teamMembers}>{selectedTeam2.members}</ThemedText>
              <ThemedText style={styles.tapToChangeText}>Tap to scan a different team</ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.teamCard}>
              <ThemedText style={styles.teamInstructions}>
                Scan the team QR from its details page to set the opponent.
              </ThemedText>
              <TouchableOpacity style={styles.scanQRButton} onPress={scanTeamQR}>
                <ThemedText style={styles.scanQRButtonText}>Scan Team QR</ThemedText>
              </TouchableOpacity>
            </View>
          )}
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
            {selectedTeam1 && selectedTeam2 && (
              <View style={styles.scoreTeamNames}>
                <ThemedText style={styles.scoreTeamName}>{selectedTeam1.name}</ThemedText>
                <ThemedText style={styles.scoreTeamSeparator}>vs</ThemedText>
                <ThemedText style={styles.scoreTeamName}>{selectedTeam2.name}</ThemedText>
              </View>
            )}
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
                        <ThemedText style={styles.handLabel}>{selectedTeam1?.name || 'Team 1'} Bid:</ThemedText>
                        <View style={styles.handBidValue}>
                          <ThemedText style={styles.handValue}>{hand.team1Bid}</ThemedText>
                          {hand.team1BlindBid && (
                            <View style={styles.blindBadge}>
                              <ThemedText style={styles.blindBadgeText}>BLIND</ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.handTeamRow}>
                        <ThemedText style={styles.handLabel}>{selectedTeam2?.name || 'Team 2'} Bid:</ThemedText>
                        <View style={styles.handBidValue}>
                          <ThemedText style={styles.handValue}>{hand.team2Bid}</ThemedText>
                          {hand.team2BlindBid && (
                            <View style={styles.blindBadge}>
                              <ThemedText style={styles.blindBadgeText}>BLIND</ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                      {hand.status === 'waiting_for_books' ? (
                        <ThemedText style={styles.waitingText}>Waiting for books...</ThemedText>
                      ) : (
                        <>
                          <View style={styles.handTeamRow}>
                            <ThemedText style={styles.handLabel}>{selectedTeam1?.name || 'Team 1'} Books:</ThemedText>
                            <ThemedText style={styles.handValue}>{hand.team1Books}</ThemedText>
                          </View>
                          <View style={styles.handTeamRow}>
                            <ThemedText style={styles.handLabel}>{selectedTeam2?.name || 'Team 2'} Books:</ThemedText>
                            <ThemedText style={styles.handValue}>{hand.team2Books}</ThemedText>
                          </View>
                          <View style={styles.handDivider} />
                          <View style={styles.handTeamRow}>
                            <ThemedText style={styles.handLabel}>{selectedTeam1?.name || 'Team 1'} Points:</ThemedText>
                            <ThemedText style={[
                              styles.handValue,
                              hand.team1Points > 0 ? styles.positivePoints : styles.negativePoints
                            ]}>
                              {hand.team1Points > 0 ? '+' : ''}{hand.team1Points}
                            </ThemedText>
                          </View>
                          <View style={styles.handTeamRow}>
                            <ThemedText style={styles.handLabel}>{selectedTeam2?.name || 'Team 2'} Points:</ThemedText>
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
          
          <TouchableOpacity 
            style={[styles.finishButton, isSaving && styles.finishButtonDisabled]} 
            onPress={finishGame}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ECEDEE" />
            ) : (
              <ThemedText style={styles.finishButtonText}>Finish Game</ThemedText>
            )}
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
                    selectedTeam1?.id === team.id && styles.teamOptionSelected
                  ]}
                  onPress={() => selectTeam(team)}
                >
                  <ThemedText style={[
                    styles.teamOptionName,
                    selectedTeam1?.id === team.id && styles.teamOptionNameSelected
                  ]}>
                    {team.name}
                  </ThemedText>
                  <ThemedText style={[
                    styles.teamOptionMembers,
                    selectedTeam1?.id === team.id && styles.teamOptionMembersSelected
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
        onRequestClose={() => {
          setShowBidModal(false);
          setTeam1BlindBid(false);
          setTeam2BlindBid(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bidModalContent}>
            <ThemedText style={styles.modalTitle}>Add Bid</ThemedText>
            
            <View style={styles.bidsContainer}>
              {/* Team 1 Bid */}
              <View style={styles.bidSection}>
                <ThemedText style={styles.bidTeamHeader}>{selectedTeam1?.name || 'Team 1'}</ThemedText>
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
                <View style={styles.blindBidToggle}>
                  <ThemedText style={styles.blindBidLabel}>Blind Bid</ThemedText>
                  <Switch
                    value={team1BlindBid}
                    onValueChange={setTeam1BlindBid}
                    trackColor={{ false: '#2A2A2A', true: '#EF4444' }}
                    thumbColor={team1BlindBid ? '#ECEDEE' : '#9BA1A6'}
                  />
                </View>
                {team1BlindBid && (
                  <ThemedText style={styles.blindBidDescription}>
                    Must get exactly {team1Bid || 0} books. 2x points if successful, 2x loss if failed.
                  </ThemedText>
                )}
              </View>

              {/* Team 2 Bid */}
              <View style={styles.bidSection}>
                <ThemedText style={styles.bidTeamHeader}>{selectedTeam2?.name || 'Team 2'}</ThemedText>
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
                <View style={styles.blindBidToggle}>
                  <ThemedText style={styles.blindBidLabel}>Blind Bid</ThemedText>
                  <Switch
                    value={team2BlindBid}
                    onValueChange={setTeam2BlindBid}
                    trackColor={{ false: '#2A2A2A', true: '#EF4444' }}
                    thumbColor={team2BlindBid ? '#ECEDEE' : '#9BA1A6'}
                  />
                </View>
                {team2BlindBid && (
                  <ThemedText style={styles.blindBidDescription}>
                    Must get exactly {team2Bid || 0} books. 2x points if successful, 2x loss if failed.
                  </ThemedText>
                )}
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.bidModalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowBidModal(false);
                  setTeam1BlindBid(false);
                  setTeam2BlindBid(false);
                }}
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
                <ThemedText style={styles.bidTeamHeader}>{selectedTeam1?.name || 'Team 1'}</ThemedText>
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
                <ThemedText style={styles.bidTeamHeader}>{selectedTeam2?.name || 'Team 2'}</ThemedText>
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
    paddingTop: 30,
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
    flexGrow: 1,
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
  tapToChangeText: {
    fontSize: 12,
    color: '#9BA1A6',
    marginTop: 8,
    fontStyle: 'italic',
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
  scoreTeamNames: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  scoreTeamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA1A6',
  },
  scoreTeamSeparator: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9BA1A6',
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
  finishButtonDisabled: {
    opacity: 0.5,
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
    lineHeight: 48,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#ECEDEE',
    fontSize: 14,
    marginLeft: 8,
  },
  blindBidToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  blindBidLabel: {
    fontSize: 16,
    color: '#ECEDEE',
    fontWeight: '600',
  },
  blindBidDescription: {
    fontSize: 12,
    color: '#9BA1A6',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  handBidValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blindBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  blindBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ECEDEE',
  },
});
