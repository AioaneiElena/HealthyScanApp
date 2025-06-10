"use client"

import { useLocalSearchParams, useRouter } from "expo-router"
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Alert, SectionList } from "react-native"
import { useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import useAuthGuard from "../../hooks/useAuthGuard"
import ScreenWrapper from "../../components/ScreenWrapper"
import FancyButton from "../../components/ButtonHover"

type Produs = {
  titlu?: string
  link?: string
  imagine?: string
  descriere?: string
  magazin?: string
}

type StoreSection = {
  title: string
  data: Produs[]
  storeIcon: string
  storeColor: string
}

export default function ResultsScreen() {
  useAuthGuard()
  const router = useRouter()
  const { grouped, query } = useLocalSearchParams()

  // Parse grouped results from backend
  const groupedResults: Record<string, Produs[]> = grouped ? JSON.parse(grouped as string) : {}

  useEffect(() => {
    if (Object.keys(groupedResults).length > 0 && query) {
      salvareInIstoric()
    }
  }, [])

  const getStoreIcon = (storeName: string): string => {
    const storeIcons: { [key: string]: string } = {
      emag: "🛒",
      carrefour: "🛍️",
      kaufland: "🏪",
      auchan: "🏬",
      selgros: "🥩",
      metro: "📦",
      penny: "🍞",
      profi: "🧃",
      mega: "🛒",        
      default: "🏪",
    }
    return storeIcons[storeName.toLowerCase()] || storeIcons.default
  }

  const getStoreColor = (storeName: string): string => {
    const storeColors: { [key: string]: string } = {
      carrefour: "#0066cc",
      kaufland: "#e53e3e",
      mega: "#ff6b35",       
      auchan: "#e53e3e",
      emag: "#f39c12",
      profi: "#2c5aa0",
      penny: "#ff6b35",
      metro: "#0050aa",
      selgros: "#00a86b",     
      default: "rgba(236, 72, 153, 0.9)",
    }
    return storeColors[storeName.toLowerCase()] || storeColors.default
  }

  const adaugaInCos = async (item: Produs) => {
    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) throw new Error("Token lipsă")

      const payload = JSON.parse(atob(token.split(".")[1]))
      const email = payload?.sub ?? "default"

      const key = `cart-${email}`
      const existingCart = await AsyncStorage.getItem(key)
      const cart = existingCart ? JSON.parse(existingCart) : []

      cart.push(item)
      await AsyncStorage.setItem(key, JSON.stringify(cart))
      Alert.alert("✅ Adăugat în coș", "Produsul a fost salvat.")

      const usageKey = `cart-usage-${email}`
      const existingUsage = await AsyncStorage.getItem(usageKey)
      const usage = existingUsage ? JSON.parse(existingUsage) : {}
      const magazin = item.magazin || "necunoscut"
      usage[magazin] = (usage[magazin] || 0) + 1
      await AsyncStorage.setItem(usageKey, JSON.stringify(usage))
    } catch {
      Alert.alert("Eroare", "Nu s-a putut adăuga în coș.")
    }
  }

  const salvareInIstoric = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) return

      const payload = JSON.parse(atob(token.split(".")[1]))
      const email = payload?.sub ?? "default"

      const key = `istoric-${email}`
      const existing = await AsyncStorage.getItem(key)
      const istoric = existing ? JSON.parse(existing) : []

      const allProducts = Object.values(groupedResults).flat().slice(0, 3)

      const nou = {
        query,
        timestamp: Date.now(),
        rezultate: allProducts,
        nutriscores: [], 
      }

      istoric.unshift(nou)
      await AsyncStorage.setItem(key, JSON.stringify(istoric))
    } catch (e) {
      console.error("Eroare la salvarea în istoric:", e)
    }
  }

  // Convert grouped results to sections for SectionList
  const sections: StoreSection[] = Object.entries(groupedResults).map(([storeName, products]) => ({
    title: storeName,
    data: products,
    storeIcon: getStoreIcon(storeName),
    storeColor: getStoreColor(storeName),
  }))

  const totalProducts = Object.values(groupedResults).flat().length

  if (sections.length === 0) {
    return (
      <LinearGradient
        colors={["#ffd6ec", "#fff4b3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScreenWrapper hasTopNavbar={false} hasBottomNavbar={false}>
          <View style={styles.headerContainer}>
            <FancyButton
              icon="←"
              label="Înapoi"
              onPress={() => router.back()}
              backgroundColor="rgba(236, 72, 153, 0.8)"
              pressedColor="rgba(219, 39, 119, 0.9)"
              style={styles.backButton}
            />
          </View>

          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={80} color="rgba(236, 72, 153, 0.6)" />
            <Text style={styles.emptyTitle}>Nicio ofertă găsită</Text>
            <Text style={styles.emptySubtitle}>pentru: "{query}"</Text>
            <Text style={styles.emptyDescription}>Produsul nu este disponibil în magazinele monitorizate.</Text>

            <View style={styles.emptyActions}>
              <FancyButton
                icon="🔍"
                label="Caută alt produs"
                onPress={() => router.push("/" as any)}
                backgroundColor="rgba(236, 72, 153, 0.9)"
                pressedColor="rgba(219, 39, 119, 1)"
                style={styles.searchAgainButton}
              />
            </View>
          </View>
        </ScreenWrapper>
      </LinearGradient>
    )
  }

  const renderProduct = ({ item, index }: { item: Produs; index: number }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
      </View>

      <View style={styles.productContent}>
        {item.imagine ? (
          <Image source={{ uri: item.imagine }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color="#ccc" />
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.titlu || "Produs necunoscut"}
          </Text>

          {item.descriere && (
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.descriere}
            </Text>
          )}

          <View style={styles.productActions}>
            {item.link && (
              <TouchableOpacity onPress={() => Linking.openURL(item.link!)} style={styles.viewButton}>
                <Ionicons name="open-outline" size={14} color="#fff" />
                <Text style={styles.viewButtonText}>Vezi</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.addButton} onPress={() => adaugaInCos(item)}>
              <Ionicons name="cart-outline" size={14} color="#fff" />
              <Text style={styles.addButtonText}>Adaugă</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )

  const renderSectionHeader = ({ section }: { section: StoreSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: section.storeColor }]}>
      <View style={styles.storeHeaderContent}>
        <Text style={styles.storeIcon}>{section.storeIcon}</Text>
        <Text style={styles.storeName}>{section.title}</Text>
        <View style={styles.productCount}>
          <Text style={styles.productCountText}>{section.data.length}</Text>
        </View>
      </View>
    </View>
  )

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <ScreenWrapper hasTopNavbar={false} hasBottomNavbar={false}>
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
            <Text style={styles.title}>Rezultate pentru:</Text>
            <Text style={styles.query}>"{query}"</Text>
            <View style={styles.resultsBadge}>
              <Text style={styles.resultsCount}>
                {totalProducts} produse în {sections.length} magazine
              </Text>
            </View>
          </View>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.titlu}-${index}`}
          renderItem={renderProduct}
          renderSectionHeader={renderSectionHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          stickySectionHeadersEnabled={false}
          ListFooterComponent={
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Toate rezultatele afișate</Text>
              <FancyButton
                icon="🔍"
                label="Caută alt produs"
                onPress={() => router.push("/" as any)}
                backgroundColor="rgba(236, 72, 153, 0.9)"
                pressedColor="rgba(219, 39, 119, 1)"
                style={styles.newSearchButton}
              />
            </View>
          }
        />
      </ScreenWrapper>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 8,
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
    fontSize: 18,
    color: "#666",
    marginBottom: 4,
  },
  query: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  resultsBadge: {
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  resultsCount: {
    fontSize: 14,
    color: "rgba(236, 72, 153, 0.9)",
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    borderRadius: 12,
    marginBottom: 12,
    marginTop: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  storeHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  storeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textTransform: "capitalize",
  },
  productCount: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f8f9fa",
  },
  rankBadge: {
    backgroundColor: "rgba(236, 72, 153, 0.9)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },
  productContent: {
    flexDirection: "row",
    padding: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    lineHeight: 18,
  },
  productDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    lineHeight: 16,
  },
  productActions: {
    flexDirection: "row",
    gap: 6,
    marginTop: "auto",
  },
  viewButton: {
    backgroundColor: "rgba(59, 130, 246, 0.8)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "center",
  },
  viewButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  addButton: {
    backgroundColor: "rgba(236, 72, 153, 0.9)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  footerContainer: {
    alignItems: "center",
    paddingVertical: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  newSearchButton: {
    paddingHorizontal: 30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 18,
    color: "rgba(236, 72, 153, 0.9)",
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  emptyActions: {
    width: "100%",
    alignItems: "center",
  },
  searchAgainButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
})
