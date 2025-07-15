"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import FancyButton from "../components/ButtonHover"

export default function StartScreen() {
  const router = useRouter()
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(50))
  const { width, height } = Dimensions.get("window")

  useEffect(() => {
    // Animație de fade-in pentru conținut
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={["#ffd6ec", "#fff4b3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Design elements */}
      <View style={styles.circleContainer}>
        <View style={[styles.circle, { top: height * 0.05, left: width * 0.15, opacity: 0.2 }]} />
        <View style={[styles.circle, { top: height * 0.15, left: width * 0.8, opacity: 0.3 }]} />
        <View style={[styles.circle, { top: height * 0.6, left: width * 0.05, opacity: 0.2 }]} />
        <View style={[styles.circle, { top: height * 0.7, left: width * 0.7, opacity: 0.3 }]} />
      </View>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoWrapper}>
          <Image source={require("../assets/images/healthyscan-logo.png")} style={styles.logo} resizeMode="contain" />
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.welcomeText}>👋 Bine ai venit!</Text>
        <Text style={styles.subtitle}>Începe călătoria către o alimentație echilibrată</Text>

        <View style={styles.buttonContainer}>
          <FancyButton
            icon="🔐"
            label="Conectare"
            onPress={() => router.push("/auth/login")}
            backgroundColor="rgba(255, 255, 255, 0.9)"
            pressedColor="rgba(255, 255, 255, 0.7)"
            textColor="#ec4899"
            style={styles.button}
          />
          <FancyButton
            icon="🆕"
            label="Creare cont"
            onPress={() => router.push("/auth/signup")}
            backgroundColor="rgba(236, 72, 153, 0.9)"
            pressedColor="rgba(219, 39, 119, 0.9)"
            textColor="#ffffff"
            style={styles.button}
          />
        </View>
      </Animated.View>

      {/* Features preview */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Descoperă</Text>
        <View style={styles.featureRow}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="scan-outline" size={24} color="#ec4899" />
            </View>
            <Text style={styles.featureText}>Scanează</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="analytics-outline" size={24} color="#ec4899" />
            </View>
            <Text style={styles.featureText}>Analizează</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="happy-outline" size={24} color="#ec4899" />
            </View>
            <Text style={styles.featureText}>Simte-te bine</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerLink}>
          <Text style={styles.footerText}>Politica de confidențialitate</Text>
        </TouchableOpacity>
        <Text style={styles.footerDivider}>•</Text>
        <TouchableOpacity style={styles.footerLink}>
          <Text style={styles.footerText}>Termeni și condiții</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  circle: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "white",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 80 : 60,
  },
  logoWrapper: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 160,
    height: 160,
  },
  content: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 30,
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    opacity: 0.9,
  },
  buttonContainer: {
    width: "100%",
    gap: 15,
    marginBottom: 30,
  },
  button: {
    width: "100%",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  featuresContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 15,
    borderRadius: 20,
    marginHorizontal: 20,
    maxWidth: 500,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  featureRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
  },
  featureItem: {
    alignItems: "center",
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  footerText: {
    fontSize: 12,
    color: "#666",
  },
  footerDivider: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 8,
  },
  footerLink: {
    padding: 5,
  },
})
