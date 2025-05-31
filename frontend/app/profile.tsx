import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import useAuthGuard from "../hooks/useAuthGuard";

export default function ProfileScreen() {
  useAuthGuard();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          router.replace("/login");
          return;
        }

        const res = await fetch(`http://192.168.1.102:8000/me?token=${token}`);
        const data = await res.json();

        if (res.status === 401) {
          await AsyncStorage.removeItem("token");
          Alert.alert("Sesiunea a expirat", "Te rugăm să te autentifici din nou.");
          router.replace("/login");
          return;
        }

        if (!res.ok) throw new Error(data.detail || "Eroare la server");

        setUser(data);
      } catch (err) {
        Alert.alert("Eroare", (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/start");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.avatar}>👤</Text>
      <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
      <Text style={styles.email}>{user.email}</Text>

      <View style={styles.logoutButton}>
        <Button title="Logout" onPress={handleLogout} color="#ef5350" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212", padding: 20,paddingTop: 100 },
  avatar: { fontSize: 60, marginBottom: 20 },
  name: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  email: { fontSize: 16, color: "#bbb", marginBottom: 30 },
  logoutButton: { marginTop: 20, width: "60%" },
});
