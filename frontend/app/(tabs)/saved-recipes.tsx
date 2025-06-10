"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import useAuthGuard from "../../hooks/useAuthGuard"
import CustomNavbar from "../../components/CustomNavbar"
import CustomBottomNavbar from "../../components/CustomBottomNavbar"
import ScreenWrapper from "../../components/ScreenWrapper"
import FancyButton from "../../components/ButtonHover"

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

export default function SavedRecipesScreen() {
  useAuthGuard()
  const router = useRouter()
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredRecipes, setFilteredRecipes] = useState<SavedRecipe[]>([])

  useEffect(() => {
    loadRecipes()
  }, [])

  useEffect(() => {
    filterRecipes()
  }, [recipes, searchQuery])

  const loadRecipes = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)

      const token = await AsyncStorage.getItem("token")
      if (!token) {
        Alert.alert("Eroare", "Trebuie să fii autentificat pentru a vedea rețetele.")
        router.replace("/auth/login")
        return
      }

      const payload = JSON.parse(atob(token.split(".")[1]))
      const email = payload?.sub ?? "default"

      const recipesKey = `saved-recipes-${email}`
      const savedRecipes = await AsyncStorage.getItem(recipesKey)
      const parsedRecipes: SavedRecipe[] = savedRecipes ? JSON.parse(savedRecipes) : []

      setRecipes(parsedRecipes)
    } catch (error) {
      console.error("Error loading recipes:", error)
      Alert.alert("Eroare", "Nu s-au putut încărca rețetele.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterRecipes = () => {
    if (!searchQuery.trim()) {
      setFilteredRecipes(recipes)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(query) ||
        recipe.ingredients.some((ingredient) => ingredient.toLowerCase().includes(query)) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(query)),
    )
    setFilteredRecipes(filtered)
  }

  const deleteRecipe = async (recipeId: string) => {
    Alert.alert("Șterge rețeta", "Ești sigur că vrei să ștergi această rețetă?", [
      {
        text: "Anulează",
        style: "cancel",
      },
      {
        text: "Șterge",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token")
            if (!token) return

            const payload = JSON.parse(atob(token.split(".")[1]))
            const email = payload?.sub ?? "default"

            const updatedRecipes = recipes.filter((recipe) => recipe.id !== recipeId)
            setRecipes(updatedRecipes)

            const recipesKey = `saved-recipes-${email}`
            await AsyncStorage.setItem(recipesKey, JSON.stringify(updatedRecipes))

            Alert.alert("✅ Rețetă ștearsă", "Rețeta a fost eliminată din colecția ta.")
          } catch (error) {
            console.error("Error deleting recipe:", error)
            Alert.alert("Eroare", "Nu s-a putut șterge rețeta.")
          }
        },
      },
    ])
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const onRefresh = () => {
    loadRecipes(true)
  }

  const renderRecipe = ({ item }: { item: SavedRecipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() =>
        router.push({
          pathname: "/recipe-detail" as any,
          params: { recipe: JSON.stringify(item) },
        })
      }
      activeOpacity={0.8}
    >
      <View style={styles.recipeHeader}>
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.recipeDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteRecipe(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.recipeStats}>
        <View style={styles.statItem}>
          <Ionicons name="leaf" size={16} color="#22c55e" />
          <Text style={styles.statText}>{item.ingredients.length} ingrediente</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="list" size={16} color="#f59e0b" />
          <Text style={styles.statText}>{item.instructions.length} pași</Text>
        </View>
        {item.time && (
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color="#3b82f6" />
            <Text style={styles.statText}>{item.time}</Text>
          </View>
        )}
      </View>

      {item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>+{item.tags.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.recipePreview}>
        <Text style={styles.previewText} numberOfLines={2}>
          {item.ingredients.slice(0, 3).join(", ")}
          {item.ingredients.length > 3 && "..."}
        </Text>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <LinearGradient
        colors={["#ffd6ec", "#fff4b3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScreenWrapper>
          <View style={styles.loadingContainer}>
            <Ionicons name="restaurant-outline" size={60} color="rgba(236, 72, 153, 0.6)" />
            <ActivityIndicator size="large" color="rgba(236, 72, 153, 0.9)" style={styles.loader} />
            <Text style={styles.loadingText}>Se încarcă rețetele...</Text>
          </View>
        </ScreenWrapper>
        <CustomBottomNavbar />
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <ScreenWrapper>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>📚 Rețetele Mele</Text>
            <Text style={styles.subtitle}>
              {recipes.length} {recipes.length === 1 ? "rețetă salvată" : "rețete salvate"}
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={20} color="rgba(236, 72, 153, 0.6)" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Caută în rețete..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="rgba(236, 72, 153, 0.6)" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Recipes List */}
          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={80} color="rgba(236, 72, 153, 0.6)" />
              <Text style={styles.emptyTitle}>
                {recipes.length === 0 ? "Nicio rețetă salvată" : "Nicio rețetă găsită"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {recipes.length === 0
                  ? "Generează prima ta rețetă cu AI și salvează-o aici!"
                  : "Încearcă să cauți cu alți termeni"}
              </Text>
              {recipes.length === 0 && (
                <FancyButton
                  icon="🤖"
                  label="Generează rețetă"
                  onPress={() => router.push("/generate-recipe" as any)}
                  backgroundColor="rgba(236, 72, 153, 0.9)"
                  pressedColor="rgba(219, 39, 119, 1)"
                  style={styles.generateButton}
                />
              )}
            </View>
          ) : (
            <FlatList
              data={filteredRecipes}
              keyExtractor={(item) => item.id}
              renderItem={renderRecipe}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListFooterComponent={
                <View style={styles.footerContainer}>
                  <FancyButton
                    icon="🤖"
                    label="Generează rețetă nouă"
                    onPress={() => router.push("/recipe" as any)}
                    backgroundColor="rgba(236, 72, 153, 0.9)"
                    pressedColor="rgba(219, 39, 119, 1)"
                    style={styles.newRecipeButton}
                  />
                </View>
              }
            />
          )}
        </View>
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
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    marginVertical: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
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
  searchContainer: {
    marginBottom: 20,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.2)",
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
  listContainer: {
    paddingBottom: 20,
  },
  recipeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  recipeInfo: {
    flex: 1,
    marginRight: 12,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    lineHeight: 22,
  },
  recipeDate: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  recipeStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.2)",
  },
  tagText: {
    fontSize: 10,
    color: "rgba(236, 72, 153, 0.8)",
    fontWeight: "500",
  },
  recipePreview: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  previewText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  generateButton: {
    paddingHorizontal: 30,
  },
  footerContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  newRecipeButton: {
    paddingHorizontal: 30,
  },
})
