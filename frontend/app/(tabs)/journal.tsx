"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Keyboard,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import CustomNavbar from "../../components/CustomNavbar"
import CustomBottomNavbar from "../../components/CustomBottomNavbar"
import ScreenWrapper from "../../components/ScreenWrapper"
import FancyButton from "../../components/ButtonHover"
import useAuthGuard from "../../hooks/useAuthGuard"
import { useRouter } from "expo-router"

// Limite recomandate OMS și nutriționiști
const DEFAULT_LIMITS = {
  calorii: 2000,
  sare: 5, // grame pe zi
  zahar: 50, // grame pe zi
  grasimi: 70, // grame pe zi
}

// Algoritm pentru calcularea limitelor personalizate
const calculatePersonalLimits = (
  weight: number,
  height: number,
  age: number,
  gender: "M" | "F",
  activityLevel: string,
) => {
  // Formula Harris-Benedict pentru metabolismul bazal
  let bmr = 0
  if (gender === "M") {
    bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
  } else {
    bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age
  }

  // Factor de activitate
  const activityFactors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  }

  const tdee = bmr * (activityFactors[activityLevel as keyof typeof activityFactors] || 1.2)

  return {
    calorii: Math.round(tdee),
    sare: weight > 70 ? 6 : 5, // Persoanele mai grele pot tolera puțin mai multă sare
    zahar: Math.round((tdee * 0.1) / 4), // 10% din calorii din zahăr (4 cal/g)
    grasimi: Math.round((tdee * 0.3) / 9), // 30% din calorii din grăsimi (9 cal/g)
  }
}

// Algoritm pentru recomandări de exerciții
const getExerciseRecommendations = (excessCalories: number, weight: number) => {
  const exercises = [
    { name: "Mers rapid", caloriesPerMinute: weight * 0.05, icon: "🚶‍♂️" },
    { name: "Alergare ușoară", caloriesPerMinute: weight * 0.08, icon: "🏃‍♂️" },
    { name: "Ciclism", caloriesPerMinute: weight * 0.07, icon: "🚴‍♂️" },
    { name: "Înot", caloriesPerMinute: weight * 0.09, icon: "🏊‍♂️" },
    { name: "Dans", caloriesPerMinute: weight * 0.06, icon: "💃" },
    { name: "Yoga", caloriesPerMinute: weight * 0.03, icon: "🧘‍♀️" },
  ]

  return exercises
    .map((exercise) => ({
      ...exercise,
      minutes: Math.round(excessCalories / exercise.caloriesPerMinute),
    }))
    .filter((ex) => ex.minutes > 0 && ex.minutes <= 120) // Exerciții rezonabile (max 2h)
}

// Configurația stărilor emoționale
const MOOD_CONFIG = {
  energetic: { emoji: "😊", label: "Energic", type: "positive" },
  satisfied: { emoji: "😌", label: "Sătul", type: "positive" },
  normal: { emoji: "😐", label: "Normal", type: "neutral" },
  bloated: { emoji: "😟", label: "Balonat", type: "negative" },
  tired: { emoji: "😴", label: "Obosit", type: "negative" },
  craving: { emoji: "🍭", label: "Poftă de dulce", type: "negative" },
}

