"use client"

import { useEffect, useState } from "react"
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import ScreenWrapper from "../../components/ScreenWrapper"
import useAuthGuard from "../../hooks/useAuthGuard"
const screenWidth = Dimensions.get("window").width - 40

type MoodEntry = {
  timestamp: number
  product: string
  nutriscore: string
  nova: string
  moodAfterConsumption: string
  moodTimestamp: number
  calorii: number
  zahar: number
  sare: number
}

type MoodStats = {
  totalEntries: number
  moodDistribution: Array<{ mood: string; count: number; percentage: number; emoji: string }>
  nutriScoreCorrelation: Array<{ score: string; moods: Record<string, number> }>
  sugarMoodCorrelation: Array<{ range: string; moods: Record<string, number> }>
  weeklyMoodTrend: Array<{ day: string; positiveCount: number; negativeCount: number }>
  insights: string[]
  recommendations: string[]
}

const MOOD_CONFIG = {
  energetic: { emoji: "😊", label: "Energic", type: "positive" },
  satisfied: { emoji: "😌", label: "Sătul", type: "positive" },
  normal: { emoji: "😐", label: "Normal", type: "neutral" },
  bloated: { emoji: "😟", label: "Balonat", type: "negative" },
  tired: { emoji: "😴", label: "Obosit", type: "negative" },
  craving: { emoji: "🍭", label: "Poftă de dulce", type: "negative" },
}

