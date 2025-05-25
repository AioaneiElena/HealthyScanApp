import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, Alert, Button, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import useAuthGuard from "../hooks/useAuthGuard";

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


  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Se încarcă coșul...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 Coșul tău ({cart.length})</Text>

      {cart.length === 0 ? (
        <Text style={styles.empty}>Coșul este gol.</Text>
      ) : (
        <>
          <FlatList
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
              </View>
            )}
          />
          <Button title="🗑️ Golește coșul" onPress={clearCart} color="#ef5350" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  empty: { fontSize: 16, color: "gray", textAlign: "center", marginTop: 20 },
  loading: { fontSize: 16, textAlign: "center" },
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
  nume: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  pret: { fontSize: 14, color: "#2e7d32", marginBottom: 6 },
  remove: { color: "#d32f2f", fontWeight: "600" },
});
