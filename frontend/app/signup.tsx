import React, { useState } from "react";
import {
  View, TextInput, Button, Text,
  StyleSheet, Alert, TouchableOpacity, ScrollView
} from "react-native";
import { useRouter } from "expo-router";

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert("Toate câmpurile sunt obligatorii.");
      return;
    }

    try {
      const res = await fetch("http://192.168.0.102:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Eroare la înregistrare");

      Alert.alert("Succes", "Cont creat cu succes!");
      router.replace("/login");
    } catch (err) {
      Alert.alert("Eroare", (err as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🆕 Creează cont</Text>

      <TextInput placeholder="Prenume" style={styles.input} value={firstName} onChangeText={setFirstName} />
      <TextInput placeholder="Nume" style={styles.input} value={lastName} onChangeText={setLastName} />
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput placeholder="Parolă" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

      <Button title="Creează cont" onPress={handleSignUp} color="#2e7d32" />

      <TouchableOpacity onPress={() => router.replace("/login")}>
        <Text style={styles.switch}>Ai deja cont? Autentifică-te</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: "center", backgroundColor: "#121212" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: "#fff" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 15, borderRadius: 8, color: "#fff" },
  switch: { textAlign: "center", marginTop: 15, fontWeight: "600", color: "#bbb" },
});
