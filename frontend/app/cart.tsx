import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Button,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import useAuthGuard from "../hooks/useAuthGuard";
import { LinearGradient } from "expo-linear-gradient";

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

export default function CartScreen() {
  useAuthGuard();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadCart = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Token lipsă");

        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload.sub;
        const key = `cart-${email}`;

        const stored = await AsyncStorage.getItem(key);
        setCart(stored ? JSON.parse(stored) : []);
      } catch (err) {
        Alert.alert("Eroare", "Nu s-a putut încărca coșul.");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  const removeItem = async (indexToRemove: number) => {
    const updatedCart = cart.filter((_, index) => index !== indexToRemove);
    setCart(updatedCart);

    const token = await AsyncStorage.getItem("token");
    const payload = JSON.parse(atob(token!.split('.')[1]));
    const key = `cart-${payload.sub}`;
    await AsyncStorage.setItem(key, JSON.stringify(updatedCart));
  };

  const clearCart = async () => {
    const token = await AsyncStorage.getItem("token");
    const payload = JSON.parse(atob(token!.split('.')[1]));
    const key = `cart-${payload.sub}`;

    await AsyncStorage.removeItem(key);
    setCart([]);
  };

  return (
    <LinearGradient
      colors={["#ffd6ec", "#fff4b3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Text style={styles.title}>🛒 Coșul tău ({cart.length})</Text>

        {loading ? (
          <Text style={styles.loading}>Se încarcă coșul...</Text>
        ) : cart.length === 0 ? (
          <Text style={styles.empty}>Coșul este gol.</Text>
        ) : (
          <>
            <FlatList
              contentContainerStyle={{ paddingBottom: 120 }}
              data={cart}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.card}>
                  {item.imagine && <Image source={{ uri: item.imagine }} style={styles.imagine} />}
                  <Text style={styles.nume}>{item.titlu ?? "—"}</Text>
                  <Text style={styles.pret}>💸 {item.pret ?? "—"}</Text>

                  <TouchableOpacity onPress={() => removeItem(index)}>
                    <Text style={styles.remove}>❌ Elimină</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => router.push({
                      pathname: "/product",
                      params: { product: JSON.stringify(item) },
                    })}
                  >
                    <Text style={styles.detailsButtonText}>🔍 Detalii produs</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListFooterComponent={<Button title="🗑️ Golește coșul" onPress={clearCart} color="#ef5350" />}
            />
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: STATUS_BAR_HEIGHT + 80,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#333",
  },
  empty: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginTop: 20,
  },
  loading: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
  },
  card: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  imagine: {
    width: "100%",
    height: 150,
    borderRadius: 6,
    marginBottom: 8,
  },
  nume: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  pret: {
    fontSize: 14,
    color: "#2e7d32",
    marginBottom: 6,
  },
  remove: {
    color: "#d32f2f",
    fontWeight: "600",
  },
  detailsButton: {
    backgroundColor: "#1565c0",
    padding: 8,
    marginTop: 10,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
