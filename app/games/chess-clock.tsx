import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

type PlayerSide = 'top' | 'bottom';

export default function ChessClockScreen() {
  const colorScheme = useColorScheme();
  const [topTime, setTopTime] = useState(600); // 10 minutes in seconds
  const [bottomTime, setBottomTime] = useState(600); // 10 minutes in seconds
  const [activePlayer, setActivePlayer] = useState<PlayerSide | null>(null);
  const [isPaused, setIsPaused] = useState(true);

  useEffect(() => {
    if (isPaused || !activePlayer) return;

    const interval = setInterval(() => {
      if (activePlayer === 'top') {
        setTopTime((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            setIsPaused(true);
            Alert.alert('Time\'s Up!', 'Bottom player wins!');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBottomTime((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            setIsPaused(true);
            Alert.alert('Time\'s Up!', 'Top player wins!');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activePlayer, isPaused]);

  const handleTopPress = () => {
    if (topTime <= 0 || bottomTime <= 0) return;
    
    // If paused, start the clock
    if (isPaused) {
      setIsPaused(false);
    }
    
    // Always switch to bottom player's turn when top is tapped
    setActivePlayer('bottom');
  };

  const handleBottomPress = () => {
    if (topTime <= 0 || bottomTime <= 0) return;
    
    // If paused, start the clock
    if (isPaused) {
      setIsPaused(false);
    }
    
    // Always switch to top player's turn when bottom is tapped
    setActivePlayer('top');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Clock',
      'Are you sure you want to reset the clock?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setTopTime(600);
            setBottomTime(600);
            setActivePlayer(null);
            setIsPaused(true);
          },
        },
      ]
    );
  };

  const handlePauseResume = () => {
    if (activePlayer) {
      setIsPaused(!isPaused);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlayerStyle = (side: PlayerSide) => {
    const isActive = activePlayer === side && !isPaused;
    const isWaiting = activePlayer !== null && activePlayer !== side;
    
    return [
      styles.playerSide,
      isActive && styles.activeSide,
      isWaiting && styles.waitingSide,
    ];
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
      {/* Top Player (rotated 180 degrees) */}
      <TouchableOpacity
        style={getPlayerStyle('top')}
        onPress={handleTopPress}
        activeOpacity={0.8}
      >
        <View style={styles.rotatedContent}>
          <ThemedText style={[
            styles.timerText,
            activePlayer === 'top' && !isPaused && styles.activeTimerText,
            topTime <= 30 && styles.urgentTimerText,
          ]}>
            {formatTime(topTime)}
          </ThemedText>
          <ThemedText style={styles.playerLabel}>Player 1</ThemedText>
        </View>
      </TouchableOpacity>

      {/* Control Bar */}
      <View style={styles.controlBar}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handlePauseResume}
        >
          <ThemedText style={styles.controlButtonText}>
            {isPaused ? '▶' : '⏸'}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handleReset}
        >
          <ThemedText style={styles.controlButtonText}>⟲</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Bottom Player */}
      <TouchableOpacity
        style={getPlayerStyle('bottom')}
        onPress={handleBottomPress}
        activeOpacity={0.8}
      >
        <View style={styles.normalContent}>
          <ThemedText style={styles.playerLabel}>Player 2</ThemedText>
          <ThemedText style={[
            styles.timerText,
            activePlayer === 'bottom' && !isPaused && styles.activeTimerText,
            bottomTime <= 30 && styles.urgentTimerText,
          ]}>
            {formatTime(bottomTime)}
          </ThemedText>
        </View>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playerSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A24',
  },
  activeSide: {
    backgroundColor: '#2A2A34',
  },
  waitingSide: {
    backgroundColor: '#0F0F14',
    opacity: 0.7,
  },
  rotatedContent: {
    transform: [{ rotate: '180deg' }],
    alignItems: 'center',
  },
  normalContent: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ECEDEE',
    fontVariant: ['tabular-nums'],
    lineHeight: 72
  },
  activeTimerText: {
    color: '#EF4444',
  },
  urgentTimerText: {
    color: '#DC2626',
  },
  playerLabel: {
    fontSize: 18,
    color: '#9BA1A6',
    marginTop: 8,
    fontWeight: '500',
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#0A0A0F',
    gap: 20,
  },
  controlButton: {
    backgroundColor: '#2A2A34',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 24,
    color: '#ECEDEE',
  },
});

