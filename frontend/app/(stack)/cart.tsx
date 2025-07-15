"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import CustomBottomNavbar from "../../components/CustomBottomNavbar"
import FancyButton from "../../components/ButtonHover"
import useAuthGuard from "../../hooks/useAuthGuard"


type CartItem = {
  imagine?: string
  titlu?: string
  pret?: string
}

const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24

export default function CartScreen() {
  useAuthGuard()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadCart = async () => {
      try {
        const token = await AsyncStorage.getItem("token")
        if (!token) throw new Error("Token lipsă")

        const payload = JSON.parse(atob(token.split(".")[1]))
        const email = payload.sub
        const key = `cart-${email}`

        const stored = await AsyncStorage.getItem(key)
        setCart(stored ? JSON.parse(stored) : [])
      } catch (err) {
        Alert.alert("Eroare", "Nu s-a putut încărca coșul.")
      } finally {
        setLoading(false)
      }
    }

    loadCart()
  }, [])

  const removeItem = async (indexToRemove: number) => {
    const updatedCart = cart.filter((_, index) => index !== indexToRemove)
    setCart(updatedCart)

    const token = await AsyncStorage.getItem("token")
    const payload = JSON.parse(atob(token!.split(".")[1]))
    const key = `cart-${payload.sub}`
    await AsyncStorage.setItem(key, JSON.stringify(updatedCart))
  }

  const clearCart = async () => {
    Alert.alert("Golire listă", "Ești sigur că vrei să golești lista?", [
      { text: "Anulează", style: "cancel" },
      {
        text: "Golește",
        style: "destructive",
        onPress: async () => {
          const token = await AsyncStorage.getItem("token")
          const payload = JSON.parse(atob(token!.split(".")[1]))
          const key = `cart-${payload.sub}`
          await AsyncStorage.removeItem(key)
          setCart([])
        },
      },
    ])
  }

  const calculateTotal = () => {
    return cart
      .reduce((total, item) => {
        if (typeof item.pret !== "string") return total
        const price = item.pret.replace(/[^\d,]/g, "").replace(",", ".") || "0"
        return total + parseFloat(price)
      }, 0)
      .toFixed(2)
  }

  return (
    <LinearGradient
      colors={["#ffd6ec", "#fff4b3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: 30, paddingBottom: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Înapoi</Text>
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.title}>Produse Favorite</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{cart.length}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="rgba(236, 72, 153, 0.9)" />
            <Text style={styles.loadingText}>Se încarcă lista...</Text>
          </View>
        ) : cart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color="rgba(236, 72, 153, 0.6)" />
            <Text style={styles.emptyText}>Lista ta este golă</Text>
            <Text style={styles.emptySubtext}>Adaugă produse </Text>
            <FancyButton
              icon="🛍️"
              label="Începe cumpărăturile"
              onPress={() => router.push("/")}
              backgroundColor="rgba(236, 72, 153, 0.9)"
              pressedColor="rgba(219, 39, 119, 1)"
              style={styles.shopButton}
            />
          </View>
        ) : (
          <>
            {cart.map((item, index) => (
              <View style={styles.card} key={index}>
                <View style={styles.cardContent}>
                  {item.imagine ? (
                    <Image source={{ uri: item.imagine }} style={styles.image} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={40} color="#ccc" />
                    </View>
                  )}
                  <View style={styles.infoContainer}>
                    <Text style={styles.productTitle}>{item.titlu ?? "—"}</Text>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.detailsButton}
                        onPress={() =>
                          router.push({
                            pathname: "../product",
                            params: { product: JSON.stringify(item) },
                          })
                        }
                      >
                        <Text style={styles.detailsButtonText}>Detalii</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(index)}>
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                        <Text style={styles.removeButtonText}>Elimină</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.footer}>
              

              <View style={styles.footerButtons}>
                <FancyButton
                  icon="🗑️"
                  label="Golește lista"
                  onPress={clearCart}
                  backgroundColor="rgba(236, 72, 153, 0.8)"
                  pressedColor="#d32f2f"
                  style={styles.clearButton}
                />
                
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  countBadge: {
    backgroundColor: "rgba(236, 72, 153, 0.9)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  countText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  shopButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 16,
  },
  cardContent: {
    flexDirection: "row",
  },
  image: {
    width: 100,
    height: 100,
    backgroundColor: "#f0f0f0",
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
    padding: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(236, 72, 153, 0.9)",
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailsButton: {
    backgroundColor: "rgba(230, 139, 195, 0.8)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: "rgba(236, 72, 153, 0.9)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 4,
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(236, 72, 153, 0.2)",
    paddingHorizontal: 16,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "rgba(236, 72, 153, 0.9)",
  },
  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  clearButton: {
    flex: 1,
    color: "rgba(70, 54, 62, 0.9)"
  },
  checkoutButton: {
    flex: 2,
  },
})
