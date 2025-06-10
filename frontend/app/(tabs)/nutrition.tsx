"use client"

import { useState } from "react"
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import useAuthGuard from "../../hooks/useAuthGuard"
import { Ionicons } from "@expo/vector-icons"
import CustomBottomNavbar from "../../components/CustomBottomNavbar"
import ScreenWrapper from "../../components/ScreenWrapper"
import FancyButton from "../../components/ButtonHover"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Tipuri pentru API-ul Open Food Facts
interface OpenFoodFactsAdditive {
  additive: {
    id: string
    name: {
      en?: string
      ro?: string
      [key: string]: string | undefined
    }
    description?: {
      en?: string
      ro?: string
      [key: string]: string | undefined
    }
    risk?: {
      en?: string
      ro?: string
      [key: string]: string | undefined
    }
    function?: {
      en?: string
      ro?: string
      [key: string]: string | undefined
    }
    efsa_evaluation?: {
      en?: string
      ro?: string
      [key: string]: string | undefined
    }
    efsa_evaluation_date?: string
    efsa_evaluation_url?: string
    wikidata?: {
      en?: string
      ro?: string
      [key: string]: string | undefined
    }
  }
}

interface ProcessedAdditiveInfo {
  code: string
  name: string
  description: string
  risk: "low" | "medium" | "high" | "unknown"
  riskDescription: string
  category: string
  efsaEvaluation?: string
  efsaDate?: string
  wikiInfo?: string
}

interface IngredientInfo {
  name: string
  description: string
  environmental_impact: "low" | "medium" | "high"
  health_impact: "low" | "medium" | "high"
}

type IngredientsDatabase = Record<string, IngredientInfo>

// Baza de date pentru ingrediente comune (păstrăm aceasta local)
const INGREDIENTS_DATABASE: IngredientsDatabase = {
  "palm oil": {
    name: "Ulei de palmier",
    description: "Grăsime saturată cu impact negativ asupra mediului. Poate crește colesterolul.",
    environmental_impact: "high",
    health_impact: "medium",
  },
  "high fructose corn syrup": {
    name: "Sirop de porumb cu fructoză",
    description: "Îndulcitor artificial legat de obezitate și diabet. Evitați consumul frecvent.",
    environmental_impact: "medium",
    health_impact: "high",
  },
  "trans fat": {
    name: "Grăsimi trans",
    description: "Grăsimi artificiale extrem de nocive. Cresc riscul de boli cardiovasculare.",
    environmental_impact: "low",
    health_impact: "high",
  },
  "artificial flavoring": {
    name: "Arome artificiale",
    description: "Compuși chimici care imită gusturile naturale. Siguranța pe termen lung este incertă.",
    environmental_impact: "medium",
    health_impact: "medium",
  },
  "monosodium glutamate": {
    name: "Glutamat monosodic (MSG)",
    description: "Amplificator de gust. Poate cauza dureri de cap și reacții alergice la persoanele sensibile.",
    environmental_impact: "low",
    health_impact: "medium",
  },
  "sodium nitrite": {
    name: "Nitrit de sodiu",
    description: "Conservant pentru carne. Poate forma nitrozamine cancerigene în stomac.",
    environmental_impact: "low",
    health_impact: "high",
  },
  carrageenan: {
    name: "Caragenan",
    description: "Îngroșător din alge marine. Poate cauza inflamații intestinale.",
    environmental_impact: "medium",
    health_impact: "medium",
  },
}

