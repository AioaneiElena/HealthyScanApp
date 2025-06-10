"use client"

import { useState } from "react"
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import FancyButton from "../../components/ButtonHover"

const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Eroare", "Completează toate câmpurile.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("http://192.168.0.102:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.detail || "Eroare la autentificare")

      await AsyncStorage.setItem("token", data.access_token)

      const name = data.name || data.email?.split("@")[0] || "User"
      await AsyncStorage.setItem("user", JSON.stringify({ name }))

      Alert.alert("Succes", "Te-ai autentificat cu succes!")
      router.replace("/")
    } catch (err) {
      Alert.alert("Eroare", (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: STATUS_BAR_HEIGHT + 40 }]}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed-outline" size={60} color="rgba(236, 72, 153, 0.8)" />
          </View>
          <Text style={styles.title}>Bine ai revenit!</Text>
          <Text style={styles.subtitle}>Conectează-te la contul tău pentru a continua</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="rgba(236, 72, 153, 0.6)" style={styles.inputIcon} />
              <TextInput
                placeholder="Adresa de email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="rgba(236, 72, 153, 0.6)" style={styles.inputIcon} />
              <TextInput
                placeholder="Parola"
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="rgba(236, 72, 153, 0.6)"
                />
              </TouchableOpacity>
            </View>
          </View>

          <FancyButton
            icon="🔐"
            label={loading ? "Se conectează..." : "Conectează-te"}
            onPress={handleLogin}
            backgroundColor="rgba(236, 72, 153, 0.9)"
            pressedColor="rgba(219, 39, 119, 1)"
            style={styles.loginButton}
            fullWidth={true}
            textStyle={styles.buttonText}
          />
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Nu ai încă un cont?</Text>
          <TouchableOpacity onPress={() => router.replace("/auth/signup")} style={styles.signupLink}>
            <Text style={styles.signupText}>Creează cont nou</Text>
          </TouchableOpacity>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeContainer}>
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <View style={styles.decorativeCircle3} />
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.1)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#333",
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  loginButton: {
    marginTop: 10,
    paddingVertical: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  footerContainer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  signupLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  signupText: {
    fontSize: 16,
    color: "rgba(236, 72, 153, 0.9)",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  decorativeContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  decorativeCircle1: {
    position: "absolute",
    top: 100,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(58, 29, 29, 0.1)",
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: 200,
    left: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(59, 48, 48, 0.08)",
  },
  decorativeCircle3: {
    position: "absolute",
    top: 300,
    left: 50,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(59, 42, 51, 0.1)",
  },
})
