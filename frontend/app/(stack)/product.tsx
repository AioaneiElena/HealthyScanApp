import { useEffect, useState } from "react"
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Linking,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import MapView, { Marker } from "react-native-maps"
import * as Location from "expo-location"
import { Ionicons } from "@expo/vector-icons"
import useAuthGuard from "../../hooks/useAuthGuard"
import FancyButton from "../../components/ButtonHover"
import type { LocationObjectCoords } from "expo-location"

const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24

export default function ProductScreen() {
  useAuthGuard()
  const router = useRouter()
  const { product } = useLocalSearchParams()
  const produs = product ? JSON.parse(product as string) : null

  const [location, setLocation] = useState<LocationObjectCoords | null>(null)
  const [magazinCoord, setMagazinCoord] = useState<any>(null)
  const [distanta, setDistanta] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const getNutriScoreColor = (score: string) => {
    switch (score) {
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

  const getStoreIcon = (magazin: string): string => {
    const storeName = magazin?.toLowerCase() || ""
    const storeIcons: { [key: string]: string } = {
      emag: "🛒",
      altex: "💻",
      flanco: "📱",
      carrefour: "🛍️",
      kaufland: "🏪",
      lidl: "🛒",
      auchan: "🏬",
      default: "🏪",
    }

    for (const [key, icon] of Object.entries(storeIcons)) {
      if (storeName.includes(key)) return icon
    }
    return storeIcons.default
  }

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (x: number) => (x * Math.PI) / 180
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const fetchClosestStore = async (numeMagazin: string, lat: number, lon: number) => {
    const query = `
      [out:json];
      (
        node["name"~"${numeMagazin}", i](around:25000, ${lat}, ${lon});
        way["name"~"${numeMagazin}", i](around:25000, ${lat}, ${lon});
        relation["name"~"${numeMagazin}", i](around:25000, ${lat}, ${lon});
      );
      out center;
    `

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    })

    const json = await res.json()
    if (!json.elements || json.elements.length === 0) return null

    const sorted = json.elements
      .map((el: any) => {
        const lat2 = el.lat ?? el.center?.lat
        const lon2 = el.lon ?? el.center?.lon
        const d = haversineDistance(lat, lon, lat2, lon2)
        return { ...el, dist: d, lat: lat2, lon: lon2 }
      })
      .sort((a: any, b: any) => a.dist - b.dist)

    return sorted[0]
  }

  useEffect(() => {
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          alert("Permisiunea la locație este necesară pentru a găsi magazinul.")
          return
        }

        const userLoc = await Location.getCurrentPositionAsync({})
        setLocation(userLoc.coords)

        const denumireMagazin = (produs.magazin ?? "").split(" ")[0].toLowerCase()
        console.log("🔍 Magazin căutat:", denumireMagazin)
        console.log("📍 Locație utilizator:", userLoc.coords)

        const closest = await fetchClosestStore(denumireMagazin, userLoc.coords.latitude, userLoc.coords.longitude)

        if (closest) {
          setMagazinCoord({
            lat: closest.lat,
            lon: closest.lon,
            display_name: closest.tags?.name || produs.magazin,
          })
          setDistanta(closest.dist)
        } else {
          console.warn("❗️ Nicio locație Overpass găsită")
        }
      } catch (err) {
        console.error("Eroare locație:", err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (!produs) {
    return (
      <LinearGradient
        colors={["#ffd6ec", "#fff4b3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="rgba(236, 72, 153, 0.6)" />
          <Text style={styles.errorTitle}>Produsul nu a fost găsit</Text>
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

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: STATUS_BAR_HEIGHT + 20 }]}>
        {/* Back Button */}
        <FancyButton
          icon="←"
          label="Înapoi"
          onPress={() => router.back()}
          backgroundColor="rgba(236, 72, 153, 0.8)"
          pressedColor="rgba(219, 39, 119, 0.9)"
          style={styles.backButton}
        />

        {/* Product Image */}
        {produs.imagine ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: produs.imagine }} style={styles.image} />
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={60} color="#ccc" />
            <Text style={styles.imagePlaceholderText}>Fără imagine</Text>
          </View>
        )}

        {/* Product Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.productName}>{produs.titlu ?? "Produs necunoscut"}</Text>
            {produs.nutriscore && (
              <View style={[styles.nutriBadge, { backgroundColor: getNutriScoreColor(produs.nutriscore) }]}>
                <Text style={styles.nutriText}>{produs.nutriscore}</Text>
              </View>
            )}
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>{produs.pret ? `${produs.pret} lei` : "Preț la cerere"}</Text>
          </View>

          <View style={styles.storeContainer}>
            <Text style={styles.storeIcon}>{getStoreIcon(produs.magazin ?? "")}</Text>
            <Text style={styles.storeName}>{produs.magazin ?? "Magazin necunoscut"}</Text>
          </View>

          {produs.descriere && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Descriere:</Text>
              <Text style={styles.description}>{produs.descriere}</Text>
            </View>
          )}

          {produs.link && (
            <FancyButton
              icon="🔗"
              label="Vezi pe site-ul magazinului"
              onPress={() => Linking.openURL(produs.link)}
              backgroundColor="rgba(59, 130, 246, 0.8)"
              pressedColor="rgba(37, 99, 235, 0.9)"
              style={styles.linkButton}
              fullWidth={true}
            />
          )}
        </View>

        {/* NutriScore Info Card */}
        {produs.nutriscore && (
          <View style={styles.card}>
            <View style={styles.nutriScoreHeader}>
              <Ionicons name="nutrition-outline" size={24} color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.nutriScoreTitle}>Informații nutriționale</Text>
            </View>

            <View style={styles.nutriScoreContainer}>
              <View style={[styles.nutriScoreBadge, { backgroundColor: getNutriScoreColor(produs.nutriscore) }]}>
                <Text style={styles.nutriScoreText}>{produs.nutriscore}</Text>
              </View>
              <View style={styles.nutriScoreInfo}>
                <Text style={styles.nutriScoreLabel}>NutriScore</Text>
                <Text style={styles.nutriScoreDescription}>
                  {produs.nutriscore === "A" && "Foarte bună calitate nutrițională"}
                  {produs.nutriscore === "B" && "Bună calitate nutrițională"}
                  {produs.nutriscore === "C" && "Calitate nutrițională medie"}
                  {produs.nutriscore === "D" && "Calitate nutrițională slabă"}
                  {produs.nutriscore === "E" && "Calitate nutrițională foarte slabă"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.locationHeader}>
            <Ionicons name="location-outline" size={24} color="rgba(236, 72, 153, 0.9)" />
            <Text style={styles.locationTitle}>Cel mai apropiat magazin</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="rgba(236, 72, 153, 0.9)" />
              <Text style={styles.loadingText}>Se caută magazinul cel mai apropiat...</Text>
            </View>
          ) : magazinCoord ? (
            <>
              <View style={styles.storeInfoContainer}>
                <Text style={styles.storeInfoName}>{magazinCoord.display_name}</Text>
                {distanta && (
                  <View style={styles.distanceContainer}>
                    <Ionicons name="walk-outline" size={16} color="#666" />
                    <Text style={styles.distance}>{distanta.toFixed(2)} km distanță</Text>
                  </View>
                )}
              </View>

              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: magazinCoord.lat,
                  longitude: magazinCoord.lon,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{ latitude: magazinCoord.lat, longitude: magazinCoord.lon }}
                  title={produs.magazin}
                  description="Cel mai apropiat magazin"
                />
              </MapView>

              <FancyButton
                icon="🗺️"
                label="Deschide în Google Maps"
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${magazinCoord.lat},${magazinCoord.lon}`,
                  )
                }
                backgroundColor="#4285f4"
                pressedColor="#3367d6"
                style={styles.mapsButton}
                fullWidth={true}
              />
            </>
          ) : (
            <View style={styles.noLocationContainer}>
              <Ionicons name="location-outline" size={40} color="#ccc" />
              <Text style={styles.noLocationText}>Nu s-a găsit magazin apropiat în zona ta</Text>
            </View>
          )}
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
    paddingBottom: 40,
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
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: "100%",
    height: 250,
    backgroundColor: "#f0f0f0",
  },
  imagePlaceholder: {
    width: "100%",
    height: 250,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 20,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: "#999",
    marginTop: 8,
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  productName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 12,
    lineHeight: 28,
  },
  nutriBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  nutriText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  priceContainer: {
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "rgba(236, 72, 153, 0.9)",
  },
  storeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  storeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  storeName: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  linkButton: {
    marginTop: 8,
  },
  nutriScoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  nutriScoreTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  nutriScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  nutriScoreBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  nutriScoreText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 24,
  },
  nutriScoreInfo: {
    flex: 1,
  },
  nutriScoreLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  nutriScoreDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  storeInfoContainer: {
    marginBottom: 16,
  },
  storeInfoName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  distance: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  map: {
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  mapsButton: {
    marginTop: 8,
  },
  noLocationContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noLocationText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 12,
  },
})
