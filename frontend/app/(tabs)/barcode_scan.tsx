"use client"

import { useState } from "react"
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import useAuthGuard from "../../hooks/useAuthGuard"
import { Ionicons } from "@expo/vector-icons"
import CustomNavbar from "../../components/CustomNavbar"
import CustomBottomNavbar from "../../components/CustomBottomNavbar"
import ScreenWrapper from "../../components/ScreenWrapper"
import FancyButton from "../../components/ButtonHover"

export default function BarcodeScanScreen() {
  useAuthGuard()
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [productInfo, setProductInfo] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
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
      await decodeAndFetch(uri)
    }
  }

  const decodeAndFetch = async (uri: string) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", {
        uri,
        name: "barcode.jpg",
        type: "image/jpeg",
      } as any)

      const decodeRes = await fetch("http://192.168.0.102:8000/decode-barcode", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      })

      if (!decodeRes.ok) {
        const err = await decodeRes.text()
        throw new Error(`Decodare eșuată: ${err}`)
      }

      const { code } = await decodeRes.json()

      // Use the new barcode-search endpoint
      const searchRes = await fetch(`http://192.168.0.102:8000/barcode-search/${code}`)
      if (!searchRes.ok) {
        const errText = await searchRes.text()
        throw new Error(`Produs negăsit: ${errText}`)
      }

      const result = await searchRes.json()
      setProductInfo(result)
    } catch (error) {
      setProductInfo({ error: (error as Error).message })
    }
    setLoading(false)
  }

  const searchManually = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Eroare", "Introdu numele produsului pentru căutare.")
      return
    }

    setSearchLoading(true)
    try {
      const response = await fetch("http://192.168.0.102:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() }),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Căutare eșuată: ${errText}`)
      }

      const result = await response.json()

      // Navigate directly to results with the search results
      router.push({
        pathname: "/results",
        params: {
          query: result.query,
          grouped: JSON.stringify(result.grupate || {}),
        },
      })
    } catch (error) {
      Alert.alert("Eroare", (error as Error).message)
    }
    setSearchLoading(false)
  }

  const getNutriScoreColor = (score: string) => {
    switch (score) {
      case "A":
        return "#27ae60"
      case "B":
        return "#2ecc71"
      case "C":
        return "#f39c12"
      case "D":
        return "#e67e22"
      case "E":
        return "#e74c3c"
      default:
        return "#f9a825"
    }
  }

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Scanează un Cod de Bare</Text>
            <Text style={styles.subtitle}>
              Fotografiază eticheta unui produs pentru a-i detecta codul și a căuta cele mai bune oferte.
            </Text>
          </View>

          <View style={styles.cardContainer}>
            {!imageUri ? (
              <View style={styles.cameraCard}>
                <Ionicons name="barcode-outline" size={60} color="rgba(236, 72, 153, 0.6)" style={styles.cameraIcon} />
                <Text style={styles.cameraText}>Fotografiază codul de bare al produsului</Text>
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
                    <Text style={styles.loadingText}>Se procesează codul de bare...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: imageUri }} style={styles.image} />
                    </View>

                    {productInfo && (
                      <View style={styles.productInfoContainer}>
                        <View style={styles.productHeader}>
                          <Text style={styles.productBrand}>Produs detectat</Text>
                          <Text style={styles.productName}>{productInfo.nume}</Text>
                          <Text style={styles.productQuantity}>
                            Găsit în {Object.keys(productInfo.magazine || {}).length} magazine
                          </Text>
                        </View>

                        <View style={styles.buttonsContainer}>
                          {productInfo?.nutriscore &&
                            (productInfo.nutriscore === "D" || productInfo.nutriscore === "E") && (
                              <FancyButton
                                icon="🍃"
                                label="Vezi alternative mai sănătoase"
                                onPress={() =>
                                  router.push({
                                    pathname: "/alternatives" as any,
                                    params: {
                                      name: productInfo.nume,
                                      categorie: productInfo.categorie,
                                    },
                                  })
                                }
                                backgroundColor="#81c784"
                                pressedColor="#66bb6a"
                                style={styles.alternativesButton}
                                fullWidth={true}
                              />
                            )}

                          <FancyButton
                            icon="🔎"
                            label="Vezi ce e în magazine"
                            onPress={() =>
                              router.push({
                                pathname: "/results",
                                params: {
                                  query: productInfo.nume,
                                  grouped: JSON.stringify(productInfo.magazine || {}),
                                },
                              })
                            }
                            backgroundColor="rgba(236, 72, 153, 0.9)"
                            pressedColor="rgba(219, 39, 119, 1)"
                            style={styles.resultsButton}
                            fullWidth={true}
                          />

                          <FancyButton
                            icon="🔁"
                            label="Încearcă alt produs"
                            onPress={() => {
                              setImageUri(null)
                              setProductInfo(null)
                            }}
                            backgroundColor="rgba(224, 166, 190, 0.8)"
                            pressedColor="rgba(209, 95, 175, 0.9)"
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

          {/* Manual Search Section */}
          <View style={styles.searchCard}>
            <View style={styles.searchHeader}>
              <Ionicons name="search-outline" size={24} color="rgba(247, 93, 200, 0.6)" />
              <Text style={styles.searchTitle}>Sau caută manual</Text>
            </View>
            <Text style={styles.searchSubtitle}>Dacă nu poți scana codul, introdu numele produsului</Text>

            <View style={styles.searchInputContainer}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search" size={20} color="rgba(247, 93, 200, 0.6)" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="ex: lapte, pâine, banane..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#999"
                  onSubmitEditing={searchManually}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color="rgba(247, 93, 200, 0.6)" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <FancyButton
              icon="🔍"
              label={searchLoading ? "Se caută..." : "Caută în magazine"}
              onPress={searchManually}
              backgroundColor="rgba(223, 86, 154, 0.6)"
              pressedColor="rgb(204, 92, 167)"
              style={styles.searchButton}
              fullWidth={true}
            />
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Sfaturi pentru scanare</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.tipText}>Asigură-te că codul de bare este bine iluminat</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.tipText}>Ține telefonul stabil pentru o imagine clară</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.tipText}>Încadrează întregul cod de bare în imagine</Text>
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
  imageContainer: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  productInfoContainer: {
    padding: 20,
  },
  productHeader: {
    marginBottom: 20,
    alignItems: "center",
  },
  productBrand: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 16,
    color: "#666",
  },
  scoresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  scoreItem: {
    alignItems: "center",
  },
  scoreCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  scoreText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  scoreLabel: {
    fontSize: 14,
    color: "#666",
  },
  buttonsContainer: {
    gap: 12,
  },
  alternativesButton: {
    paddingVertical: 12,
  },
  resultsButton: {
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
  searchCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "center",
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  searchSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  searchInputContainer: {
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    paddingVertical: 14,
  },
})
