import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import ButtonHover from "../../components/ButtonHover";
import useUser from "../../hooks/useUser";

type User = {
  name: string;
  email: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const user = useUser(); 
  const userInitial = user?.name?.charAt(0).toUpperCase() || "A";

  return (
    <LinearGradient
      colors={["#ffd6ec", "#fff4b3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.container}>
        {/* TITLU */}
        <Text style={styles.title}>🛒 Compară Prețuri</Text>
        <Text style={styles.subtitle}>
          Scanează un produs pentru a găsi cele mai bune oferte!
        </Text>

        {/* BUTOANE */}
        <View style={styles.buttonsColumn}>
          <ButtonHover
            imageSrc={require("../../assets/images/camera.png")}
            label="Scanează etichetă"
            onPress={() => router.push("/scan_photo")}
          />
          <ButtonHover
            imageSrc={require("../../assets/images/barcode.png")}
            label="Scanează cod de bare"
            onPress={() => router.push("/barcode_scan")}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 200,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1b1b1b",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    marginBottom: 40,
  },
  buttonsColumn: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-around",
    gap: 20,
  },
});
