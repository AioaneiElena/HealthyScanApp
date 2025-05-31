import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import useAuthGuard from "../hooks/useAuthGuard";

export default function AlternativesScreen() {
  useAuthGuard();
  const { name, categorie } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const fetchAlternatives = async () => {
      try {
        const res = await fetch("http://192.168.1.102:8000/alternatives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, categorie })
        });
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        Alert.alert("Eroare", "Nu s-au putut încărca sugestiile");
      } finally {
        setLoading(false);
      }
    };

    fetchAlternatives();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍃 Alternative mai sănătoase pentru: {name}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#1565c0" />
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.item}>✅ {item}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" ,paddingTop: 100},
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  card: {
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  item: { fontSize: 16, color: "#2e7d32" },
});
