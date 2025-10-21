import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0b0a10', '#1a1a23',  '#39363d', '#da4849']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.divider} />
          <Text style={styles.comingSoonText}>Coming Soon</Text>
          <View style={styles.divider} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  comingSoonText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  divider: {
    width: 80,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    marginVertical: 24,
    opacity: 0.8,
  },
  subText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 2,
    opacity: 0.95,
    lineHeight: 28,
  },
});
