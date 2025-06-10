"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  TextInput,
  Image,
  Alert,
} from "react-native"
import { useRouter } from "expo-router"
import useUser from "../hooks/useUser"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24

export default function CustomNavbar() {
  const router = useRouter()
  const user = useUser()
  const userInitial = user?.first_name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || "U"
  const [query, setQuery] = useState("")

  const handleSearch = async () => {
    if (!query.trim()) {
      Alert.alert("Eroare", "Introdu numele produsului pentru căutare.")
      return
    }

    try {
      const response = await fetch("http://192.168.0.102:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Căutare eșuată: ${errText}`)
      }

      const result = await response.json()

      router.push({
        pathname: "/results",
        params: {
          query: result.query,
          grouped: JSON.stringify(result.grupate || {}),
        },
      })

      setQuery("")
    } catch (error) {
      Alert.alert("Eroare", (error as Error).message)
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(255, 214, 236, 0.9)", "rgba(255, 244, 179, 0.9)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.navbar}
      >
        <View style={styles.contentContainer}>
          <TouchableOpacity onPress={() => router.push("/profile" as any)} style={styles.avatarButton}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="rgba(236, 72, 153, 0.6)" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Caută un produs..."
                placeholderTextColor="rgba(236, 72, 153, 0.5)"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="rgba(236, 72, 153, 0.6)" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navbar: {
    height: STATUS_BAR_HEIGHT + 70,
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(236, 72, 153, 0.2)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    flex: 1,
  },
  avatarButton: {
    padding: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(236, 72, 153, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  searchContainer: {
    flex: 1,
    marginLeft: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 44,
    elevation: 4,
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
    height: 44,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 4,
  },
})
