"use client"

import { View, Text, StyleSheet, ScrollView, Image } from "react-native"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import FancyButton from "../../components/ButtonHover"
import ScreenWrapper from "../../components/ScreenWrapper"
import useUser from "../../hooks/useUser"

type User = {
  name: string
  email: string
  avatar_url?: string
  first_name?: string
  last_name?: string
}

export default function HomeScreen() {
  const router = useRouter()
  const user = useUser() as User | null
  const userName = user?.first_name || user?.name || "Utilizator"

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Main Title Section */}
          <View style={styles.titleSection}>
            <Image
              source={require("../../assets/images/healthyscan-logo2.png")}
              style={{ width: 320, height: 120, resizeMode: "contain", marginBottom: 12 }}
            />
            <Text style={styles.subtitle}>
              Scanează produse alimentare pentru a descoperi cât de sănătoase sunt și primește sugestii mai bune!
            </Text>
          </View>

          {/* Main Actions Card */}
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Ce vrei să faci?</Text>

            <View style={styles.buttonsGrid}>
              <FancyButton
                imageSrc={require("../../assets/images/barcode.png")}
                label="Scanează cod de bare și vezi ce e in magazine"
                onPress={() => router.push("/barcode_scan")}
                backgroundColor="rgba(236, 72, 153, 0.9)"
                pressedColor="rgba(219, 39, 119, 1)"
                style={styles.actionButton}
                fullWidth={true}
              />

              <FancyButton
                label="Informații nutriționale despre produsul tau"
                onPress={() => router.push("/nutrition")}
                backgroundColor="rgba(233, 201, 59, 0.8)"
                pressedColor="rgba(248, 193, 14, 0.9)"
                style={styles.actionButton}
                fullWidth={true}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsCard}>
            <Text style={styles.cardTitle}>Acțiuni rapide</Text>

            <View style={styles.quickButtonsRow}>
              <FancyButton
                icon="🔍"
                label="Istoric Rețete"
                onPress={() => router.push("/saved-recipes")}
                backgroundColor="rgba(209, 114, 178, 0.8)"
                pressedColor="rgba(190, 110, 154, 0.9)"
                style={styles.quickButton}
              />

              <FancyButton
                icon="📋"
                label="Istoric cautări"
                onPress={() => router.push("/history")}
                backgroundColor="rgba(228, 161, 211, 0.8)"
                pressedColor="rgba(216, 152, 207, 0.9)"
                style={styles.quickButton}
              />
            </View>
          </View>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <Text style={styles.cardTitle}>💡 Sfat util</Text>
            <Text style={styles.tipText}>
              Pentru rezultate mai bune, asigură-te că codul de bare este bine iluminat și în focus când faci poza!
            </Text>
          </View>
        </ScrollView>
      </ScreenWrapper>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  welcomeSection: {
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 4,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  actionsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonsGrid: {
    gap: 16,
  },
  actionButton: {
    paddingVertical: 20,
  },
  quickActionsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  quickButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 16,
  },
  tipsCard: {
    backgroundColor: "#e0f7fa",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    textAlign: "center",
  },
})
