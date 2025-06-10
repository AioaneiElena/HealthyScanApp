import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import useAuthGuard from "../../hooks/useAuthGuard"

const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24

export default function ProfileScreen() {
  useAuthGuard()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const router = useRouter()

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) return router.replace("/auth/login")

      const res = await fetch(`http://192.168.0.102:8000/me?token=${token}`)
      const data = await res.json()

      if (res.status === 401) {
        await AsyncStorage.removeItem("token")
        Alert.alert("Sesiunea a expirat", "Te rugăm să te autentifici din nou.")
        router.replace("/auth/login")
        return
      }

      setUser(data)
      setFirstName(data.first_name)
      setLastName(data.last_name)
      setAvatarUrl(data.avatar_url ?? "")
    } catch (err) {
      Alert.alert("Eroare", (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token")
    router.replace("/start")
  }

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert("Permisiune necesară", "Permite accesul la poze.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({ base64: false })
    if (!result.canceled) {
      const uri = result.assets[0].uri
      await uploadAvatar(uri)
    }
  }

  const uploadAvatar = async (uri: string) => {
    const token = await AsyncStorage.getItem("token")
    const formData = new FormData()
    formData.append("file", {
      uri,
      name: "avatar.jpg",
      type: "image/jpeg",
    } as any)

    try {
      const res = await fetch(`http://192.168.0.102:8000/upload-avatar?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Eroare la încărcare poză")

      setAvatarUrl(data.avatar_url)
      setUser((prev: any) => ({ ...prev, avatar_url: data.avatar_url }))
      Alert.alert("Poză încărcată cu succes")
    } catch (err) {
      Alert.alert("Eroare", (err as Error).message)
    }
  }

  const handleSave = async () => {
    const token = await AsyncStorage.getItem("token")
    try {
      const res = await fetch("http://192.168.0.102:8000/update-profile?token=" + token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          avatar_url: avatarUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Eroare la actualizare")
      Alert.alert("Profil actualizat cu succes")
      setEditing(false)
      fetchUser()
    } catch (err) {
      Alert.alert("Eroare", (err as Error).message)
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1565c0" />
          <Text style={styles.loadingText}>Se încarcă profilul...</Text>
        </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Înapoi</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profilul Meu</Text>
        <Text style={styles.subtitle}>Gestionează informațiile tale personale</Text>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={editing ? pickAvatar : undefined}
          activeOpacity={editing ? 0.8 : 1}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>{user?.first_name?.[0]?.toUpperCase() || "👤"}</Text>
            </View>
          )}
          {editing && (
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          )}
        </TouchableOpacity>

        {!editing && (
          <>
            <Text style={styles.userName}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </>
        )}

        {editing ? (
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prenume</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Introdu prenumele"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nume</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Introdu numele"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>💾 Salvează modificările</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoButton} onPress={pickAvatar}>
              <Text style={styles.photoButtonText}>📷 Schimbă poza</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
              <Text style={styles.cancelButtonText}>Anulează</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
              <Text style={styles.editButtonText}>✏️ Editează profilul</Text>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Informații personale</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nume complet:</Text>
                <Text style={styles.infoValue}>
                  {user?.first_name} {user?.last_name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Deconectare</Text>
        </TouchableOpacity>
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
    padding: 20,
    paddingTop: 20,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#333",
    marginTop: 16,
    fontSize: 16,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(236, 72, 153, 0.8)", 
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
  },
  avatarImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#ffffff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    borderWidth: 4,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarPlaceholderText: {
    fontSize: 48,
    color: "#999",
    fontWeight: "bold",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(236, 72, 153, 0.9)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  cameraIcon: {
    fontSize: 16,
    color: "#fff",
  },
  userName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  editForm: {
    width: "100%",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
    width: "100%",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButton: {
    backgroundColor: "rgba(236, 72, 153, 0.9)",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  photoButton: {
    backgroundColor: "rgba(219, 39, 119, 0.8)", 
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photoButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#999",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  profileInfo: {
    width: "100%",
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: "rgba(236, 72, 153, 0.9)",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#e0f7fa",
    borderRadius: 10,
    padding: 20,
    width: "100%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#b2ebf2",
  },
  infoLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  logoutButton: {
    backgroundColor: "#ffb6c1",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})
