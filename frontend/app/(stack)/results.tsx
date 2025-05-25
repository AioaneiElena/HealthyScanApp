import { useLocalSearchParams } from "expo-router";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAuthGuard from "../../hooks/useAuthGuard";

export default function ResultsScreen() {
  useAuthGuard();
  const { results, query } = useLocalSearchParams();
  const produse = results ? JSON.parse(results as string) : [];

  const extractDomain = (url: string) => {
    try {
      const hostname = new URL(url).hostname.replace("www.", "");
      return hostname.split(".")[0];
    } catch {
      return "magazin";
    }
  };

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
            {item.imagine && (
              <Image source={{ uri: item.imagine }} style={styles.imagine} />
            )}

            <View style={styles.textSection}>
              <Text style={styles.titlu}>{item.titlu ?? "—"}</Text>
              <Text style={styles.magazin}>🛒 {extractDomain(item.link ?? "")}</Text>
              <Text style={styles.pret}>💸 {item.pret ?? "—"}</Text>

              {item.link && (
                <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
                  <Text style={styles.link}>🔗 Vezi produs</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cartButton}
                onPress={async () => {
                  try {
                    const token = await AsyncStorage.getItem("token");
                    if (!token) throw new Error("Token lipsă");

                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const email = payload?.sub ?? "default";

                    const key = `cart-${email}`;
                    const existingCart = await AsyncStorage.getItem(key);
                    const cart = existingCart ? JSON.parse(existingCart) : [];

                    cart.push(item);
                    await AsyncStorage.setItem(key, JSON.stringify(cart));

                    Alert.alert("✅ Adăugat în coș", "Produsul a fost salvat.");
                  } catch (err) {
                    Alert.alert("Eroare", "Nu s-a putut adăuga în coș.");
                  }
                }}
              >
                <Text style={styles.cartButtonText}>➕ Adaugă în coș</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  empty: { fontSize: 16, color: "gray", marginTop: 20 },
  card: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "column",
    alignItems: "center",
  },
  textSection: {
    width: "100%",
    marginTop: 10,
    alignItems: "flex-start",
  },
  titlu: { fontSize: 16, fontWeight: "bold", marginBottom: 4, color: "#333" },
  magazin: { fontSize: 14, color: "#555", marginBottom: 4 },
  pret: { fontSize: 15, fontWeight: "600", color: "#2e7d32", marginBottom: 6 },
  imagine: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },
  link: { marginTop: 4, color: "#1e88e5", fontWeight: "600" },
  cartButton: {
    backgroundColor: "#1565c0",
    padding: 10,
    marginTop: 10,
    borderRadius: 6,
    width: "100%",
  },
  cartButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