export default function EmotionalWellnessScreen() {
  useAuthGuard()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<MoodStats | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState<"week" | "month" | "all">("month")

  useEffect(() => {
    loadMoodData()
  }, [selectedTimeframe])

  const loadMoodData = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) return

      const payload = JSON.parse(atob(token.split(".")[1]))
      const email = payload?.sub ?? "default"

      const key = `nutrition-history-${email}`
      const raw = await AsyncStorage.getItem(key)
      const history = raw ? JSON.parse(raw) : {}

      // Extrage toate entry-urile cu mood data
      const moodEntries: MoodEntry[] = []
      const now = Date.now()
      const timeframeDays = selectedTimeframe === "week" ? 7 : selectedTimeframe === "month" ? 30 : 365

      Object.keys(history).forEach((date) => {
        const entries = Array.isArray(history[date]) ? history[date] : [];
        entries.forEach((entry: MoodEntry) => {
          if (entry.moodAfterConsumption && entry.moodTimestamp) {
            const daysDiff: number = (now - entry.moodTimestamp) / (1000 * 60 * 60 * 24)
            if (daysDiff <= timeframeDays) {
              moodEntries.push(entry)
            }
          }
        })
      })

      if (moodEntries.length === 0) {
        setStats(null)
        setLoading(false)
        return
      }

      const statsData = calculateMoodStats(moodEntries)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading mood data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMoodStats = (entries: MoodEntry[]): MoodStats => {
    const totalEntries = entries.length

    // Distribuția stărilor emoționale
    const moodCount: Record<string, number> = {}
    entries.forEach((entry) => {
      moodCount[entry.moodAfterConsumption] = (moodCount[entry.moodAfterConsumption] || 0) + 1
    })

    const moodDistribution = Object.entries(moodCount).map(([mood, count]) => ({
      mood,
      count,
      percentage: Math.round((count / totalEntries) * 100),
      emoji: MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG]?.emoji || "❓",
    }))

    // Corelația cu NutriScore
    const nutriScoreGroups: Record<string, MoodEntry[]> = {}
    entries.forEach((entry) => {
      const score = entry.nutriscore || "Unknown"
      if (!nutriScoreGroups[score]) nutriScoreGroups[score] = []
      nutriScoreGroups[score].push(entry)
    })

    const nutriScoreCorrelation = Object.entries(nutriScoreGroups).map(([score, scoreEntries]) => {
      const moods: Record<string, number> = {}
      scoreEntries.forEach((entry) => {
        moods[entry.moodAfterConsumption] = (moods[entry.moodAfterConsumption] || 0) + 1
      })
      return { score, moods }
    })

    // Corelația cu zahărul
    const sugarRanges = [
      { range: "0-5g", min: 0, max: 5 },
      { range: "5-15g", min: 5, max: 15 },
      { range: "15-25g", min: 15, max: 25 },
      { range: "25g+", min: 25, max: Number.POSITIVE_INFINITY },
    ]

    const sugarMoodCorrelation = sugarRanges.map((range) => {
      const rangeEntries = entries.filter((entry) => entry.zahar >= range.min && entry.zahar < range.max)
      const moods: Record<string, number> = {}
      rangeEntries.forEach((entry) => {
        moods[entry.moodAfterConsumption] = (moods[entry.moodAfterConsumption] || 0) + 1
      })
      return { range: range.range, moods }
    })

    // Tendința săptămânală
    const weekDays = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"]
    const weeklyMoodTrend = weekDays.map((day, index) => {
      const dayEntries = entries.filter((entry) => {
        const date = new Date(entry.moodTimestamp)
        const dayOfWeek = date.getDay()
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        return adjustedDay === index
      })

      const positiveCount = dayEntries.filter((entry) =>
        ["energetic", "satisfied"].includes(entry.moodAfterConsumption),
      ).length
      const negativeCount = dayEntries.filter((entry) =>
        ["bloated", "tired", "craving"].includes(entry.moodAfterConsumption),
      ).length

      return { day, positiveCount, negativeCount }
    })

    // Generează insights
    const insights = generateInsights(entries, moodDistribution, nutriScoreCorrelation, sugarMoodCorrelation)
    const recommendations = generateRecommendations(insights, moodDistribution)

    return {
      totalEntries,
      moodDistribution,
      nutriScoreCorrelation,
      sugarMoodCorrelation,
      weeklyMoodTrend,
      insights,
      recommendations,
    }
  }

  const generateInsights = (
    entries: MoodEntry[],
    moodDistribution: any[],
    nutriScoreCorrelation: any[],
    sugarMoodCorrelation: any[],
  ): string[] => {
    const insights: string[] = []

    // Analiza stării generale
    const positivePercentage = moodDistribution
      .filter((mood) => ["energetic", "satisfied"].includes(mood.mood))
      .reduce((sum, mood) => sum + mood.percentage, 0)

    if (positivePercentage > 60) {
      insights.push("🎉 Excelent! Alimentele tale îți oferă în general energie și satisfacție.")
    } else if (positivePercentage < 30) {
      insights.push("⚠️ Observăm că multe alimente îți afectează negativ starea de bine.")
    }

    // Analiza NutriScore
    const badNutriEntries = entries.filter((entry) => ["D", "E"].includes(entry.nutriscore))
    const badNutriNegativeMoods = badNutriEntries.filter((entry) =>
      ["bloated", "tired", "craving"].includes(entry.moodAfterConsumption),
    )

    if (badNutriNegativeMoods.length > badNutriEntries.length * 0.6) {
      insights.push("📊 Produsele cu NutriScore D/E îți afectează frecvent starea emoțională.")
    }

    // Analiza zahărului
    const highSugarEntries = entries.filter((entry) => entry.zahar > 15)
    const highSugarCravings = highSugarEntries.filter((entry) => entry.moodAfterConsumption === "craving")

    if (highSugarCravings.length > highSugarEntries.length * 0.4) {
      insights.push("🍭 Produsele cu zahăr ridicat îți declanșează adesea pofta de dulce.")
    }

    // Analiza zilelor săptămânii
    const weekendEntries = entries.filter((entry) => {
      const date = new Date(entry.moodTimestamp)
      const dayOfWeek = date.getDay()
      return dayOfWeek === 0 || dayOfWeek === 6 // Sâmbătă și Duminică
    })

    const weekendNegative = weekendEntries.filter((entry) => ["bloated", "tired"].includes(entry.moodAfterConsumption))

    if (weekendNegative.length > weekendEntries.length * 0.5) {
      insights.push("📅 Weekendurile par să fie mai provocatoare pentru starea ta de bine.")
    }

    return insights
  }

  const generateRecommendations = (insights: string[], moodDistribution: any[]): string[] => {
    const recommendations: string[] = []

    const negativePercentage = moodDistribution
      .filter((mood) => ["bloated", "tired", "craving"].includes(mood.mood))
      .reduce((sum, mood) => sum + mood.percentage, 0)

    if (negativePercentage > 40) {
      recommendations.push("🥗 Încearcă să incluzi mai multe alimente cu NutriScore A și B în dieta ta.")
      recommendations.push("💧 Bea mai multă apă și reduce consumul de produse procesate.")
    }

    const bloatedCount = moodDistribution.find((mood) => mood.mood === "bloated")?.count || 0
    if (bloatedCount > 3) {
      recommendations.push("🌾 Consideră să reduci alimentele bogate în sare și să adaugi mai multe fibre.")
    }

    const cravingCount = moodDistribution.find((mood) => mood.mood === "craving")?.count || 0
    if (cravingCount > 3) {
      recommendations.push("🍎 Înlocuiește dulciurile cu fructe pentru a controla poftele de zahăr.")
    }

    const tiredCount = moodDistribution.find((mood) => mood.mood === "tired")?.count || 0
    if (tiredCount > 3) {
      recommendations.push("⚡ Alege alimente cu indice glicemic scăzut pentru energie constantă.")
    }

    return recommendations
  }

  const getMoodColor = (mood: string) => {
    const type = MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG]?.type
    switch (type) {
      case "positive":
        return "#22c55e"
      case "negative":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  if (loading) {
    return (
      <LinearGradient
        colors={["#ffd6ec", "#fff4b3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScreenWrapper hasTopNavbar={false} hasBottomNavbar={false}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="rgba(236, 72, 153, 0.6)" />
            <Text style={styles.loadingText}>Se analizează datele emoționale...</Text>
          </View>
        </ScreenWrapper>
      </LinearGradient>
    )
  }

  if (!stats) {
    return (
      <LinearGradient
        colors={["#ffd6ec", "#fff4b3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScreenWrapper hasTopNavbar={false} hasBottomNavbar={false}>
          <View style={styles.emptyContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>← Înapoi</Text>
            </TouchableOpacity>
            <Ionicons name="heart-outline" size={60} color="rgba(236, 72, 153, 0.6)" />
            <Text style={styles.emptyText}>Nicio dată emoțională încă</Text>
            <Text style={styles.emptySubtext}>
              Scanează produse și oferă feedback despre cum te simți după consum pentru a vedea analize personalizate.
            </Text>
          </View>
        </ScreenWrapper>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <ScreenWrapper hasTopNavbar={false} hasBottomNavbar={false}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Înapoi</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>🧠 Wellness Emoțional</Text>
            <Text style={styles.subtitle}>Corelația dintre alimentație și starea ta de bine</Text>
          </View>

          {/* Timeframe Selector */}
          <View style={styles.timeframeContainer}>
            <TouchableOpacity
              style={[styles.timeframeButton, selectedTimeframe === "week" && styles.timeframeButtonActive]}
              onPress={() => setSelectedTimeframe("week")}
            >
              <Text style={[styles.timeframeText, selectedTimeframe === "week" && styles.timeframeTextActive]}>
                7 zile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeframeButton, selectedTimeframe === "month" && styles.timeframeButtonActive]}
              onPress={() => setSelectedTimeframe("month")}
            >
              <Text style={[styles.timeframeText, selectedTimeframe === "month" && styles.timeframeTextActive]}>
                30 zile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeframeButton, selectedTimeframe === "all" && styles.timeframeButtonActive]}
              onPress={() => setSelectedTimeframe("all")}
            >
              <Text style={[styles.timeframeText, selectedTimeframe === "all" && styles.timeframeTextActive]}>
                Tot timpul
              </Text>
            </TouchableOpacity>
          </View>

          {/* Overview */}
          <View style={styles.overviewCard}>
            <Text style={styles.overviewTitle}>📊 Rezumat</Text>
            <Text style={styles.overviewText}>
              {stats.totalEntries} înregistrări cu feedback emoțional în ultimele{" "}
              {selectedTimeframe === "week" ? "7 zile" : selectedTimeframe === "month" ? "30 zile" : "12 luni"}
            </Text>
          </View>

          {/* Mood Distribution */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="happy-outline" size={24} color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.cardTitle}>Distribuția stărilor emoționale</Text>
            </View>
            {stats.moodDistribution.map((mood, index) => (
              <View key={index} style={styles.moodItem}>
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <View style={styles.moodInfo}>
                  <Text style={styles.moodLabel}>
                    {MOOD_CONFIG[mood.mood as keyof typeof MOOD_CONFIG]?.label || mood.mood}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${mood.percentage}%`, backgroundColor: getMoodColor(mood.mood) },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.moodPercentage}>{mood.percentage}%</Text>
              </View>
            ))}
          </View>

          {/* Weekly Mood Trend */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up-outline" size={24} color="rgba(34, 197, 94, 0.9)" />
              <Text style={styles.cardTitle}>Tendința săptămânală</Text>
            </View>
            <View style={styles.weeklyChart}>
              {stats.weeklyMoodTrend.map((day, index) => {
                const total = day.positiveCount + day.negativeCount
                const positiveHeight = total > 0 ? (day.positiveCount / total) * 100 : 0
                const negativeHeight = total > 0 ? (day.negativeCount / total) * 100 : 0

                return (
                  <View key={index} style={styles.weeklyBar}>
                    <View style={styles.weeklyBarContainer}>
                      <View style={[styles.weeklyBarPositive, { height: `${positiveHeight}%` }]} />
                      <View style={[styles.weeklyBarNegative, { height: `${negativeHeight}%` }]} />
                    </View>
                    <Text style={styles.weeklyDay}>{day.day}</Text>
                    <Text style={styles.weeklyCount}>
                      +{day.positiveCount} -{day.negativeCount}
                    </Text>
                  </View>
                )
              })}
            </View>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: "#22c55e" }]} />
                <Text style={styles.legendText}>Pozitiv</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: "#ef4444" }]} />
                <Text style={styles.legendText}>Negativ</Text>
              </View>
            </View>
          </View>

          {/* Insights */}
          {stats.insights.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="bulb-outline" size={24} color="rgba(245, 158, 11, 0.9)" />
                <Text style={styles.cardTitle}>Insights personalizate</Text>
              </View>
              {stats.insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {stats.recommendations.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="leaf-outline" size={24} color="rgba(34, 197, 94, 0.9)" />
                <Text style={styles.cardTitle}>Recomandări pentru tine</Text>
              </View>
              {stats.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>
          )}

          {/* NutriScore Correlation */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics-outline" size={24} color="rgba(59, 130, 246, 0.9)" />
              <Text style={styles.cardTitle}>Corelația cu NutriScore</Text>
            </View>
            {stats.nutriScoreCorrelation.map((correlation, index) => {
              const total = Object.values(correlation.moods).reduce((sum: number, count) => sum + count, 0)
              if (total === 0) return null

              return (
                <View key={index} style={styles.correlationItem}>
                  <Text style={styles.correlationLabel}>NutriScore {correlation.score}</Text>
                  <View style={styles.correlationMoods}>
                    {Object.entries(correlation.moods).map(([mood, count]) => {
                      const percentage = Math.round((count / total) * 100)
                      return (
                        <View key={mood} style={styles.correlationMood}>
                          <Text style={styles.correlationMoodEmoji}>
                            {MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG]?.emoji || "❓"}
                          </Text>
                          <Text style={styles.correlationMoodText}>{percentage}%</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              )
            })}
          </View>

          {/* Sugar Correlation */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="nutrition-outline" size={24} color="rgba(245, 158, 11, 0.9)" />
              <Text style={styles.cardTitle}>Corelația cu zahărul</Text>
            </View>
            {stats.sugarMoodCorrelation.map((correlation, index) => {
              const total = Object.values(correlation.moods).reduce((sum: number, count) => sum + count, 0)
              if (total === 0) return null

              return (
                <View key={index} style={styles.correlationItem}>
                  <Text style={styles.correlationLabel}>Zahăr {correlation.range}</Text>
                  <View style={styles.correlationMoods}>
                    {Object.entries(correlation.moods).map(([mood, count]) => {
                      const percentage = Math.round((count / total) * 100)
                      return (
                        <View key={mood} style={styles.correlationMood}>
                          <Text style={styles.correlationMoodEmoji}>
                            {MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG]?.emoji || "❓"}
                          </Text>
                          <Text style={styles.correlationMoodText}>{percentage}%</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              )
            })}
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 100,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(236, 72, 153, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 0,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
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
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  timeframeContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  timeframeButtonActive: {
    backgroundColor: "rgba(236, 72, 153, 0.9)",
  },
  timeframeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  timeframeTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  overviewCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  overviewText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  moodItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  moodEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  moodInfo: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
    fontWeight: "500",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  moodPercentage: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
    fontWeight: "bold",
  },
  weeklyChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    paddingTop: 20,
  },
  weeklyBar: {
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
  weeklyBarContainer: {
    width: 20,
    height: 80,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 8,
    justifyContent: "flex-end",
  },
  weeklyBarPositive: {
    backgroundColor: "#22c55e",
    width: "100%",
  },
  weeklyBarNegative: {
    backgroundColor: "#ef4444",
    width: "100%",
  },
  weeklyDay: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  weeklyCount: {
    fontSize: 10,
    color: "#999",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
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
  recommendationItem: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
  },
  recommendationText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  correlationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  correlationLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  correlationMoods: {
    flexDirection: "row",
    gap: 12,
  },
  correlationMood: {
    alignItems: "center",
  },
  correlationMoodEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  correlationMoodText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
})
