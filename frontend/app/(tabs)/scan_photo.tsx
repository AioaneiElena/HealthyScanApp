"use client"

import { useState } from "react"
import { View, Text, Image, ActivityIndicator, StyleSheet, Alert, TouchableOpacity, ScrollView } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import useAuthGuard from "../../hooks/useAuthGuard"
import { Ionicons } from "@expo/vector-icons"
import CustomNavbar from "../../components/CustomNavbar"
import CustomBottomNavbar from "../../components/CustomBottomNavbar"
import ScreenWrapper from "../../components/ScreenWrapper"
import FancyButton from "../../components/ButtonHover"
import { BASE_URL } from "../../constants/api";
export default function ScanPhotoScreen() {
  useAuthGuard()
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<any>(null)
  const router = useRouter()

  const pickImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert("Permisiune necesară", "Trebuie să permiți accesul la cameră.")
      return
    }

    const result = await ImagePicker.launchCameraAsync({ base64: false })
    if (!result.canceled) {
      const uri = result.assets[0].uri
      setImageUri(uri)
      await scanAndSearch(uri)
    }
  }

  const scanAndSearch = async (uri: string) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", {
        uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any)

      const response = await fetch(`${BASE_URL}/scan-and-search`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(err)
      }

      const data = await response.json()
      if (data.top3 && data.top3.length > 0) {
        setSearchResult({
          query: data.query,
          imagine: uri,
          top3: data.top3,
        })
      } else {
        Alert.alert("Nicio ofertă găsită", "Încearcă un alt produs.")
      }
    } catch (error) {
      Alert.alert("Eroare", (error as Error).message)
    }
    setLoading(false)
  }

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <CustomNavbar />
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Scanează Eticheta unui Produs</Text>
            <Text style={styles.subtitle}>
              Fotografiază o etichetă și caută cele mai bune oferte pentru produsul recunoscut.
            </Text>
          </View>

          <View style={styles.cardContainer}>
            {!imageUri ? (
              <View style={styles.cameraCard}>
                <Ionicons name="camera" size={60} color="rgba(236, 72, 153, 0.6)" style={styles.cameraIcon} />
                <Text style={styles.cameraText}>Fotografiază eticheta produsului</Text>
                <FancyButton
                  icon="📷"
                  label="Deschide Camera"
                  onPress={pickImage}
                  backgroundColor="rgba(236, 72, 153, 0.9)"
                  pressedColor="rgba(219, 39, 119, 1)"
                  style={styles.cameraButton}
                />
              </View>
            ) : (
              <View style={styles.resultCard}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="rgba(236, 72, 153, 0.9)" />
                    <Text style={styles.loadingText}>Se procesează imaginea...</Text>
                  </View>
                ) : (
                  <>
                    <Image source={{ uri: imageUri }} style={styles.image} />
                    {searchResult && (
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultTitle}>Produs detectat:</Text>
                        <Text style={styles.resultQuery}>{searchResult.query}</Text>

                        <View style={styles.buttonsContainer}>
                          <FancyButton
                            icon="🔎"
                            label="Vezi rezultate"
                            onPress={() =>
                              router.push({
                                pathname: "/(stack)/results" as any,
                                params: {
                                  query: searchResult.query,
                                  results: JSON.stringify(searchResult.top3),
                                },
                              })
                            }
                            backgroundColor="rgba(236, 72, 153, 0.9)"
                            pressedColor="rgba(219, 39, 119, 1)"
                            style={styles.resultButton}
                            fullWidth={true}
                          />

                          <FancyButton
                            icon="🔁"
                            label="Încearcă alt produs"
                            onPress={() => {
                              setImageUri(null)
                              setSearchResult(null)
                            }}
                            backgroundColor="rgba(59, 130, 246, 0.8)"
                            pressedColor="rgba(37, 99, 235, 0.9)"
                            style={styles.rescanButton}
                            fullWidth={true}
                          />
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Sfaturi pentru scanare</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.tipText}>Asigură-te că eticheta este bine iluminată</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.tipText}>Ține telefonul stabil pentru o imagine clară</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.tipText}>Încadrează întreaga etichetă în imagine</Text>
            </View>
          </View>
        </ScrollView>
      </ScreenWrapper>
      <CustomBottomNavbar />
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
    paddingVertical: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
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
  cardContainer: {
    marginBottom: 30,
  },
  cameraCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cameraIcon: {
    marginBottom: 16,
  },
  cameraText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  cameraButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  image: {
    width: "100%",
    height: 250,
    backgroundColor: "#f0f0f0",
  },
  resultInfo: {
    padding: 20,
  },
  resultTitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  resultQuery: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  buttonsContainer: {
    gap: 12,
  },
  resultButton: {
    paddingVertical: 12,
  },
  rescanButton: {
    paddingVertical: 12,
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
  tipsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 10,
    flex: 1,
  },
})