export default function NutritionJournalScreen() {
  useAuthGuard()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ calorii: 0, sare: 0, zahar: 0, grasimi: 0 })
  const [entries, setEntries] = useState<any[]>([])
  const [datesWithEntries, setDatesWithEntries] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [limits, setLimits] = useState(DEFAULT_LIMITS)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileForm, setProfileForm] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "M" as "M" | "F",
    activityLevel: "moderate",
  })

  // State pentru modal-ul de feedback emoțional
  const [showMoodModal, setShowMoodModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)

  useEffect(() => {
    loadUserProfile()
    fetchHistory()
  }, [selectedDate])

  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]))
        const email = payload?.sub ?? "default"

        const profileRaw = await AsyncStorage.getItem(`user-profile-${email}`)
        if (profileRaw) {
          const profile = JSON.parse(profileRaw)
          setUserProfile(profile)

          // Calculează limitele personalizate
          const personalLimits = calculatePersonalLimits(
            profile.weight,
            profile.height,
            profile.age,
            profile.gender,
            profile.activityLevel,
          )
          setLimits(personalLimits)
        }
      }
    } catch (err) {
      console.warn("Eroare la încărcarea profilului:", err)
    }
  }

  const saveUserProfile = async () => {
    // Ascunde tastatura înainte de salvare
    Keyboard.dismiss()

    try {
      const token = await AsyncStorage.getItem("token")
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]))
        const email = payload?.sub ?? "default"

        const profile = {
          weight: Number.parseFloat(profileForm.weight),
          height: Number.parseFloat(profileForm.height),
          age: Number.parseInt(profileForm.age),
          gender: profileForm.gender,
          activityLevel: profileForm.activityLevel,
        }

        await AsyncStorage.setItem(`user-profile-${email}`, JSON.stringify(profile))
        setUserProfile(profile)

        const personalLimits = calculatePersonalLimits(
          profile.weight,
          profile.height,
          profile.age,
          profile.gender,
          profile.activityLevel,
        )
        setLimits(personalLimits)
        setShowProfileModal(false)
        Alert.alert("Succes", "Profilul a fost salvat și limitele au fost actualizate!")
      }
    } catch (err) {
      Alert.alert("Eroare", "Nu s-a putut salva profilul")
    }
  }

  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]))
        const email = payload?.sub ?? "default"

        const key = `nutrition-history-${email}`
        const raw = await AsyncStorage.getItem(key)
        const history = raw ? JSON.parse(raw) : {}

        // Filtrează datele duplicate și sortează
        const uniqueDates = [...new Set(Object.keys(history))].sort().reverse()
        setDatesWithEntries(uniqueDates)

        const entriesForDay = history[selectedDate] || []
        setEntries(entriesForDay)

        const sum = { calorii: 0, sare: 0, zahar: 0, grasimi: 0 }

        for (const entry of entriesForDay) {
          sum.calorii += entry.calorii || 0
          sum.sare += entry.sare || 0
          sum.zahar += entry.zahar || 0
          sum.grasimi += entry.grasimi || 0
        }

        setTotals(sum)

        // Verifică și afișează avertismente
        checkNutritionalWarnings(sum)
      }
    } catch (err) {
      console.warn("Eroare la citirea jurnalului nutrițional:", err)
    }
    setLoading(false)
  }

  const checkNutritionalWarnings = (totals: any) => {
    const warnings = []

    // Avertisment pentru sare
    if (totals.sare > limits.sare) {
      warnings.push(`⚠️ Ai depășit limita de sare cu ${(totals.sare - limits.sare).toFixed(1)}g. Risc de hipertensiune!`)
    }

    // Avertisment pentru zahăr
    if (totals.zahar > limits.zahar) {
      warnings.push(`🍭 Ai depășit limita de zahăr cu ${(totals.zahar - limits.zahar).toFixed(1)}g. Risc de diabet!`)
    }

    // Recomandări pentru calorii în exces
    if (totals.calorii > limits.calorii && userProfile) {
      const excess = totals.calorii - limits.calorii
      const exercises = getExerciseRecommendations(excess, userProfile.weight)

      if (exercises.length > 0) {
        const topExercise = exercises[0]
        warnings.push(
          `🔥 Ai ${excess} calorii în exces. Recomandare: ${topExercise.icon} ${topExercise.name} pentru ${topExercise.minutes} minute`,
        )
      }
    }

    if (warnings.length > 0) {
      Alert.alert("Avertismente Nutriționale", warnings.join("\n\n"))
    }
  }

  const getProgressColor = (value: number, max: number) => {
    const percentage = (value / max) * 100
    if (percentage <= 70) return "#4caf50" // Verde
    if (percentage <= 90) return "#ff9800" // Portocaliu
    return "#f44336" // Roșu
  }

  const renderProgress = (label: string, value: number, max: number, unit: string, icon: string) => {
    const percentage = Math.min((value / max) * 100, 100)
    const color = getProgressColor(value, max)

    return (
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricIcon}>{icon}</Text>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={[styles.metricPercentage, { color }]}>{percentage.toFixed(0)}%</Text>
        </View>

        <View style={styles.progressBarWrapper}>
          <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>

        <View style={styles.metricFooter}>
          <Text style={styles.metricText}>
            {value.toFixed(1)} / {max} {unit}
          </Text>
          {value > max && (
            <Text style={styles.excessText}>
              +{(value - max).toFixed(1)} {unit}
            </Text>
          )}
        </View>
      </View>
    )
  }

  const renderHealthInsights = () => {
    const insights = []

    // Analiza tendinței săptămânale
    const weekDates = datesWithEntries.slice(0, 7)
    if (weekDates.length >= 3) {
      const avgCalories = weekDates.reduce((sum, date) => {
        // Calculează media pentru ultimele zile
        return sum + totals.calorii / weekDates.length
      }, 0)

      if (avgCalories > limits.calorii * 1.1) {
        insights.push("📈 Consumul tău de calorii a crescut în ultima săptămână")
      } else if (avgCalories < limits.calorii * 0.8) {
        insights.push("📉 Consumul tău de calorii este sub limita recomandată")
      }
    }

    // Analiza echilibrului nutrițional
    const saltRatio = totals.sare / limits.sare
    const sugarRatio = totals.zahar / limits.zahar

    if (saltRatio > 1.2 && sugarRatio > 1.2) {
      insights.push("⚖️ Încearcă să reduci atât sarea cât și zahărul pentru o dietă echilibrată")
    }

    return insights.length > 0 ? insights : []
  }

  // Funcție pentru a deschide modal-ul de feedback emoțional
  const openMoodModal = (entry: any) => {
    setSelectedEntry(entry)
    setSelectedMood(entry.moodAfterConsumption || null)
    setShowMoodModal(true)
  }

  // Funcție pentru a salva feedback-ul emoțional
  const saveMoodFeedback = async () => {
    if (!selectedEntry || !selectedMood) return

    try {
      const token = await AsyncStorage.getItem("token")
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]))
        const email = payload?.sub ?? "default"

        const key = `nutrition-history-${email}`
        const raw = await AsyncStorage.getItem(key)
        const history = raw ? JSON.parse(raw) : {}

        // Găsește și actualizează entry-ul în history
        const entriesForDay = history[selectedDate] || []
        const updatedEntries = entriesForDay.map((entry: any) => {
          if (entry.timestamp === selectedEntry.timestamp && entry.product === selectedEntry.product) {
            return {
              ...entry,
              moodAfterConsumption: selectedMood,
              moodTimestamp: Date.now(),
            }
          }
          return entry
        })

        history[selectedDate] = updatedEntries
        await AsyncStorage.setItem(key, JSON.stringify(history))

        // Actualizează entries în state
        setEntries(updatedEntries)
        setShowMoodModal(false)

        // Afișează confirmare
        Alert.alert(
          "Feedback salvat",
          "Mulțumim pentru feedback-ul tău emoțional! Aceste date ne ajută să înțelegem mai bine cum te afectează alimentele.",
        )
      }
    } catch (err) {
      console.error("Eroare la salvarea feedback-ului emoțional:", err)
      Alert.alert("Eroare", "Nu s-a putut salva feedback-ul emoțional")
    }
  }

  const renderEntryList = () => (
    <View style={styles.entryListSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name="restaurant-outline" size={24} color="#4caf50" />
        <Text style={styles.sectionTitle}>Produse consumate</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={48} color="#ccc" />
          <Text style={styles.noEntryText}>Nicio înregistrare pentru această zi</Text>
          <Text style={styles.noEntrySubtext}>Scanează produse pentru a începe monitorizarea</Text>
        </View>
      ) : (
        entries.map((entry, index) => (
          <TouchableOpacity key={index} style={styles.entryItem} onPress={() => openMoodModal(entry)}>
            <View style={styles.entryIcon}>
              <Ionicons name="nutrition-outline" size={20} color="#4caf50" />
            </View>
            <View style={styles.entryContent}>
              <Text style={styles.entryProduct}>{entry.product}</Text>
              <View style={styles.entryNutrients}>
                <Text style={styles.nutrientBadge}>🔥 {entry.calorii} kcal</Text>
                <Text style={styles.nutrientBadge}>🧂 {entry.sare}g</Text>
                <Text style={styles.nutrientBadge}>🍭 {entry.zahar}g</Text>
                <Text style={styles.nutrientBadge}>🥑 {entry.grasimi}g</Text>
              </View>
              {entry.moodAfterConsumption && (
                <View style={styles.moodIndicator}>
                  <Text style={styles.moodText}>
                    Stare: {getMoodEmoji(entry.moodAfterConsumption)} {getMoodLabel(entry.moodAfterConsumption)}
                  </Text>
                </View>
              )}
              {!entry.moodAfterConsumption && (
                <View style={styles.addMoodButton}>
                  <Text style={styles.addMoodText}>
                    <Ionicons name="add-circle-outline" size={14} /> Adaugă feedback emoțional
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  )

  // Funcții helper pentru afișarea stărilor emoționale
  const getMoodEmoji = (mood: string) => {
    return MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG]?.emoji || "❓"
  }

  const getMoodLabel = (mood: string) => {
    return MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG]?.label || mood
  }

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>📊 Jurnal Nutrițional</Text>
            <Text style={styles.subtitle}>Monitorizează consumul zilnic și primește recomandări personalizate</Text>
          </View>

          {/* Profile Setup Button */}
          <View style={styles.profileSection}>
            <FancyButton
              icon={userProfile ? "⚙️" : "👤"}
              label={userProfile ? "Actualizează profilul" : "Configurează profilul"}
              onPress={() => {
                if (userProfile) {
                  setProfileForm({
                    weight: userProfile.weight.toString(),
                    height: userProfile.height.toString(),
                    age: userProfile.age.toString(),
                    gender: userProfile.gender,
                    activityLevel: userProfile.activityLevel,
                  })
                }
                setShowProfileModal(true)
              }}
              backgroundColor={userProfile ? "rgba(34, 197, 94, 0.8)" : "rgba(236, 72, 153, 0.8)"}
              pressedColor={userProfile ? "rgba(22, 163, 74, 0.9)" : "rgba(219, 39, 119, 0.9)"}
              style={styles.profileButton}
            />
          </View>

          {/* Date Selector */}
          <View style={styles.dateSection}>
            <Text style={styles.dateTitle}>📅 Selectează ziua</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {datesWithEntries.length === 0 ? (
                <View style={styles.noDateContainer}>
                  <Text style={styles.noDateText}>Nicio înregistrare încă</Text>
                </View>
              ) : (
                datesWithEntries.map((date) => (
                  <TouchableOpacity
                    key={date}
                    onPress={() => setSelectedDate(date)}
                    style={[styles.dateButton, selectedDate === date && styles.dateButtonSelected]}
                  >
                    <Text style={[styles.dateText, selectedDate === date && styles.dateTextSelected]}>
                      {new Date(date).toLocaleDateString("ro-RO", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="rgba(34, 197, 94, 0.9)" />
              <Text style={styles.loadingText}>Se încarcă datele...</Text>
            </View>
          ) : (
            <View style={styles.content}>
              {/* Progress Cards */}
              <View style={styles.progressSection}>
                <Text style={styles.progressTitle}>📈 Progres zilnic</Text>
                {renderProgress("Calorii", totals.calorii, limits.calorii, "kcal", "🔥")}
                {renderProgress("Sare", totals.sare, limits.sare, "g", "🧂")}
                {renderProgress("Zahăr", totals.zahar, limits.zahar, "g", "🍭")}
                {renderProgress("Grăsimi", totals.grasimi, limits.grasimi, "g", "🥑")}
              </View>

              {/* Emotional Wellness Button */}
              <View style={styles.emotionalWellnessSection}>
                <FancyButton
                  icon="🧠"
                  label="Vezi analiza emoțională"
                  onPress={() => router.push("/emotionalhealth" as any)}
                  backgroundColor="rgba(147, 51, 234, 0.8)"
                  pressedColor="rgba(126, 34, 206, 0.9)"
                  style={styles.emotionalButton}
                  fullWidth={true}
                />
                <Text style={styles.emotionalSubtext}>Descoperă cum îți afectează alimentele starea de bine</Text>
              </View>

              {/* Health Insights */}
              {renderHealthInsights().length > 0 && (
                <View style={styles.insightsSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
                    <Text style={styles.sectionTitle}>Insights personalizate</Text>
                  </View>
                  {renderHealthInsights().map((insight, index) => (
                    <View key={index} style={styles.insightItem}>
                      <Text style={styles.insightText}>{String(insight)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Entry List */}
              {renderEntryList()}
            </View>
          )}
        </ScrollView>
      </ScreenWrapper>

      {/* Profile Modal */}
      <Modal visible={showProfileModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>👤 Configurează profilul</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Greutate (kg)</Text>
              <TextInput
                style={styles.formInput}
                value={profileForm.weight}
                onChangeText={(text) => setProfileForm({ ...profileForm, weight: text })}
                keyboardType="numeric"
                placeholder="ex: 70"
                returnKeyType="next"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Înălțime (cm)</Text>
              <TextInput
                style={styles.formInput}
                value={profileForm.height}
                onChangeText={(text) => setProfileForm({ ...profileForm, height: text })}
                keyboardType="numeric"
                placeholder="ex: 175"
                returnKeyType="next"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Vârsta</Text>
              <TextInput
                style={styles.formInput}
                value={profileForm.age}
                onChangeText={(text) => setProfileForm({ ...profileForm, age: text })}
                keyboardType="numeric"
                placeholder="ex: 25"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Gen</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderButton, profileForm.gender === "M" && styles.genderButtonSelected]}
                  onPress={() => setProfileForm({ ...profileForm, gender: "M" })}
                >
                  <Text style={[styles.genderText, profileForm.gender === "M" && styles.genderTextSelected]}>
                    👨 Masculin
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, profileForm.gender === "F" && styles.genderButtonSelected]}
                  onPress={() => setProfileForm({ ...profileForm, gender: "F" })}
                >
                  <Text style={[styles.genderText, profileForm.gender === "F" && styles.genderTextSelected]}>
                    👩 Feminin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <FancyButton
                icon="💾"
                label="Salvează"
                onPress={saveUserProfile}
                backgroundColor="rgba(34, 197, 94, 0.8)"
                pressedColor="rgba(22, 163, 74, 0.9)"
                style={styles.modalButton}
              />
              <FancyButton
                icon="❌"
                label="Anulează"
                onPress={() => {
                  Keyboard.dismiss()
                  setShowProfileModal(false)
                }}
                backgroundColor="rgba(156, 163, 175, 0.8)"
                pressedColor="rgba(107, 114, 128, 0.9)"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Mood Feedback Modal */}
      <Modal visible={showMoodModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>😊 Cum te-ai simțit după consum?</Text>

            {selectedEntry && (
              <View style={styles.selectedProductInfo}>
                <Text style={styles.selectedProductTitle}>{selectedEntry.product}</Text>
                <Text style={styles.selectedProductSubtitle}>
                  NutriScore: {selectedEntry.nutriscore || "N/A"} • {selectedEntry.calorii} kcal
                </Text>
              </View>
            )}

            <View style={styles.moodButtonsContainer}>
              {Object.entries(MOOD_CONFIG).map(([mood, config]) => (
                <TouchableOpacity
                  key={mood}
                  style={[
                    styles.moodSelectButton,
                    selectedMood === mood && styles.moodSelectButtonActive,
                    { borderColor: selectedMood === mood ? getMoodTypeColor(config.type) : "#ddd" },
                  ]}
                  onPress={() => setSelectedMood(mood)}
                >
                  <Text style={styles.moodSelectEmoji}>{config.emoji}</Text>
                  <Text
                    style={[
                      styles.moodSelectLabel,
                      selectedMood === mood && { color: getMoodTypeColor(config.type), fontWeight: "bold" },
                    ]}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.moodDescription}>
              <Text style={styles.moodDescriptionText}>
                Feedback-ul tău ne ajută să analizăm cum te afectează alimentele și să-ți oferim recomandări
                personalizate.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <FancyButton
                icon="💾"
                label="Salvează"
                onPress={selectedMood ? saveMoodFeedback : () => {}}
                backgroundColor={selectedMood ? "rgba(236, 72, 153, 0.8)" : "#ddd"}
                pressedColor={selectedMood ? "rgba(219, 39, 119, 0.9)" : "#ccc"}
                style={styles.modalButton}
              />
              <FancyButton
                icon="❌"
                label="Anulează"
                onPress={() => setShowMoodModal(false)}
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

// Funcție helper pentru a obține culoarea bazată pe tipul stării
const getMoodTypeColor = (type: string) => {
  switch (type) {
    case "positive":
      return "#22c55e"
    case "negative":
      return "#ef4444"
    default:
      return "#6b7280"
  }
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
  profileSection: {
    marginBottom: 20,
  },
  profileButton: {
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  dateScroll: {
    marginBottom: 16,
  },
  noDateContainer: {
    padding: 20,
    alignItems: "center",
  },
  noDateText: {
    color: "#666",
    fontSize: 16,
    fontStyle: "italic",
  },
  dateButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateButtonSelected: {
    backgroundColor: "rgba(34, 197, 94, 0.9)",
  },
  dateText: {
    color: "#333",
    fontWeight: "500",
    fontSize: 14,
  },
  dateTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  content: {
    gap: 24,
  },
  progressSection: {
    gap: 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  metricCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  metricIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  metricPercentage: {
    fontSize: 16,
    fontWeight: "bold",
  },
  progressBarWrapper: {
    height: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
  },
  metricFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  excessText: {
    fontSize: 12,
    color: "#f44336",
    fontWeight: "bold",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  insightsSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  insightItem: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  insightText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  entryListSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noEntryText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    fontWeight: "500",
  },
  noEntrySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
    fontStyle: "italic",
  },
  entryItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  entryContent: {
    flex: 1,
  },
  entryProduct: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  entryNutrients: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  nutrientBadge: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: "500",
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  genderButtonSelected: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderColor: "rgba(34, 197, 94, 0.5)",
  },
  genderText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  genderTextSelected: {
    color: "rgba(34, 197, 94, 0.9)",
    fontWeight: "bold",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
  moodIndicator: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  moodText: {
    fontSize: 12,
    color: "rgba(236, 72, 153, 0.8)",
    fontWeight: "500",
  },
  emotionalWellnessSection: {
    marginBottom: 24,
    alignItems: "center",
  },
  emotionalButton: {
    paddingVertical: 14,
    marginBottom: 8,
  },
  emotionalSubtext: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  addMoodButton: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(147, 51, 234, 0.1)",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  addMoodText: {
    fontSize: 12,
    color: "rgba(147, 51, 234, 0.8)",
    fontWeight: "500",
  },
  selectedProductInfo: {
    backgroundColor: "rgba(236, 72, 153, 0.05)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  selectedProductTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  selectedProductSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  moodButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  moodSelectButton: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  moodSelectButtonActive: {
    borderWidth: 2,
    backgroundColor: "rgba(236, 72, 153, 0.05)",
  },
  moodSelectEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  moodSelectLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  moodDescription: {
    marginBottom: 20,
  },
  moodDescriptionText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 20,
  },
})
