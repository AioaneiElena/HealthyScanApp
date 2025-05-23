import React, { useState } from "react";
import {
  View, TextInput, Button, Text,
  StyleSheet, Alert, TouchableOpacity, ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Completează toate câmpurile.");
      return;
    }

    try {
      const res = await fetch("http://192.168.0.102:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Eroare la autentificare");

      await AsyncStorage.setItem("token", data.access_token);
      Alert.alert("Succes", "Te-ai autentificat!");
      router.replace("/");
    } catch (err) {
      Alert.alert("Eroare", (err as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔐 Login</Text>

      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Parolă" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

      <View style={styles.loginButton}>
        <Button title="Login" onPress={handleLogin} color="#2e7d32" />
      </View>

      <TouchableOpacity onPress={() => router.replace("/signup")}>
        <Text style={styles.switch}>Nu ai cont? Creează unul</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20, backgroundColor: "#121212" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 30, textAlign: "center", color: "#fff" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 15, color: "#fff" },
  loginButton: { marginTop: 10, marginBottom: 20 },
  switch: { textAlign: "center", color: "#bbb", marginTop: 10, fontWeight: "600" },
});
