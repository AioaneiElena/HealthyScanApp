"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, ScrollView } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import useAuthGuard from "../../hooks/useAuthGuard"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import CustomNavbar from "../../components/CustomNavbar"
import ScreenWrapper from "../../components/ScreenWrapper"
import FancyButton from "../../components/ButtonHover"

type AlternativeSection = {
  title: string
  data: string[]
  icon: string
  color: string
  description: string
}

export default function AlternativesScreen() {
  useAuthGuard()
  const { name, categorie, nutriscore } = useLocalSearchParams()
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(true)
  const [openFoodSuggestions, setOpenFoodSuggestions] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchOpenFoodAlternatives()
    if (nutriscore) {
      fetchAiAlternatives()
    } else {
      setAiLoading(false)
    }
  }, [])

  const fetchOpenFoodAlternatives = async () => {
    try {
      const res = await fetch("http://192.168.0.102:8000/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, categorie }),
      })
      const data = await res.json()
      setOpenFoodSuggestions(data)
    } catch (err) {
      console.error("OpenFood alternatives error:", err)
      Alert.alert("Eroare", "Nu s-au putut încărca alternativele din baza de date")
    } finally {
      setLoading(false)
    }
  }

  const fetchAiAlternatives = async () => {
    try {
      const res = await fetch("http://192.168.0.102:8000/alternatives-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          categorie,
          nutriscore: nutriscore || "",
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setAiSuggestions(data.suggestions || [])
      } else {
        console.error("AI alternatives failed:", res.status)
      }
    } catch (err) {
      console.error("AI alternatives error:", err)
    } finally {
      setAiLoading(false)
    }
  }

  const sections: AlternativeSection[] = [
    {
      title: "Alternative din baza de date",
      data: openFoodSuggestions.filter((item) => item !== "No healthier alternatives found."),
      icon: "database-outline",
      color: "#22c55e",
      description: "Produse similare cu scoruri nutriționale mai bune din OpenFoodFacts",
    },
    ...(nutriscore
      ? [
          {
            title: "Sugestii AI personalizate",
            data: aiSuggestions,
            icon: "sparkles-outline",
            color: "#8b5cf6",
            description: "Alternative generate de AI bazate pe profilul nutrițional",
          },
        ]
      : []),
  ]

  const renderAlternativeItem = ({ item }: { item: string }) => (
    <View style={styles.alternativeCard}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="leaf" size={20} color="#22c55e" />
        </View>
        <Text style={styles.alternativeText}>{item}</Text>
      </View>
    </View>
  )

  const renderSection = (section: AlternativeSection) => {
    if (section.data.length === 0) return null

    return (
      <View key={section.title} style={styles.sectionContainer}>
        <View style={[styles.sectionHeader, { borderLeftColor: section.color }]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name={section.icon as any} size={24} color={section.color} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={[styles.countBadge, { backgroundColor: section.color }]}>
              <Text style={styles.countText}>{section.data.length}</Text>
            </View>
          </View>
          <Text style={styles.sectionDescription}>{section.description}</Text>
        </View>

        <FlatList
          data={section.data}
          keyExtractor={(item, index) => `${section.title}-${index}`}
          renderItem={renderAlternativeItem}
          scrollEnabled={false}
          contentContainerStyle={styles.alternativesList}
        />
      </View>
    )
  }

  const hasAnyResults =
    openFoodSuggestions.some((item) => item !== "No healthier alternatives found.") || aiSuggestions.length > 0
  const isFullyLoaded = !loading && !aiLoading

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>🍃 Alternative mai sănătoase</Text>
            <View style={styles.productNameContainer}>
              <Text style={styles.subtitle}>pentru:</Text>
              <Text style={styles.productName}>{name}</Text>
            </View>
            {nutriscore && (
              <View style={styles.nutriScoreContainer}>
                <Text style={styles.nutriScoreLabel}>NutriScore actual:</Text>
                <View style={[styles.nutriScoreBadge, { backgroundColor: getNutriScoreColor(nutriscore as string) }]}>
                  <Text style={styles.nutriScoreText}>{nutriscore}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Loading State */}
          {(loading || aiLoading) && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.loadingText}>
                {loading && aiLoading
                  ? "Se caută alternative..."
                  : loading
                    ? "Se caută în baza de date..."
                    : "AI generează sugestii..."}
              </Text>
              <View style={styles.loadingDetails}>
                <View style={styles.loadingItem}>
                  <Ionicons
                    name={loading ? "hourglass-outline" : "checkmark-circle"}
                    size={16}
                    color={loading ? "#f59e0b" : "#22c55e"}
                  />
                  <Text style={styles.loadingItemText}>Baza de date</Text>
                </View>
                {nutriscore && (
                  <View style={styles.loadingItem}>
                    <Ionicons
                      name={aiLoading ? "hourglass-outline" : "checkmark-circle"}
                      size={16}
                      color={aiLoading ? "#f59e0b" : "#22c55e"}
                    />
                    <Text style={styles.loadingItemText}>Sugestii AI</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Results */}
          {isFullyLoaded && (
            <>
              {hasAnyResults ? (
                <View style={styles.resultsContainer}>{sections.map(renderSection)}</View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="leaf-outline" size={80} color="rgba(236, 72, 153, 0.6)" />
                  <Text style={styles.emptyTitle}>Nu am găsit alternative</Text>
                  <Text style={styles.emptyText}>Nu am putut găsi produse mai sănătoase în aceeași categorie.</Text>
                  <Text style={styles.emptySubtext}>
                    Încearcă să cauți manual produse similare sau consultă un specialist în nutriție.
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <FancyButton
                  icon="🔍"
                  label="Caută manual produse"
                  onPress={() => router.push("/" as any)}
                  backgroundColor="rgba(59, 130, 246, 0.8)"
                  pressedColor="rgba(37, 99, 235, 0.9)"
                  style={styles.actionButton}
                />

                <FancyButton
                  icon="←"
                  label="Înapoi la produs"
                  onPress={() => router.back()}
                  backgroundColor="rgba(236, 72, 153, 0.9)"
                  pressedColor="rgba(219, 39, 119, 1)"
                  style={styles.actionButton}
                />
              </View>
            </>
          )}
        </ScrollView>
      </ScreenWrapper>
    </LinearGradient>
  )
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
    marginRight: 4,
  },
  productNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(236, 72, 153, 0.9)",
  },
  nutriScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nutriScoreLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  nutriScoreBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  nutriScoreText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingDetails: {
    marginTop: 20,
    gap: 8,
  },
  loadingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingItemText: {
    fontSize: 14,
    color: "#666",
  },
  resultsContainer: {
    gap: 24,
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    borderLeftWidth: 4,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  countBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  alternativesList: {
    padding: 16,
    gap: 12,
  },
  alternativeCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alternativeText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 22,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 30,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
  },
})
