import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, FlatList, Image, Linking } from 'react-native';

export default function ResultsScreen() {
  const { query, results } = useLocalSearchParams();
  const produse = results ? JSON.parse(results as string) : [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rezultate pentru: {query}</Text>

      {produse.length === 0 ? (
        <Text style={styles.subtitle}>⚠️ Nicio ofertă găsită.</Text>
      ) : (
        <FlatList
          data={produse}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.imagine && (
                <Image source={{ uri: item.imagine }} style={styles.image} />
              )}
              <Text style={styles.name}>{item.titlu}</Text>
              <Text style={styles.price}>{item.pret || 'N/A'} lei</Text>
              <Text numberOfLines={2} style={styles.desc}>{item.descriere}</Text>
              {item.link && (
                <Text
                  style={styles.link}
                  onPress={() => Linking.openURL(item.link)}
                >
                  🔗 Deschide
                </Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666' },
  card: {
    marginVertical: 10, padding: 10,
    backgroundColor: '#f4f4f4', borderRadius: 8
  },
  name: { fontSize: 16, fontWeight: 'bold' },
  price: { color: '#2e7d32', marginVertical: 4 },
  desc: { color: '#555' },
  image: {
    width: '100%', height: 150, resizeMode: 'contain',
    marginBottom: 8, borderRadius: 6
  },
  link: {
    color: '#1565c0', marginTop: 4, textDecorationLine: 'underline'
  }
});
