import { useEffect, useState } from "react"
import { View, Text, ScrollView, Dimensions, StyleSheet, TouchableOpacity } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import useAuthGuard from "../../hooks/useAuthGuard"
import ScreenWrapper from "../../components/ScreenWrapper"

const screenWidth = Dimensions.get("window").width - 32

type SearchEntry = {
  query: string
  timestamp: number
  rezultate: any[]
  nutriscores: string[]
}

type StatsData = {
  totalSearches: number
  uniqueProducts: number
  totalCartItems: number
  averagePrice: number
  topQueries: Array<{ name: string; count: number }>
  nutriScoreDistribution: Array<{ score: string; count: number; percentage: number }>
  storePreferences: Array<{ store: string; count: number; percentage: number }>
  weeklyActivity: Array<{ day: string; searches: number }>
  priceRanges: Array<{ range: string; count: number }>
  healthTrend: Array<{ period: string; healthyChoices: number }>
}

export default function StatsScreen() {
  useAuthGuard()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) return

      const payload = JSON.parse(atob(token.split(".")[1]))
      const email = payload?.sub ?? "default"

      const nutriRaw = await AsyncStorage.getItem(`nutriscore-history-${email}`)
      const nutriHistory: Array<{ timestamp: number; nutriscore: string }> = nutriRaw ? JSON.parse(nutriRaw) : []

      const istoricKey = `istoric-${email}`
      const istoricRaw = await AsyncStorage.getItem(istoricKey)
      const istoric: SearchEntry[] = istoricRaw ? JSON.parse(istoricRaw) : []

      const usageKey = `cart-usage-${email}`
      const usageRaw = await AsyncStorage.getItem(usageKey)
      const usage = usageRaw ? JSON.parse(usageRaw) : {}

      const cartKey = `cart-${email}`
      const cartRaw = await AsyncStorage.getItem(cartKey)
      const cart = cartRaw ? JSON.parse(cartRaw) : []

      const statsData = calculateStats(istoric, usage, cart, nutriHistory)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (istoric: SearchEntry[], usage: any, cart: any[], nutriHistory: Array<{ timestamp: number; nutriscore: string }>): StatsData => {
    const totalSearches = istoric.length
    const uniqueProducts = new Set(istoric.map((entry) => entry.query)).size

    const queryCount: Record<string, number> = {}
    istoric.forEach((entry) => {
      queryCount[entry.query] = (queryCount[entry.query] || 0) + 1
    })
    const topQueries = Object.entries(queryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    const weekDays = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"]
    const weeklyCount = new Array(7).fill(0)
    istoric.forEach((entry) => {
      const date = new Date(entry.timestamp)
      const dayOfWeek = date.getDay()
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      weeklyCount[adjustedDay]++
    })
    const weeklyActivity = weekDays.map((day, index) => ({
      day,
      searches: weeklyCount[index],
    }))

    const totalCartItems = cart.length

    const prices = cart
      .filter((item) => item.pret && !isNaN(item.pret))
      .map((item) => Number(item.pret))
    const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    
    const nutriCount: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 }
    nutriHistory.forEach((entry) => {
      const score = entry.nutriscore?.toUpperCase()
      if (score && nutriCount[score] !== undefined) {
        nutriCount[score]++
      }
    })

    const totalNutriScores = Object.values(nutriCount).reduce((a, b) => a + b, 0)

    const nutriScoreDistribution = Object.entries(nutriCount)
      .filter(([, count]) => count > 0)
      .map(([score, count]) => ({
        score,
        count,
        percentage: totalNutriScores > 0 ? Math.round((count / totalNutriScores) * 100) : 0,
      }))

      const healthTrend: StatsData["healthTrend"] = []

      const now = Date.now()
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date()
        dayStart.setHours(0, 0, 0, 0)
        dayStart.setDate(dayStart.getDate() - i)

        const dayEnd = new Date(dayStart)
        dayEnd.setHours(23, 59, 59, 999)

        const healthyChoices = nutriHistory.filter(
          (entry) =>
            entry.timestamp >= dayStart.getTime() &&
            entry.timestamp <= dayEnd.getTime() &&
            (entry.nutriscore === "A" || entry.nutriscore === "B")
        ).length

        healthTrend.push({
          period: `${dayStart.getDate()}/${dayStart.getMonth() + 1}`,
          healthyChoices,
        })
      }


    const domainFreq: Record<string, number> = {}
    cart.forEach((item) => {
      const domain = item.magazin?.toLowerCase()
      if (domain) domainFreq[domain] = (domainFreq[domain] || 0) + 1
    })
    const totalDomain = Object.values(domainFreq).reduce((a, b) => a + b, 0)
    const storePreferences = Object.entries(domainFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([store, count]) => ({
        store,
        count,
        percentage: totalDomain > 0 ? Math.round((count / totalDomain) * 100) : 0,
      }))


    const priceRanges: StatsData["priceRanges"] = []

    return {
      totalSearches,
      uniqueProducts,
      totalCartItems,
      averagePrice,
      topQueries,
      nutriScoreDistribution,
      storePreferences,
      weeklyActivity,
      priceRanges,
      healthTrend,
    }
  }


  const getNutriScoreColor = (score: string) => {
    switch (score.toUpperCase()) {
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

  const getStoreIcon = (store: string) => {
    const storeIcons: { [key: string]: string } = {
      emag: "🛒",
      altex: "💻",
      flanco: "📱",
      carrefour: "🛍️",
      kaufland: "🏪",
      lidl: "🛒",
      auchan: "🏬",
    }
    return storeIcons[store.toLowerCase()] || "🏪"
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
            <Ionicons name="analytics-outline" size={60} color="rgba(236, 72, 153, 0.6)" />
            <Text style={styles.loadingText}>Se încarcă statisticile...</Text>
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
            <Ionicons name="bar-chart-outline" size={60} color="rgba(236, 72, 153, 0.6)" />
            <Text style={styles.emptyText}>Nu există date pentru statistici</Text>
            <Text style={styles.emptySubtext}>Începe să cauți produse pentru a vedea statisticile tale!</Text>
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
            <Text style={styles.title}>📊 Statisticile tale</Text>
            <Text style={styles.subtitle}>Analiza comportamentului de cumpărături</Text>
          </View>

          {/* Overview Cards */}
          <View style={styles.overviewContainer}>
            <View style={styles.overviewCard}>
              <Ionicons name="search-outline" size={24} color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.overviewNumber}>{stats.totalSearches}</Text>
              <Text style={styles.overviewLabel}>Căutări totale</Text>
            </View>

            <View style={styles.overviewCard}>
              <Ionicons name="cube-outline" size={24} color="rgba(59, 130, 246, 0.9)" />
              <Text style={styles.overviewNumber}>{stats.uniqueProducts}</Text>
              <Text style={styles.overviewLabel}>Produse unice</Text>
            </View>

            <View style={styles.overviewCard}>
              <Ionicons name="cart-outline" size={24} color="rgba(34, 197, 94, 0.9)" />
              <Text style={styles.overviewNumber}>{stats.totalCartItems}</Text>
              <Text style={styles.overviewLabel}>În coș</Text>
            </View>

            <View style={styles.overviewCard}>
              <Ionicons name="cash-outline" size={24} color="rgba(245, 158, 11, 0.9)" />
              <Text style={styles.overviewNumber}>{stats.averagePrice.toFixed(0)}</Text>
              <Text style={styles.overviewLabel}>Preț mediu (lei)</Text>
            </View>
          </View>

          {/* Top Searches */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up-outline" size={24} color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.cardTitle}>Cele mai căutate produse</Text>
            </View>
            {stats.topQueries.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <Text style={styles.listItemText}>{item.name}</Text>
                <Text style={styles.listItemCount}>{item.count} căutări</Text>
              </View>
            ))}
          </View>

          {/* NutriScore Distribution */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="nutrition-outline" size={24} color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.cardTitle}>Distribuție NutriScore</Text>
            </View>
            {stats.nutriScoreDistribution.map((item, index) => (
              <View key={index} style={styles.nutriItem}>
                <View style={[styles.nutriBadge, { backgroundColor: getNutriScoreColor(item.score) }]}>
                  <Text style={styles.nutriBadgeText}>{item.score}</Text>
                </View>
                <View style={styles.nutriInfo}>
                  <Text style={styles.nutriLabel}>Scor {item.score}</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${item.percentage}%`, backgroundColor: getNutriScoreColor(item.score) },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.nutriPercentage}>{item.percentage}%</Text>
              </View>
            ))}
          </View>

          {/* Store Preferences */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="storefront-outline" size={24} color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.cardTitle}>Magazine preferate</Text>
            </View>
            {stats.storePreferences.map((item, index) => (
              <View key={index} style={styles.storeItem}>
                <Text style={styles.storeIcon}>{getStoreIcon(item.store)}</Text>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeLabel}>{item.store}</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${item.percentage}%`, backgroundColor: "rgba(236, 72, 153, 0.8)" },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.storePercentage}>{item.percentage}%</Text>
              </View>
            ))}
          </View>

          {/* Weekly Activity */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={24} color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.cardTitle}>Activitate săptămânală</Text>
            </View>
            <View style={styles.weeklyChart}>
              {stats.weeklyActivity.map((item, index) => {
                const maxSearches = Math.max(...stats.weeklyActivity.map((d) => d.searches))
                const height = maxSearches > 0 ? (item.searches / maxSearches) * 100 : 0
                return (
                  <View key={index} style={styles.weeklyBar}>
                    <View style={[styles.weeklyBarFill, { height: `${height}%` }]} />
                    <Text style={styles.weeklyDay}>{item.day}</Text>
                    <Text style={styles.weeklyCount}>{item.searches}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Health Trend */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="fitness-outline" size={24} color="rgba(34, 197, 94, 0.9)" />
              <Text style={styles.cardTitle}>Tendința alegerilor sănătoase</Text>
            </View>
            <View style={styles.healthChart}>
              {stats.healthTrend.map((item, index) => {
                const maxChoices = Math.max(...stats.healthTrend.map((d) => d.healthyChoices))
                const height = maxChoices > 0 ? (item.healthyChoices / maxChoices) * 100 : 0
                return (
                  <View key={index} style={styles.healthBar}>
                    <View style={[styles.healthBarFill, { height: `${height}%` }]} />
                    <Text style={styles.healthPeriod}>{item.period}</Text>
                    <Text style={styles.healthCount}>{item.healthyChoices}</Text>
                  </View>
                )
              })}
            </View>
            <Text style={styles.healthNote}>* Produse cu NutriScore A sau B</Text>
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
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(236, 72, 153, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 16,
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
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 100
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
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
  overviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  overviewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: "48%",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
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
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rankBadge: {
    backgroundColor: "rgba(236, 72, 153, 0.9)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  listItemCount: {
    fontSize: 12,
    color: "#666",
  },
  nutriItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  nutriBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  nutriBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  nutriInfo: {
    flex: 1,
  },
  nutriLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
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
  nutriPercentage: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  storeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  storeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  storePercentage: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
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
  weeklyBarFill: {
    backgroundColor: "rgba(236, 72, 153, 0.8)",
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
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
  healthChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    paddingTop: 20,
  },
  healthBar: {
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
  healthBarFill: {
    backgroundColor: "rgba(34, 197, 94, 0.8)",
    width: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  healthPeriod: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  healthCount: {
    fontSize: 10,
    color: "#999",
  },
  healthNote: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
})
