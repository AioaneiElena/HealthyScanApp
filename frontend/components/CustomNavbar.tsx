import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import useUser from "../hooks/useUser";
import { Ionicons } from "@expo/vector-icons";

export default function CustomNavbar() {
  const router = useRouter();
  const user = useUser();
  const userInitial = user?.name?.charAt(0).toUpperCase() || "A";
  const [query, setQuery] = React.useState("");

  const handleSearch = () => {
    if (query.trim()) {
      router.push({ pathname: "/results", params: { query } });
      setQuery("");
    }
  };

  return (
    <View style={styles.navbar}>
      <View style={styles.contentContainer}>
        <TouchableOpacity onPress={() => router.push("/profile")}> 
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Caută un produs..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>
      <View style={styles.bottomPadding} />
    </View>
  );
}

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

const styles = StyleSheet.create({
  navbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: STATUS_BAR_HEIGHT + 80,
    backgroundColor: "rgba(200, 200, 200, 0.5)",
    paddingTop: STATUS_BAR_HEIGHT,
    zIndex: 10,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 60,
  },
  bottomPadding: {
    height: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  searchBar: {
    flex: 1,
    marginLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
});
