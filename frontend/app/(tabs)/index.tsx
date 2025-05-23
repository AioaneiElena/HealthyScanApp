import React from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import useAuthGuard from "../../hooks/useAuthGuard";

export default function HomeScreen() {
  useAuthGuard();
  const router = useRouter();

  return (
    <View style={styles.container}>
      { }
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>🛒 Compară Prețuri</Text>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Text style={styles.profileButton}>👤</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Scanează un produs și află cel mai mic preț!</Text>

      <View style={styles.buttonRow}>
        <View style={styles.buttonWrapper}>
          <Button
            title="📷 Poză"
            onPress={() => router.push("/scan_photo")}
            color="#2e7d32"
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title="📦 Cod de Bare"
            onPress={() => router.push("/barcode_scan")}
            color="#1565c0"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, padding: 20, backgroundColor: "#f4f4f4",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  navTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  profileButton: {
    fontSize: 24,
    padding: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: "#666",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
});
