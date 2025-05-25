import { View, Button, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function StartScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👋 Bine ai venit!</Text>
      <Text style={styles.subtitle}>Începe prin a te autentifica sau înregistra</Text>

      <View style={styles.buttonWrapper}>
        <Button title="🔐 Login" onPress={() => router.push("/login")} color="#2e7d32" />
      </View>
      <View style={styles.buttonWrapper}>
         <Button title="🆕 Sign Up" onPress={() => router.push("/signup")} color="#d32f2f" />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#1976d2", 
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff", 
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: "#fff",
    textAlign: "center",
  },
  buttonWrapper: {
    width: "80%",
    marginVertical: 10,
  },
});

