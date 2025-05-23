import { useLocalSearchParams } from "expo-router";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Linking } from "react-native";
import React from "react";
import useAuthGuard from "../../hooks/useAuthGuard";

export default function ResultsScreen() {
  useAuthGuard(); 
  const { results, query } = useLocalSearchParams();
  const produse = results ? JSON.parse(results as string) : [];

  console.log("📥 Rezultate primite:", produse);

  if (produse.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>❗ Nicio ofertă găsită pentru: {query}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Rezultate pentru: {query}</Text>
      <FlatList
        data={produse}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.titlu}>{item.titlu}</Text>
            <Text>{item.descriere}</Text>
            {item.imagine && (
              <Image source={{ uri: item.imagine }} style={styles.imagine} />
            )}
            <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
              <Text style={styles.link}>🔗 Vezi produs</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  empty: { fontSize: 16, color: "gray", marginTop: 20 },
  card: { backgroundColor: "#f0f0f0", padding: 12, marginBottom: 12, borderRadius: 8 },
  titlu: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  imagine: { width: "100%", height: 150, borderRadius: 6, marginTop: 10 },
  link: { marginTop: 10, color: "#1e88e5", fontWeight: "600" },
});
