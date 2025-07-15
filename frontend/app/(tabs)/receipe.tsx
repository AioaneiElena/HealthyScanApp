"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import useAuthGuard from "../../hooks/useAuthGuard"
import CustomNavbar from "../../components/CustomNavbar"
import CustomBottomNavbar from "../../components/CustomBottomNavbar"
import ScreenWrapper from "../../components/ScreenWrapper"
import FancyButton from "../../components/ButtonHover"
import { BASE_URL } from "../../constants/api";
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

const parseRecipe = (recipeText: string) => {
  const sections = {
    name: "",
    time: "",
    servings: "",
    ingredients: [] as string[],
    instructions: [] as string[],
    nutritionalTips: "",
    difficulty: "",
  }

  // Clean and split the text
  const lines = recipeText.split("\n").filter((line) => line.trim())
  let currentSection = ""

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lowerLine = line.toLowerCase()

    // Skip empty lines
    if (!line) continue

    // Extract recipe name - look for "Nume rețetă:" pattern
    if (lowerLine.includes("nume") && lowerLine.includes("rețetă")) {
      const nameMatch = line.split(":").slice(1).join(":")
      if (nameMatch) {
        sections.name = nameMatch.trim()
      }
      continue
    }


    // Extract time - look for "Timp:" pattern
    if (lowerLine.startsWith("timp:")) {
      const timeMatch = line.split(":")[1]
      if (timeMatch) {
        sections.time = timeMatch.trim()
      }
      continue
    }

    // Extract servings - look for "Porții:" pattern
    if (lowerLine.startsWith("portii:") || lowerLine.startsWith("porții:")) {
      const servingsMatch = line.split(":")[1]
      if (servingsMatch) {
        sections.servings = servingsMatch.trim()
      }
      continue
    }

    // Identify section headers
    if (lowerLine.includes("ingrediente:")) {
      currentSection = "ingredients"
      continue
    } else if (lowerLine.includes("instructiuni:") || lowerLine.includes("instrucțiuni:")) {
      currentSection = "instructions"
      continue
    } else if (lowerLine.includes("sfaturi") || lowerLine.includes("nutritional") || lowerLine.includes("beneficii")) {
      currentSection = "nutritional"
      continue
    }

    // Add content to appropriate sections
    if (currentSection === "ingredients") {
      // Look for ingredient patterns (- or numbered lists)
      if (line.startsWith("-") || line.match(/^\d+\./)) {
        const cleanLine = line
          .replace(/^\d+\.\s*/, "")
          .replace(/^-\s*/, "")
          .trim()
        if (cleanLine && !cleanLine.toLowerCase().includes("instructiuni")) {
          sections.ingredients.push(cleanLine)
        }
      }
    } else if (currentSection === "instructions") {
      // Look for instruction patterns (numbered lists)
      if (line.match(/^\d+\./) || line.startsWith("-")) {
        const cleanLine = line
          .replace(/^\d+\.\s*/, "")
          .replace(/^-\s*/, "")
          .trim()
        if (cleanLine && !cleanLine.toLowerCase().includes("sfaturi")) {
          sections.instructions.push(cleanLine)
        }
      }
    } else if (currentSection === "nutritional") {
      // Capture any content in nutritional section, not just lines with specific markers
      const cleanLine = line
        .replace(/^\*\s*/, "")
        .replace(/^-\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .trim()

      if (cleanLine) {
        if (sections.nutritionalTips) {
          sections.nutritionalTips += "\n• " + cleanLine
        } else {
          sections.nutritionalTips = "• " + cleanLine
        }
      }
    }
  }

  return sections
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

export default function GenerateRecipeScreen() {
  useAuthGuard()
  const router = useRouter()
  const [ingredients, setIngredients] = useState("")
  const [dieta, setDieta] = useState("")
  const [scop, setScop] = useState("")
  const [timp, setTimp] = useState("")
  const [context, setContext] = useState("")
  const [loading, setLoading] = useState(false)
  const [reteta, setReteta] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const trimiteCatreBackend = async () => {
    const cos = ingredients
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)
    if (cos.length === 0) {
      Alert.alert("Eroare", "Introdu cel puțin un ingredient.")
      return
    }

    setLoading(true)
    setReteta("")

    try {
      const response = await fetch(`${BASE_URL}/reteta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cos, dieta, scop, timp, context }),
      })

      const data = await response.json()
      if (response.ok) {
        setReteta(data.reteta)
      } else {
        Alert.alert("Eroare", data.detail || "Nu s-a putut genera rețeta.")
      }
    } catch (error) {
      Alert.alert("Eroare", "Nu s-a putut contacta serverul.")
    }

    setLoading(false)
  }

  const saveRecipe = async () => {
    if (!reteta) {
      Alert.alert("Eroare", "Nu există rețetă de salvat.")
      return
    }

    setSaving(true)
    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) {
        Alert.alert("Eroare", "Trebuie să fii autentificat pentru a salva rețete.")
        return
      }

      const payload = JSON.parse(atob(token.split(".")[1]))
      const email = payload?.sub ?? "default"

      // Parse the recipe
      const parsedRecipe = parseRecipe(reteta)

      // Create recipe object
      const recipe: SavedRecipe = {
        id: Date.now().toString(),
        name: parsedRecipe.name || "Rețetă fără nume",
        ingredients: parsedRecipe.ingredients,
        instructions: parsedRecipe.instructions,
        time: parsedRecipe.time,
        servings: parsedRecipe.servings,
        nutritionalTips: parsedRecipe.nutritionalTips,
        originalText: reteta,
        createdAt: Date.now(),
        tags: [dieta && dieta.trim(), scop && scop.trim(), context && context.trim()].filter(Boolean),
      }

      // Get existing recipes
      const recipesKey = `saved-recipes-${email}`
      const existingRecipes = await AsyncStorage.getItem(recipesKey)
      const recipes: SavedRecipe[] = existingRecipes ? JSON.parse(existingRecipes) : []

      // Add new recipe at the beginning
      recipes.unshift(recipe)

      // Keep only last 50 recipes to avoid storage issues
      const limitedRecipes = recipes.slice(0, 50)

      // Save back to storage
      await AsyncStorage.setItem(recipesKey, JSON.stringify(limitedRecipes))

      Alert.alert("✅ Rețetă salvată!", `"${recipe.name}" a fost salvată în colecția ta de rețete.`, [
        {
          text: "Vezi rețetele salvate",
          onPress: () => router.push("/saved-recipes" as any),
        },
        {
          text: "OK",
          style: "default",
        },
      ])
    } catch (error) {
      console.error("Error saving recipe:", error)
      Alert.alert("Eroare", "Nu s-a putut salva rețeta. Încearcă din nou.")
    } finally {
      setSaving(false)
    }
  }

  const quickIngredients = [
    "🥛 lapte, banane, ovăz",
    "🍅 roșii, mozzarella, busuioc",
    "🥑 avocado, ou, pâine integrală",
    "🐟 somon, broccoli, orez",
    "🥕 morcovi, linte, ceapă",
  ]

  const quickDiets = ["Vegană", "Vegetariană", "Keto", "Fără gluten", "Mediteraneană"]

  const quickGoals = ["Slăbire", "Masă musculară", "Energie", "Detox", "Sport"]

  const quickTimes = ["15 min", "30 min", "45 min", "1 oră"]

  const quickContexts = ["Mic dejun", "Prânz", "Cină", "Gustare", "Post-antrenament"]

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="restaurant-outline" size={40} color="rgba(236, 72, 153, 0.8)" />
            </View>
            <Text style={styles.title}>🍽️ Generator de Rețete AI</Text>
            <Text style={styles.subtitle}>
              Spune-mi ce ingrediente ai și îți voi crea o rețetă delicioasă și sănătoasă!
            </Text>
          </View>

          {/* Main Form */}
          <View style={styles.formContainer}>
            {/* Ingredients Input */}
            <View style={styles.inputSection}>
              <View style={styles.labelContainer}>
                <Ionicons name="leaf-outline" size={20} color="rgba(236, 72, 153, 0.8)" />
                <Text style={styles.label}>Ingrediente disponibile</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="ex: lapte, banane, fulgi de ovăz, miere..."
                  value={ingredients}
                  onChangeText={setIngredients}
                  multiline
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.quickOptions}>
                <Text style={styles.quickLabel}>Sugestii rapide:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
                  {quickIngredients.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickTag}
                      onPress={() => setIngredients(item.substring(2))}
                    >
                      <Text style={styles.quickTagText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Diet Input */}
            <View style={styles.inputSection}>
              <View style={styles.labelContainer}>
                <Ionicons name="nutrition-outline" size={20} color="rgba(34, 197, 94, 0.8)" />
                <Text style={styles.label}>Tip de dietă</Text>
                <Text style={styles.optional}>(opțional)</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="ex: vegană, fără gluten, keto..."
                  value={dieta}
                  onChangeText={setDieta}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.quickOptions}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
                  {quickDiets.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.quickTag} onPress={() => setDieta(item)}>
                      <Text style={styles.quickTagText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Goal Input */}
            <View style={styles.inputSection}>
              <View style={styles.labelContainer}>
                <Ionicons name="trophy-outline" size={20} color="rgba(245, 158, 11, 0.8)" />
                <Text style={styles.label}>Obiectiv</Text>
                <Text style={styles.optional}>(opțional)</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="ex: să slăbească, masă musculară, energie..."
                  value={scop}
                  onChangeText={setScop}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.quickOptions}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
                  {quickGoals.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.quickTag} onPress={() => setScop(item)}>
                      <Text style={styles.quickTagText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Time Input */}
            <View style={styles.inputSection}>
              <View style={styles.labelContainer}>
                <Ionicons name="time-outline" size={20} color="rgba(59, 130, 246, 0.8)" />
                <Text style={styles.label}>Timp maxim</Text>
                <Text style={styles.optional}>(opțional)</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="ex: 15 minute, 30 minute..."
                  value={timp}
                  onChangeText={setTimp}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.quickOptions}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
                  {quickTimes.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.quickTag} onPress={() => setTimp(item)}>
                      <Text style={styles.quickTagText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Context Input */}
            <View style={styles.inputSection}>
              <View style={styles.labelContainer}>
                <Ionicons name="home-outline" size={20} color="rgba(168, 85, 247, 0.8)" />
                <Text style={styles.label}>Context</Text>
                <Text style={styles.optional}>(opțional)</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="ex: gustare la birou, cină ușoară..."
                  value={context}
                  onChangeText={setContext}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.quickOptions}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
                  {quickContexts.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.quickTag} onPress={() => setContext(item)}>
                      <Text style={styles.quickTagText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Generate Button */}
            <FancyButton
              icon="🤖"
              label={loading ? "Generez rețeta..." : "Generează rețetă cu AI"}
              onPress={trimiteCatreBackend}
              backgroundColor="rgba(236, 72, 153, 0.9)"
              pressedColor="rgba(219, 39, 119, 1)"
              style={styles.generateButton}
              fullWidth={true}
              textStyle={styles.generateButtonText}
            />

            {/* Loading State */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="rgba(236, 72, 153, 0.9)" />
                <Text style={styles.loadingText}>AI-ul creează rețeta perfectă pentru tine...</Text>
                <View style={styles.loadingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            )}

            {/* Recipe Result */}
            {reteta !== "" && isMounted && (
              <View style={styles.resultContainer}>
                <View style={styles.resultHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                  <Text style={styles.resultTitle}>Rețeta ta personalizată</Text>
                  <Ionicons name="sparkles" size={20} color="#f59e0b" />
                </View>

                {(() => {
                  const parsedRecipe = parseRecipe(reteta)

                  return (
                    <View style={styles.recipeContainer}>
                      {/* Recipe Name */}
                      {parsedRecipe.name && (
                        <View style={styles.recipeNameCard}>
                          <View style={styles.cardHeader}>
                            <Ionicons name="restaurant" size={24} color="rgba(236, 72, 153, 0.9)" />
                            <Text style={styles.cardTitle}>Numele rețetei</Text>
                          </View>
                          <Text style={styles.recipeName}>{parsedRecipe.name}</Text>
                        </View>
                      )}

                      {/* Recipe Info */}
                      <View style={styles.recipeInfoCard}>
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

                      {/* Ingredients */}
                      {parsedRecipe.ingredients.length > 0 && (
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
                      )}

                      {/* Instructions */}
                      {parsedRecipe.instructions.length > 0 && (
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
                      )}

                      {/* Nutritional Tips */}
                      {parsedRecipe.nutritionalTips && (
                        <View style={styles.nutritionalCard}>
                          <View style={styles.cardHeader}>
                            <Ionicons name="fitness" size={24} color="#ef4444" />
                            <Text style={styles.cardTitle}>Sfaturi nutriționale</Text>
                          </View>
                          <Text style={styles.nutritionalText}>
                            {formatTextWithBold(parsedRecipe.nutritionalTips.trim())}
                          </Text>
                        </View>
                      )}

                      {/* Fallback for unparsed content */}
                      {parsedRecipe.ingredients.length === 0 && parsedRecipe.instructions.length === 0 && (
                        <View style={styles.fallbackCard}>
                          <View style={styles.cardHeader}>
                            <Ionicons name="document-text" size={24} color="#6b7280" />
                            <Text style={styles.cardTitle}>Rețeta completă</Text>
                          </View>
                          <Text style={styles.recipeText}>{reteta}</Text>
                        </View>
                      )}
                    </View>
                  )
                })()}

                <View style={styles.resultActions}>
                  <FancyButton
                    icon={saving ? "⏳" : "💾"}
                    label={saving ? "Se salvează..." : "Salvează"}
                    onPress={saveRecipe}
                    backgroundColor="rgba(234, 131, 203, 0.35)"
                    pressedColor="rgba(231, 65, 170, 0.41)"
                    style={styles.actionButton}
                  />

                  <FancyButton
                    icon="🔄"
                    label="Regenerează"
                    onPress={() => {
                      setReteta("")
                      setIngredients("")
                      setDieta("")
                      setScop("")
                      setTimp("")
                      setContext("")
                    }}
                    backgroundColor="rgba(246, 59, 159, 0.33)"
                    pressedColor="rgba(235, 37, 205, 0.28)"
                    style={styles.actionButton}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
              <Text style={styles.tipsTitle}>Sfaturi pentru rețete mai bune</Text>
            </View>

            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.tipText}>Specifică ingredientele exact (ex: "roșii cherry" în loc de "roșii")</Text>
            </View>

            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.tipText}>Menționează restricțiile alimentare pentru siguranță</Text>
            </View>

            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.tipText}>Adaugă contextul pentru rețete mai potrivite</Text>
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    paddingHorizontal: 10,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  required: {
    color: "#ef4444",
    marginLeft: 4,
    fontSize: 16,
  },
  optional: {
    color: "#999",
    marginLeft: 4,
    fontSize: 14,
    fontStyle: "italic",
  },
  inputWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.1)",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    minHeight: 50,
  },
  quickOptions: {
    marginTop: 8,
  },
  quickLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
  },
  quickScroll: {
    flexDirection: "row",
  },
  quickTag: {
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.2)",
  },
  quickTagText: {
    fontSize: 12,
    color: "rgba(236, 72, 153, 0.8)",
    fontWeight: "500",
  },
  generateButton: {
    marginTop: 10,
    paddingVertical: 16,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingDots: {
    flexDirection: "row",
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(236, 72, 153, 0.6)",
    marginHorizontal: 4,
  },
  dot1: {
    animationDelay: "0s",
  },
  dot2: {
    animationDelay: "0.2s",
  },
  dot3: {
    animationDelay: "0.4s",
  },
  resultContainer: {
    marginTop: 20,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 8,
  },
  resultActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
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
    justifyContent: "center",
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  recipeContainer: {
    gap: 16,
  },
  recipeNameCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "rgba(236, 72, 153, 0.8)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  recipeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "rgba(236, 72, 153, 0.9)",
    textAlign: "center",
  },
  recipeInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
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
  ingredientsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
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
  fallbackCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#6b7280",
  },
  boldText: {
    fontWeight: "bold",
    color: "rgba(236, 72, 153, 0.9)",
  },
  normalText: {
    fontWeight: "normal",
    color: "#333",
  },
  recipeText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
})
