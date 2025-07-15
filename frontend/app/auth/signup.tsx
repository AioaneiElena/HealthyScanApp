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
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import FancyButton from "../../components/ButtonHover"
import { BASE_URL } from "../../constants/api";
const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert("Eroare", "Toate câmpurile sunt obligatorii.")
      return
    }

    if (password.length < 6) {
      Alert.alert("Eroare", "Parola trebuie să aibă cel puțin 6 caractere.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('${BASE_URL}/register', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Eroare la înregistrare")

      Alert.alert("Succes", "Cont creat cu succes! Acum te poți conecta.", [
        {
          text: "OK",
          onPress: () => router.replace("/auth/login"),
        },
      ])
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
            <Ionicons name="person-add-outline" size={60} color="rgba(236, 72, 153, 0.8)" />
          </View>
          <Text style={styles.title}>Creează cont nou</Text>
          <Text style={styles.subtitle}>Completează informațiile pentru a începe</Text>
        </View>

        {/* Signup Form */}
        <View style={styles.formContainer}>
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="rgba(236, 72, 153, 0.6)" style={styles.inputIcon} />
                <TextInput
                  placeholder="Prenume"
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="rgba(236, 72, 153, 0.6)" style={styles.inputIcon} />
                <TextInput
                  placeholder="Nume"
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

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
                placeholder="Parola (min. 6 caractere)"
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
            icon="🚀"
            label={loading ? "Se creează contul..." : "Creează cont"}
            onPress={handleSignUp}
            backgroundColor="rgba(236, 72, 153, 0.9)"
            pressedColor="rgba(219, 39, 119, 1)"
            style={styles.signupButton}
            fullWidth={true}
            textStyle={styles.buttonText}
          />
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Ai deja un cont?</Text>
          <TouchableOpacity onPress={() => router.replace("/auth/login")} style={styles.loginLink}>
            <Text style={styles.loginText}>Conectează-te aici</Text>
          </TouchableOpacity>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeContainer}>
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <View style={styles.decorativeCircle3} />
          <View style={styles.decorativeCircle4} />
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
    marginBottom: 40,
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
    marginBottom: 30,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputContainer: {
    marginBottom: 20,
  },
  halfWidth: {
    width: "48%",
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
  signupButton: {
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
  loginLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loginText: {
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
    top: 80,
    right: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(56, 32, 32, 0.1)",
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: 150,
    left: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(104, 16, 16, 0.08)",
  },
  decorativeCircle3: {
    position: "absolute",
    top: 250,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(95, 9, 52, 0.1)",
  },
  decorativeCircle4: {
    position: "absolute",
    bottom: 300,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(175, 153, 25, 0.3)",
  },
})