export default function NutritionScanScreen() {
  useAuthGuard()
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [productInfo, setProductInfo] = useState<any>(null)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [barcodeLoading, setBarcodeLoading] = useState(false)
  const [showPortionModal, setShowPortionModal] = useState(false)
  const [portionSize, setPortionSize] = useState("100")
  const [showAdditiveModal, setShowAdditiveModal] = useState(false)
  const [selectedAdditive, setSelectedAdditive] = useState<ProcessedAdditiveInfo | null>(null)
  const [additiveLoading, setAdditiveLoading] = useState(false)
  const [showIngredientModal, setShowIngredientModal] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<(IngredientInfo & { original: string }) | null>(null)

  const router = useRouter()

  // Funcție pentru a obține informații despre aditivi de la Open Food Facts
  const fetchAdditiveInfo = async (eCode: string): Promise<ProcessedAdditiveInfo | null> => {
    try {
      setAdditiveLoading(true)
      const response = await fetch(`https://world.openfoodfacts.org/additive/${eCode.toLowerCase()}.json`)

      if (!response.ok) {
        console.log(`API call failed for ${eCode}:`, response.status)
        return null
      }

      const data: OpenFoodFactsAdditive = await response.json()
      console.log("🔍 ADDITIVE RAW DATA", data) // <<< Adaugă aici
      if (!data.additive) {
        console.log(`No additive data found for ${eCode}`)
        return null
      }

      const additive = data.additive

      // Extrage numele în română sau engleză
      const name = additive.name?.ro || additive.name?.en || eCode

      // Extrage descrierea
      const description =
        additive.description?.ro || additive.description?.en || "Nu sunt disponibile informații detaliate."

      // Extrage informațiile despre risc
      const riskInfo = additive.risk?.ro || additive.risk?.en || ""

      // Determină nivelul de risc pe baza textului
      let risk: "low" | "medium" | "high" | "unknown" = "unknown"
      const riskLower = riskInfo.toLowerCase()

      if (
        riskLower.includes("safe") ||
        riskLower.includes("sigur") ||
        riskLower.includes("no risk") ||
        riskLower.includes("fără risc")
      ) {
        risk = "low"
      } else if (
        riskLower.includes("moderate") ||
        riskLower.includes("moderat") ||
        riskLower.includes("caution") ||
        riskLower.includes("atenție")
      ) {
        risk = "medium"
      } else if (
        riskLower.includes("danger") ||
        riskLower.includes("pericol") ||
        riskLower.includes("harmful") ||
        riskLower.includes("nociv") ||
        riskLower.includes("cancer")
      ) {
        risk = "high"
      }

      // Extrage categoria/funcția
      const category = additive.function?.ro || additive.function?.en || "Aditiv alimentar"

      // Extrage evaluarea EFSA
      const efsaEvaluation = additive.efsa_evaluation?.ro || additive.efsa_evaluation?.en
      const efsaDate = additive.efsa_evaluation_date

      // Extrage informații Wikipedia
      const wikiInfo = additive.wikidata?.ro || additive.wikidata?.en

      return {
        code: eCode.toUpperCase(),
        name,
        description,
        risk,
        riskDescription: riskInfo || "Nu sunt disponibile informații despre risc.",
        category,
        efsaEvaluation,
        efsaDate,
        wikiInfo,
      }
    } catch (error) {
      console.error(`Error fetching additive info for ${eCode}:`, error)
      return null
    } finally {
      setAdditiveLoading(false)
    }
  }

  // Funcție pentru extragerea corectă a nutrienților
  const extractNutrients = (nutrienti: any, portionGrams = 100) => {
    console.log("🔍 Nutrienti raw:", nutrienti)

    const getValue = (nutrientName: string) => {
      const servingKey = `${nutrientName}_serving`
      const per100gKey = `${nutrientName}_100g`
      const baseKey = nutrientName

      if (nutrienti[servingKey] !== undefined) {
        console.log(`✅ Găsit ${servingKey}:`, nutrienti[servingKey])
        return nutrienti[servingKey]
      }
      if (nutrienti[per100gKey] !== undefined) {
        console.log(`✅ Găsit ${per100gKey}:`, nutrienti[per100gKey])
        return (nutrienti[per100gKey] * portionGrams) / 100
      }
      if (nutrienti[baseKey] !== undefined) {
        console.log(`✅ Găsit ${baseKey}:`, nutrienti[baseKey])
        return nutrienti[baseKey]
      }

      console.log(`❌ Nu s-a găsit ${nutrientName}`)
      return 0
    }

    const extracted = {
      calorii: getValue("energy-kcal") || getValue("energy") / 4.184,
      sare: getValue("salt") ,
      zahar: getValue("sugars"),
      grasimi: getValue("fat"),
      proteine: getValue("proteins"),
      fibre: getValue("fiber"),
      grasimi_saturate: getValue("saturated-fat"),
      sodiu: getValue("sodium") ,
    }

    console.log("📊 Nutrienti extrași:", extracted)
    return extracted
  }

  const handleBarcodeManualSearch = async () => {
    if (!barcodeInput.trim()) {
      Alert.alert("Eroare", "Introdu un cod valid.")
      return
    }

    setBarcodeLoading(true)
    try {
      const res = await fetch(`http://192.168.0.102:8000/barcode/${barcodeInput.trim()}`)
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(`Produs negăsit: ${msg}`)
      }

      const result = await res.json()
      setImageUri("manual")
      setProductInfo(result)

      try {
        const token = await AsyncStorage.getItem("token")
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]))
          const email = payload?.sub ?? "default"

          const existingRaw = await AsyncStorage.getItem(`nutriscore-history-${email}`)
          const existing = existingRaw ? JSON.parse(existingRaw) : []

          const newEntry = {
            timestamp: Date.now(),
            nutriscore: result.nutriscore,
          }

          const updated = [...existing, newEntry]
          await AsyncStorage.setItem(`nutriscore-history-${email}`, JSON.stringify(updated))
        }
      } catch (err) {
        console.warn("Eroare la salvarea nutriscore-ului în istoric:", err)
      }
    } catch (err) {
      Alert.alert("Eroare", (err as Error).message)
    }
    setBarcodeLoading(false)
  }

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
      await decodeAndFetchNutrition(uri)
    }
  }

  const decodeAndFetchNutrition = async (uri: string) => {
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

      const productRes = await fetch(`http://192.168.0.102:8000/barcode/${code}`)
      if (!productRes.ok) {
        const errText = await productRes.text()
        throw new Error(`Produs negăsit: ${errText}`)
      }

      const result = await productRes.json()
      setProductInfo(result)

      try {
        const token = await AsyncStorage.getItem("token")
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]))
          const email = payload?.sub ?? "default"

          const existingRaw = await AsyncStorage.getItem(`nutriscore-history-${email}`)
          const existing = existingRaw ? JSON.parse(existingRaw) : []

          const newEntry = {
            timestamp: Date.now(),
            nutriscore: result.nutriscore,
          }

          const updated = [...existing, newEntry]
          await AsyncStorage.setItem(`nutriscore-history-${email}`, JSON.stringify(updated))
        }
      } catch (err) {
        console.warn("Eroare la salvarea nutriscore-ului în istoric (scanare):", err)
      }
    } catch (error) {
      Alert.alert("Eroare", (error as Error).message)
    }
    setLoading(false)
  }

  const saveToJournal = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]))
        const email = payload?.sub ?? "default"

        const key = `nutrition-history-${email}`
        const ziua = new Date().toISOString().slice(0, 10)
        const existingRaw = await AsyncStorage.getItem(key)
        const existing = existingRaw ? JSON.parse(existingRaw) : {}

        const nutrients = extractNutrients(productInfo.nutrienti || {}, Number.parseFloat(portionSize))

        const newEntry = {
          timestamp: Date.now(),
          product: productInfo.nume,
          brand: productInfo.brand,
          portionSize: Number.parseFloat(portionSize),
          calorii: Math.round(nutrients.calorii * 100) / 100,
          sare: Math.round(nutrients.sare * 1000) / 1000,
          zahar: Math.round(nutrients.zahar * 100) / 100,
          grasimi: Math.round(nutrients.grasimi * 100) / 100,
          proteine: Math.round(nutrients.proteine * 100) / 100,
          fibre: Math.round(nutrients.fibre * 100) / 100,
          nutriscore: productInfo.nutriscore,
          nova: productInfo.nova,
        }

        console.log("💾 Salvez în jurnal:", newEntry)

        const updated = {
          ...existing,
          [ziua]: [...(existing[ziua] || []), newEntry],
        }

        await AsyncStorage.setItem(key, JSON.stringify(updated))
        setShowPortionModal(false)
        Alert.alert("Succes", `Produsul a fost salvat în jurnalul zilnic (${portionSize}g)!`)
      }
    } catch (err) {
      console.warn("Eroare la salvare:", err)
      Alert.alert("Eroare", "Nu s-a putut salva produsul.")
    }
  }

  const handleAdditivePress = async (additive: string) => {
    const eCode = additive.toLowerCase().replace(/\s+/g, "")
    const additiveInfo = await fetchAdditiveInfo(eCode)

    if (additiveInfo) {
      setSelectedAdditive(additiveInfo)
      setShowAdditiveModal(true)
    } else {
      Alert.alert(
        "Informații indisponibile",
        `Nu am putut găsi informații despre ${additive} în baza de date Open Food Facts.`,
      )
    }
  }


  const handleIngredientPress = (ingredient: string) => {
    const lowerIngredient = ingredient.toLowerCase()
    const foundIngredientKey = Object.keys(INGREDIENTS_DATABASE).find(
      (key) => lowerIngredient.includes(key) || key.includes(lowerIngredient),
    )

    if (foundIngredientKey) {
      const ingredientInfo = INGREDIENTS_DATABASE[foundIngredientKey]
      setSelectedIngredient({
        original: ingredient,
        ...ingredientInfo,
      })
      setShowIngredientModal(true)
    } else {
      Alert.alert("Informații indisponibile", `Nu avem informații despre ${ingredient}`)
    }
  }

  const getNutriScoreColor = (score: string) => {
    switch (score?.toUpperCase()) {
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
        return "#95a5a6"
    }
  }

  const getNovaColor = (nova: string) => {
    switch (nova) {
      case "1":
        return "#27ae60"
      case "2":
        return "#f39c12"
      case "3":
        return "#e67e22"
      case "4":
        return "#e74c3c"
      default:
        return "#95a5a6"
    }
  }

  const getEcoScoreColor = (score: string) => {
    switch (score?.toUpperCase()) {
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
        return "#95a5a6"
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "#22c55e"
      case "medium":
        return "#f59e0b"
      case "high":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "low":
        return "checkmark-circle"
      case "medium":
        return "warning"
      case "high":
        return "alert-circle"
      default:
        return "help-circle"
    }
  }

  const getRiskText = (risk: string) => {
    switch (risk) {
      case "low":
        return "Sigur"
      case "medium":
        return "Moderat"
      case "high":
        return "Risc ridicat"
      default:
        return "Necunoscut"
    }
  }

  const renderNutrientPreview = () => {
    if (!productInfo?.nutrienti) return null

    const nutrients = extractNutrients(productInfo.nutrienti, Number.parseFloat(portionSize))

    return (
      <View style={styles.nutrientPreview}>
        <Text style={styles.previewTitle}>📊 Pentru porția ta:</Text>
        <View style={styles.previewGrid}>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>🔥 Calorii</Text>
            <Text style={styles.previewValue}>{Math.round(nutrients.calorii)} kcal</Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>🧂 Sare</Text>
            <Text style={styles.previewValue}>{nutrients.sare.toFixed(2)} g</Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>🍭 Zahăr</Text>
            <Text style={styles.previewValue}>{nutrients.zahar.toFixed(1)} g</Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>🥑 Grăsimi</Text>
            <Text style={styles.previewValue}>{nutrients.grasimi.toFixed(1)} g</Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>🥩 Proteine</Text>
            <Text style={styles.previewValue}>{nutrients.proteine.toFixed(1)} g</Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>🌾 Fibre</Text>
            <Text style={styles.previewValue}>{nutrients.fibre.toFixed(1)} g</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>🍎 Informații Nutriționale</Text>
            <Text style={styles.subtitle}>
              Scanează codul de bare pentru a afla totul despre produs: nutrienți, ingrediente și impact asupra
              sănătății.
            </Text>
          </View>

          <View style={styles.cardContainer}>
            {!imageUri ? (
              <View style={styles.cameraCard}>
                <Ionicons name="nutrition-outline" size={60} color="rgba(34, 197, 94, 0.6)" style={styles.cameraIcon} />
                <Text style={styles.cameraText}>Scanează codul de bare pentru informații nutriționale</Text>
                <FancyButton
                  icon="📷"
                  label="Deschide Camera"
                  onPress={pickImage}
                  backgroundColor="rgba(236, 72, 153, 0.9)"
                  pressedColor="rgba(219, 39, 119, 1)"
                  style={styles.cameraButton}
                />
                <View style={styles.manualCard}>
                  <Text style={styles.manualTitle}>Sau introdu codul manual</Text>

                  <View style={styles.searchInputWrapper}>
                    <Ionicons
                      name="barcode-outline"
                      size={20}
                      color="rgba(236, 72, 153, 0.6)"
                      style={styles.searchIcon}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="ex: 5949123000281"
                      value={barcodeInput}
                      onChangeText={setBarcodeInput}
                      keyboardType="numeric"
                      placeholderTextColor="#999"
                      onSubmitEditing={handleBarcodeManualSearch}
                      returnKeyType="done"
                    />
                    {barcodeInput.length > 0 && (
                      <TouchableOpacity onPress={() => setBarcodeInput("")} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={20} color="rgba(236, 72, 153, 0.6)" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <FancyButton
                    icon="🔍"
                    label={barcodeLoading ? "Se caută..." : "Caută produsul"}
                    onPress={handleBarcodeManualSearch}
                    backgroundColor="rgba(246, 59, 174, 0.9)"
                    pressedColor="rgb(253, 18, 163)"
                    style={styles.searchButton}
                    fullWidth={true}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.resultCard}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="rgba(34, 197, 94, 0.9)" />
                    <Text style={styles.loadingText}>Se analizează produsul...</Text>
                  </View>
                ) : (
                  productInfo && (
                    <>
                      {/* Product Header */}
                      <View style={styles.productHeader}>
                        <View style={styles.productTitleContainer}>
                          <Text style={styles.productName}>{productInfo.nume}</Text>
                          <Text style={styles.productBrand}>{productInfo.brand}</Text>
                          <Text style={styles.productQuantity}>{productInfo.cantitate}</Text>
                        </View>
                      </View>

                      {/* Nutrition Scores */}
                      <View style={styles.scoresSection}>
                        <Text style={styles.sectionTitle}>📊 Scoruri Nutriționale</Text>
                        <View style={styles.scoresContainer}>
                          <View style={styles.scoreCard}>
                            <View
                              style={[
                                styles.scoreCircle,
                                { backgroundColor: getNutriScoreColor(productInfo.nutriscore) },
                              ]}
                            >
                              <Text style={styles.scoreText}>{productInfo.nutriscore || "?"}</Text>
                            </View>
                            <Text style={styles.scoreLabel}>NutriScore</Text>
                            <Text style={styles.scoreDescription}>Calitate nutrițională</Text>
                          </View>

                          <View style={styles.scoreCard}>
                            <View style={[styles.scoreCircle, { backgroundColor: getNovaColor(productInfo.nova) }]}>
                              <Text style={styles.scoreText}>{productInfo.nova || "?"}</Text>
                            </View>
                            <Text style={styles.scoreLabel}>NOVA</Text>
                            <Text style={styles.scoreDescription}>Grad de procesare</Text>
                          </View>

                          <View style={styles.scoreCard}>
                            <View
                              style={[styles.scoreCircle, { backgroundColor: getEcoScoreColor(productInfo.ecoscore) }]}
                            >
                              <Text style={styles.scoreText}>{productInfo.ecoscore || "?"}</Text>
                            </View>
                            <Text style={styles.scoreLabel}>EcoScore</Text>
                            <Text style={styles.scoreDescription}>Impact ecologic</Text>
                          </View>
                        </View>
                      </View>

                      {/* Enhanced Nutritional Information */}
                      <View style={styles.nutritionSection}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="fitness-outline" size={24} color="#f39c12" />
                          <Text style={styles.sectionTitle}>Informații Nutriționale</Text>
                        </View>

                        {renderNutrientPreview()}

                        {productInfo.nutrienti100g && (
                          <View style={styles.nutritionCard}>
                            <View style={styles.nutritionHeader}>
                              <Ionicons name="scale-outline" size={20} color="#f39c12" />
                              <Text style={styles.nutritionTitle}>Per 100g</Text>
                            </View>
                            <Text style={styles.nutritionText}>{productInfo.nutrienti100g}</Text>
                          </View>
                        )}

                        {productInfo.nutrientiPortie && (
                          <View style={styles.nutritionCard}>
                            <View style={styles.nutritionHeader}>
                              <Ionicons name="restaurant-outline" size={20} color="#f39c12" />
                              <Text style={styles.nutritionTitle}>Per porție</Text>
                            </View>
                            <Text style={styles.nutritionText}>{productInfo.nutrientiPortie}</Text>
                          </View>
                        )}
                      </View>

                      {/* Interactive Additives Section with Open Food Facts API */}
                      {productInfo.aditivi && productInfo.aditivi.length > 0 && (
                        <View style={styles.additivesSection}>
                          <View style={styles.sectionHeader}>
                            <Ionicons name="flask-outline" size={24} color="#f59e0b" />
                            <Text style={[styles.sectionTitle, { color: "#f59e0b" }]}>
                              Aditivi (apasă pentru detalii din Open Food Facts)
                            </Text>
                          </View>
                          <View style={styles.additivesContainer}>
                            {productInfo.aditivi.map((aditiv: string, index: number) => {
                              const eCode = aditiv.match(/E\d+[a-z]?/i)?.[0]
                              const hasECode = !!eCode

                              return (
                                <TouchableOpacity
                                  key={index}
                                  style={[styles.additiveTag, hasECode && { borderColor: "#3b82f6", borderWidth: 2 }]}
                                  onPress={() => handleAdditivePress(aditiv)}
                                  activeOpacity={0.7}
                                  disabled={!hasECode}
                                >
                                  <Text style={[styles.additiveText, hasECode && { color: "#3b82f6" }]}>{aditiv}</Text>
                                  {hasECode && (
                                    <Ionicons
                                      name="information-circle"
                                      size={12}
                                      color="#3b82f6"
                                      style={styles.riskIcon}
                                    />
                                  )}
                                </TouchableOpacity>
                              )
                            })}
                          </View>
                          <Text style={styles.additiveNote}>
                            💡 Informațiile despre aditivi sunt furnizate de Open Food Facts și actualizate în timp
                            real.
                          </Text>
                        </View>
                      )}

                      {/* Labels & Certifications */}
                      {productInfo.etichete && productInfo.etichete.length > 0 && (
                        <View style={styles.labelsSection}>
                          <View style={styles.sectionHeader}>
                            <Ionicons name="ribbon-outline" size={24} color="#3b82f6" />
                            <Text style={styles.sectionTitle}>Etichete & Certificări</Text>
                          </View>
                          <View style={styles.tagsContainer}>
                            {productInfo.etichete.map((eticheta: string, index: number) => (
                              <TouchableOpacity
                                key={index}
                                style={styles.labelTag}
                                onPress={() => handleIngredientPress(eticheta)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.labelText}>{eticheta}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Allergens */}
                      {productInfo.alergeni && productInfo.alergeni.length > 0 && (
                        <View style={styles.allergensSection}>
                          <View style={styles.sectionHeader}>
                            <Ionicons name="warning-outline" size={24} color="#ef4444" />
                            <Text style={[styles.sectionTitle, { color: "#ef4444" }]}>Alergeni</Text>
                          </View>
                          <View style={styles.allergensContainer}>
                            {productInfo.alergeni.map((alergen: string, index: number) => (
                              <View key={index} style={styles.allergenItem}>
                                <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                                <Text style={styles.allergenText}>{alergen}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View style={styles.actionsContainer}>
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
                                    nutriscore: productInfo.nutriscore,
                                  },
                                })
                              }
                              backgroundColor="#22c55e"
                              pressedColor="#16a34a"
                              style={styles.actionButton}
                              fullWidth={true}
                            />
                          )}

                        <FancyButton
                          icon="💾"
                          label="Salvează în jurnalul zilnic"
                          onPress={() => setShowPortionModal(true)}
                          backgroundColor="rgba(34, 197, 94, 0.8)"
                          pressedColor="rgba(22, 163, 74, 0.9)"
                          style={styles.actionButton}
                        />

                        <FancyButton
                          icon="🔁"
                          label="Scanează alt produs"
                          onPress={() => {
                            setImageUri(null)
                            setProductInfo(null)
                          }}
                          backgroundColor="rgba(59, 130, 246, 0.8)"
                          pressedColor="rgba(37, 99, 235, 0.9)"
                          style={styles.actionButton}
                          fullWidth={true}
                        />
                      </View>
                    </>
                  )
                )}
              </View>
            )}
          </View>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
              <Text style={styles.tipsTitle}>Ghid de înțelegere</Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipLabel}>NutriScore (A-E):</Text>
              <Text style={styles.tipText}>A = Foarte bun, E = Foarte slab pentru sănătate</Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipLabel}>NOVA (1-4):</Text>
              <Text style={styles.tipText}>1 = Natural, 4 = Ultra-procesat</Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipLabel}>EcoScore (A-E):</Text>
              <Text style={styles.tipText}>A = Impact mic, E = Impact mare asupra mediului</Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipLabel}>Aditivi:</Text>
              <Text style={styles.tipText}>Informații actualizate din Open Food Facts</Text>
            </View>
          </View>
        </ScrollView>
      </ScreenWrapper>

      {/* Enhanced Additive Info Modal with Open Food Facts data */}
      <Modal visible={showAdditiveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {additiveLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="rgba(34, 197, 94, 0.9)" />
                <Text style={styles.loadingText}>Se încarcă informațiile...</Text>
              </View>
            ) : (
              selectedAdditive && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.additiveModalHeader}>
                    <Text style={styles.additiveCode}>{selectedAdditive.code}</Text>
                    <View style={[styles.riskBadge, { backgroundColor: getRiskColor(selectedAdditive.risk) }]}>
                      <Ionicons name={getRiskIcon(selectedAdditive.risk) as any} size={16} color="#fff" />
                      <Text style={styles.riskText}>{getRiskText(selectedAdditive.risk)}</Text>
                    </View>
                  </View>

                  <Text style={styles.additiveName}>{selectedAdditive.name}</Text>
                  <Text style={styles.additiveCategory}>{selectedAdditive.category}</Text>

                  <View style={styles.descriptionSection}>
                    <Text style={styles.sectionLabel}>📝 Descriere:</Text>
                    <Text style={styles.additiveDescription}>{selectedAdditive.description}</Text>
                  </View>

                  <View style={styles.riskSection}>
                    <Text style={styles.sectionLabel}>⚠️ Informații despre risc:</Text>
                    <Text style={styles.riskDescription}>{selectedAdditive.riskDescription}</Text>
                  </View>

                  {selectedAdditive.efsaEvaluation && (
                    <View style={styles.efsaSection}>
                      <Text style={styles.sectionLabel}>🏛️ Evaluare EFSA:</Text>
                      <Text style={styles.efsaText}>{selectedAdditive.efsaEvaluation}</Text>
                      {selectedAdditive.efsaDate && (
                        <Text style={styles.efsaDate}>Data evaluării: {selectedAdditive.efsaDate}</Text>
                      )}
                    </View>
                  )}

                  {selectedAdditive.wikiInfo && (
                    <View style={styles.wikiSection}>
                      <Text style={styles.sectionLabel}>📚 Informații suplimentare:</Text>
                      <Text style={styles.wikiText}>{selectedAdditive.wikiInfo}</Text>
                    </View>
                  )}

                  <View style={styles.sourceSection}>
                    <Text style={styles.sourceLabel}>📊 Sursă: Open Food Facts</Text>
                    <Text style={styles.sourceText}>
                      Informațiile sunt actualizate în timp real din baza de date colaborativă Open Food Facts.
                    </Text>
                  </View>

                  <FancyButton
                    icon="✅"
                    label="Înțeles"
                    onPress={() => setShowAdditiveModal(false)}
                    backgroundColor="rgba(34, 197, 94, 0.8)"
                    pressedColor="rgba(22, 163, 74, 0.9)"
                    style={styles.modalButton}
                    fullWidth={true}
                  />
                </ScrollView>
              )
            )}
          </View>
        </View>
      </Modal>

      {/* Ingredient Info Modal */}
      <Modal visible={showIngredientModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedIngredient && (
              <>
                <Text style={styles.ingredientName}>{selectedIngredient.name}</Text>
                <Text style={styles.ingredientOriginal}>"{selectedIngredient.original}"</Text>
                <Text style={styles.ingredientDescription}>{selectedIngredient.description}</Text>

                <View style={styles.impactContainer}>
                  <View style={styles.impactItem}>
                    <Text style={styles.impactLabel}>Impact asupra sănătății:</Text>
                    <View
                      style={[styles.impactBadge, { backgroundColor: getRiskColor(selectedIngredient.health_impact) }]}
                    >
                      <Text style={styles.impactText}>
                        {selectedIngredient.health_impact === "low"
                          ? "Mic"
                          : selectedIngredient.health_impact === "medium"
                            ? "Moderat"
                            : "Ridicat"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.impactItem}>
                    <Text style={styles.impactLabel}>Impact asupra mediului:</Text>
                    <View
                      style={[
                        styles.impactBadge,
                        { backgroundColor: getRiskColor(selectedIngredient.environmental_impact) },
                      ]}
                    >
                      <Text style={styles.impactText}>
                        {selectedIngredient.environmental_impact === "low"
                          ? "Mic"
                          : selectedIngredient.environmental_impact === "medium"
                            ? "Moderat"
                            : "Ridicat"}
                      </Text>
                    </View>
                  </View>
                </View>

                <FancyButton
                  icon="✅"
                  label="Înțeles"
                  onPress={() => setShowIngredientModal(false)}
                  backgroundColor="rgba(34, 197, 94, 0.8)"
                  pressedColor="rgba(22, 163, 74, 0.9)"
                  style={styles.modalButton}
                  fullWidth={true}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Portion Size Modal */}
      <Modal visible={showPortionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🍽️ Selectează porția consumată</Text>

            <View style={styles.portionInputContainer}>
              <Text style={styles.portionLabel}>Cantitate (grame):</Text>
              <TextInput
                style={styles.portionInput}
                value={portionSize}
                onChangeText={setPortionSize}
                keyboardType="numeric"
                placeholder="100"
                returnKeyType="done"
              />
            </View>

            {renderNutrientPreview()}

            <View style={styles.modalActions}>
              <FancyButton
                icon="💾"
                label="Salvează"
                onPress={saveToJournal}
                backgroundColor="rgba(34, 197, 94, 0.8)"
                pressedColor="rgba(22, 163, 74, 0.9)"
                style={styles.modalButton}
              />
              <FancyButton
                icon="❌"
                label="Anulează"
                onPress={() => setShowPortionModal(false)}
                backgroundColor="rgba(156, 163, 175, 0.8)"
                pressedColor="rgba(107, 114, 128, 0.9)"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

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
  productHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  productTitleContainer: {
    alignItems: "center",
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  productBrand: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: "#999",
  },
  scoresSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  scoresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  scoreCard: {
    alignItems: "center",
    flex: 1,
  },
  scoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  scoreText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  nutritionSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  nutrientPreview: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  previewItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    minWidth: "30%",
    alignItems: "center",
  },
  previewLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  nutritionCard: {
    backgroundColor: "rgba(243, 156, 18, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  nutritionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f39c12",
    marginLeft: 8,
  },
  nutritionText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  labelsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  labelTag: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  labelText: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "500",
  },
  allergensSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  allergensContainer: {
    gap: 8,
  },
  allergenItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  allergenText: {
    fontSize: 14,
    color: "#ef4444",
    marginLeft: 8,
    fontWeight: "500",
  },
  additivesSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  additivesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  additiveTag: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    flexDirection: "row",
    alignItems: "center",
  },
  additiveText: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "500",
  },
  riskIcon: {
    marginLeft: 4,
  },
  additiveNote: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },
  actionsContainer: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
  },
  tipsCard: {
    backgroundColor: "#e8f5e8",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "center",
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  tipItem: {
    marginBottom: 12,
  },
  tipLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 18,
  },
  manualCard: {
    marginTop: 24,
    width: "100%",
    alignItems: "center",
  },
  manualTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  searchIcon: {
    marginRight: 12,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    paddingVertical: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
  },
  additiveModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  additiveCode: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  additiveName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  additiveCategory: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 16,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  riskSection: {
    marginBottom: 16,
  },
  efsaSection: {
    marginBottom: 16,
  },
  wikiSection: {
    marginBottom: 16,
  },
  sourceSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  additiveDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  riskDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  efsaText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 4,
  },
  efsaDate: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  wikiText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#3b82f6",
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 11,
    color: "#666",
    lineHeight: 16,
  },
  ingredientName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  ingredientOriginal: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  ingredientDescription: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
    marginBottom: 20,
  },
  impactContainer: {
    gap: 12,
    marginBottom: 24,
  },
  impactItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  impactLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  impactText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  portionInputContainer: {
    marginBottom: 20,
  },
  portionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  portionInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
})
