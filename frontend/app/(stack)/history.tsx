import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import useAuthGuard from "../../hooks/useAuthGuard";
import ScreenWrapper from "../../components/ScreenWrapper";
import CustomBottomNavbar from "../../components/CustomBottomNavbar";

export default function HistoryScreen() {
  useAuthGuard();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const token = await AsyncStorage.getItem("token");
      const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
      const email = payload?.sub ?? "default";
      const key = `istoric-${email}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed.reverse());
      }
    };
    loadHistory();
  }, []);

  const clearHistory = async () => {
    Alert.alert("Șterge tot?", "Ești sigur că vrei să ștergi istoricul?", [
      { text: "Anulează", style: "cancel" },
      {
        text: "Șterge",
        style: "destructive",
        onPress: async () => {
          const token = await AsyncStorage.getItem("token");
          const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
          const email = payload?.sub ?? "default";
          const key = `istoric-${email}`;
          await AsyncStorage.removeItem(key);
          setHistory([]);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() =>
        router.push({
          pathname: "/results",
          params: {
            query: item.query,
            results: JSON.stringify(item.rezultate),
          },
        })
      }
    >
      {item.rezultate?.[0]?.imagine && (
        <Image source={{ uri: item.rezultate[0].imagine }} style={styles.image} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.query}>{item.query}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#ffd6ec", "#fff4b3"]} style={styles.gradient}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={history}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>← Înapoi</Text>
              </TouchableOpacity>
              <View style={styles.header}>
                <Text style={styles.title}>🕘 Istoric Căutări</Text>
                {history.length > 0 && (
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={styles.clear}>Șterge tot</Text>
                  </TouchableOpacity>
                )}
              </View>
              {history.length === 0 && (
                <Text style={styles.empty}>Nu ai încă nicio căutare salvată.</Text>
              )}
            </>
          }
        />
      </View>
      <CustomBottomNavbar />
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { paddingBottom: 100 },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(236, 72, 153, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 16,
    marginTop: 20,
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  clear: {
    fontSize: 16,
    color: "#e53935",
  },
  empty: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginTop: 40,
  },
  list: {
    paddingHorizontal: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  query: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
});
