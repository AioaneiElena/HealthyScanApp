"use client"

import { useState } from "react"
import { View, Text, ScrollView, Alert, Share, StyleSheet, Platform, StatusBar } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import useAuthGuard from "../../hooks/useAuthGuard"
import FancyButton from "../../components/ButtonHover"

const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24

type SavedRecipe = {
  id: string
  name: string
  ingredients: string[]
  instructions: string[]
  time?: string
  servings?: string
  nutritionalTips?: string
  originalText: string
  createdAt: number
  tags: string[]
}

// Helper function to format text with ** markers
const formatTextWithBold = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.replace(/\*\*/g, "")
      return (
        <Text key={index} style={styles.boldText}>
          {boldText}
        </Text>
      )
    }
    return (
      <Text key={index} style={styles.normalText}>
        {part}
      </Text>
    )
  })
}

export default function RecipeDetailScreen() {
  useAuthGuard()
  const router = useRouter()
  const { recipe } = useLocalSearchParams()
  const [deleting, setDeleting] = useState(false)

  if (!recipe) {
    return (
      <LinearGradient
        colors={["#ffd6ec", "#fff4b3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="rgba(236, 72, 153, 0.6)" />
          <Text style={styles.errorTitle}>Rețeta nu a fost găsită</Text>
          <FancyButton
            icon="←"
            label="Înapoi"
            onPress={() => router.back()}
            backgroundColor="rgba(236, 72, 153, 0.9)"
            pressedColor="rgba(219, 39, 119, 1)"
            style={styles.errorBackButton}
          />
        </View>
      </LinearGradient>
    )
  }

  const parsedRecipe: SavedRecipe = JSON.parse(recipe as string)

  const shareRecipe = async () => {
    try {
      const shareText = `🍽️ ${parsedRecipe.name}\n\n📝 Ingrediente:\n${parsedRecipe.ingredients
        .map((ing, i) => `${i + 1}. ${ing}`)
        .join("\n")}\n\n👨‍🍳 Mod de preparare:\n${parsedRecipe.instructions
        .map((inst, i) => `${i + 1}. ${inst}`)
        .join(
          "\n",
        )}\n\n${parsedRecipe.nutritionalTips ? `💡 Sfaturi:\n${parsedRecipe.nutritionalTips}\n\n` : ""}Generat cu AI 🤖`

      await Share.share({
        message: shareText,
        title: parsedRecipe.name,
      })
    } catch (error) {
      console.error("Error sharing recipe:", error)
    }
  }

  const deleteRecipe = async () => {
    Alert.alert("Șterge rețeta", "Ești sigur că vrei să ștergi această rețetă?", [
      {
        text: "Anulează",
        style: "cancel",
      },
      {
        text: "Șterge",
        style: "destructive",
        onPress: async () => {
          setDeleting(true)
          try {
            const token = await AsyncStorage.getItem("token")
            if (!token) return

            const payload = JSON.parse(atob(token.split(".")[1]))
            const email = payload?.sub ?? "default"

            const recipesKey = `saved-recipes-${email}`
            const savedRecipes = await AsyncStorage.getItem(recipesKey)
            const recipes: SavedRecipe[] = savedRecipes ? JSON.parse(savedRecipes) : []

            const updatedRecipes = recipes.filter((r) => r.id !== parsedRecipe.id)

            await AsyncStorage.setItem(recipesKey, JSON.stringify(updatedRecipes))

            Alert.alert("✅ Rețetă ștearsă", "Rețeta a fost eliminată din colecția ta.")
            router.back()
          } catch (error) {
            console.error("Error deleting recipe:", error)
            Alert.alert("Eroare", "Nu s-a putut șterge rețeta.")
          } finally {
            setDeleting(false)
          }
        },
      },
    ])
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <FancyButton
            icon="←"
            label="Înapoi"
            onPress={() => router.back()}
            backgroundColor="rgba(236, 72, 153, 0.8)"
            pressedColor="rgba(219, 39, 119, 0.9)"
            style={styles.backButton}
          />

          <View style={styles.titleContainer}>
            <Text style={styles.title}>{parsedRecipe.name}</Text>
            <Text style={styles.dateText}>Salvată pe {formatDate(parsedRecipe.createdAt)}</Text>
          </View>
        </View>

        {/* Recipe Info */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color="#3b82f6" />
            <Text style={styles.cardTitle}>Informații generale</Text>
          </View>
          <View style={styles.infoGrid}>
            {parsedRecipe.time && (
              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color="#f59e0b" />
                <Text style={styles.infoLabel}>Timp:</Text>
                <Text style={styles.infoValue}>{parsedRecipe.time}</Text>
              </View>
            )}
            {parsedRecipe.servings && (
              <View style={styles.infoItem}>
                <Ionicons name="people" size={20} color="#22c55e" />
                <Text style={styles.infoLabel}>Porții:</Text>
                <Text style={styles.infoValue}>{parsedRecipe.servings}</Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Ionicons name="star" size={20} color="#f59e0b" />
              <Text style={styles.infoLabel}>Dificultate:</Text>
              <Text style={styles.infoValue}>Ușor</Text>
            </View>
          </View>
        </View>

        {/* Tags */}
        {parsedRecipe.tags.length > 0 && (
          <View style={styles.tagsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="pricetag" size={24} color="#8b5cf6" />
              <Text style={styles.cardTitle}>Etichete</Text>
            </View>
            <View style={styles.tagsContainer}>
              {parsedRecipe.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ingredients */}
        <View style={styles.ingredientsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf" size={24} color="#22c55e" />
            <Text style={styles.cardTitle}>Ingrediente</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{parsedRecipe.ingredients.length}</Text>
            </View>
          </View>
          <View style={styles.ingredientsList}>
            {parsedRecipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientText}>{formatTextWithBold(ingredient)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={24} color="#f59e0b" />
            <Text style={styles.cardTitle}>Mod de preparare</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{parsedRecipe.instructions.length}</Text>
            </View>
          </View>
          <View style={styles.instructionsList}>
            {parsedRecipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{formatTextWithBold(instruction)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Nutritional Tips */}
        {parsedRecipe.nutritionalTips && (
          <View style={styles.nutritionalCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="fitness" size={24} color="#ef4444" />
              <Text style={styles.cardTitle}>Sfaturi nutriționale</Text>
            </View>
            <Text style={styles.nutritionalText}>{formatTextWithBold(parsedRecipe.nutritionalTips.trim())}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <FancyButton
            icon="📤"
            label="Distribuie rețeta"
            onPress={shareRecipe}
            backgroundColor="rgba(59, 130, 246, 0.8)"
            pressedColor="rgba(37, 99, 235, 0.9)"
            style={styles.actionButton}
          />

          <FancyButton
            icon={deleting ? "⏳" : "🗑️"}
            label={deleting ? "Se șterge..." : "Șterge rețeta"}
            onPress={deleteRecipe}
            backgroundColor="#ef4444"
            pressedColor="#dc2626"
            style={styles.actionButton}
          />
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
    paddingHorizontal: 20,
    paddingVertical: STATUS_BAR_HEIGHT + 30,
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 30,
    textAlign: "center",
  },
  errorBackButton: {
    paddingHorizontal: 30,
  },
  headerContainer: {
    marginBottom: 30,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 30,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
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
    flex: 1,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    marginLeft: "auto",
  },
  tagsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#8b5cf6",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  tagText: {
    fontSize: 12,
    color: "#8b5cf6",
    fontWeight: "500",
  },
  ingredientsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
  },
  countBadge: {
    backgroundColor: "#22c55e",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
    marginTop: 8,
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    lineHeight: 20,
  },
  instructionsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  instructionText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    lineHeight: 20,
  },
  nutritionalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  nutritionalText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
  },
  boldText: {
    fontWeight: "bold",
    color: "rgba(236, 72, 153, 0.9)",
  },
  normalText: {
    fontWeight: "normal",
    color: "#333",
  },
})
