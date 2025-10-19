import { ThemedText } from '@/components/themed-text';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface GameCardProps {
  title: string;
  description: string;
  badgeType: 'live' | 'soon';
  onPress: () => void;
  backgroundColor?: string;
}

export function GameCard({ 
  title, 
  description, 
  badgeType, 
  onPress, 
  backgroundColor = '#1A1A24' 
}: GameCardProps) {
  const badgeStyle = badgeType === 'live' ? styles.liveBadge : styles.soonBadge;
  const badgeTextStyle = badgeType === 'live' 
    ? styles.badgeText 
    : [styles.badgeText, { color: '#1A1A24' }];

  return (
    <TouchableOpacity 
      style={[styles.gameCard, { backgroundColor }]}
      onPress={onPress}
    >
      <View style={badgeStyle}>
        <ThemedText style={badgeTextStyle}>
          {badgeType === 'live' ? 'LIVE' : 'COMING SOON'}
        </ThemedText>
      </View>
      <ThemedText style={styles.gameTitle}>{title}</ThemedText>
      <ThemedText style={styles.gameDescription}>{description}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gameCard: {
    padding: 24,
    borderRadius: 16,
    position: 'relative',
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  soonBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#9BA1A6',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ECEDEE',
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginTop: 40,
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    color: '#9BA1A6',
    lineHeight: 20,
  },
});
