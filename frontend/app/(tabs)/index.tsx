import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 Compară Prețuri</Text>
      <Text style={styles.subtitle}>Scanează un produs și află cel mai mic preț!</Text>

      <View style={styles.buttonRow}>
        <View style={styles.buttonWrapper}>
          <Button
            title="📷 Poză"
            onPress={() => router.push('/scan_photo')}
            color="#2e7d32"
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title="📦 Cod de Bare"
            onPress={() => router.push('/barcode_scan' as any)}
            color="#1565c0"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  title: {
    fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#333',
  },
  subtitle: {
    fontSize: 16, marginBottom: 30, color: '#666', textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 20,
  },
  buttonWrapper: {
    flex: 1, marginHorizontal: 5,
  },
});
