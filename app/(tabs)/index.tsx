import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScrollView, StyleSheet } from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  
  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Empty home page - content can be added later */}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
