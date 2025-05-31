import { useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import useAuthGuard from "../../hooks/useAuthGuard";

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

export default function ResultsScreen() {
  useAuthGuard();
  const { results, query } = useLocalSearchParams();
  const produse = results ? JSON.parse(results as string) : [];

  const extractDomain = (url: string) => {
    try {
      const hostname = new URL(url).hostname.replace("www.", "");
      return hostname.split(".")[0];
    } catch {
      return "necunoscut";
    }
  };

  const adaugaInCos = async (item: any) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Token lipsă");

      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload?.sub ?? "default";

      const key = `cart-${email}`;
      const existingCart = await AsyncStorage.getItem(key);
      const cart = existingCart ? JSON.parse(existingCart) : [];

      // ✅ Adaugă câmpul magazin înainte de salvare
      item.magazin = extractDomain(item.link ?? "");

      cart.push(item);
      await AsyncStorage.setItem(key, JSON.stringify(cart));

      Alert.alert("✅ Adăugat în coș", "Produsul a fost salvat.");
    } catch (err) {
      Alert.alert("Eroare", "Nu s-a putut adăuga în coș.");
    }
  };

  if (produse.length === 0) {
    return (
      <LinearGradient
        colors={["#ffd6ec", "#fff4b3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.container}>
          <Text style={styles.empty}>❗ Nicio ofertă găsită pentru: {query}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#ffd6ec", "#fff4b3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Text style={styles.title}>🔍 Rezultate pentru: {query}</Text>
        <FlatList
          data={produse}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.imagine && (
                <Image source={{ uri: item.imagine }} style={styles.imagine} />
              )}

              <View style={styles.textSection}>
                <Text style={styles.titlu}>{item.titlu ?? "—"}</Text>
                <Text style={styles.magazin}>🛒 {extractDomain(item.link ?? "")}</Text>
                <Text style={styles.pret}>
                  {item.pret !== null && item.pret !== undefined ? `${item.pret} lei` : "—"}
                </Text>
                <Text style={styles.magazin}>📦 {item.magazin ?? "—"}</Text>

                {item.link && (
                  <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
                    <Text style={styles.link}>🔗 Vezi produs</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.cartButton} onPress={() => adaugaInCos(item)}>
                  <Text style={styles.cartButtonText}>➕ Adaugă în coș</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    paddingTop: STATUS_BAR_HEIGHT + 60,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  empty: {
    fontSize: 16,
    color: "gray",
    marginTop: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagine: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },
  textSection: {
    marginTop: 12,
  },
  titlu: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  magazin: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  pret: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 6,
  },
  link: {
    marginTop: 4,
    color: "#1e88e5",
    fontWeight: "600",
  },
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
