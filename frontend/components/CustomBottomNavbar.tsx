import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CustomBottomNavbar() {
  const router = useRouter();

  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => router.push("/")} style={styles.item}>
        <Ionicons name="home-outline" size={24} color="#1565c0" />
        <Text style={styles.text}>Acasă</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/cart")} style={styles.item}>
        <Ionicons name="cart-outline" size={24} color="#1565c0" />
        <Text style={styles.text}>Coș</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/stats")} style={styles.item}>
        <Ionicons name="bar-chart-outline" size={24} color="#1565c0" />
        <Text style={styles.text}>Statistici</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/prom")} style={styles.item}>
        <Ionicons name="pricetags-outline" size={24} color="#1565c0" />
        <Text style={styles.text}>Promoții</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 6,
  },
  item: {
    alignItems: "center",
  },
  text: {
    fontSize: 12,
    color: "#1565c0",
  },
});
