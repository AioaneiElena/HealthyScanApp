import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProductSummaryScreen() {
  const { product } = useLocalSearchParams();
  const productInfo = product ? JSON.parse(product as string) : null;
  const router = useRouter();

  if (!productInfo) return <Text style={styles.container}>Produs invalid</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {productInfo.imagine && (
        <Image source={{ uri: productInfo.imagine }} style={styles.image} />
      )}

      <Text style={styles.title}>{productInfo.nume}</Text>
      <Text style={styles.subtitle}>Brand: {productInfo.brand} ({productInfo.cantitate})</Text>

      <View style={styles.scores}>
        <Text style={styles.score}>NutriScore: {productInfo.nutriscore}</Text>
        <Text style={styles.score}>NOVA: {productInfo.nova}</Text>
        <Text style={styles.score}>EcoScore: {productInfo.ecoscore}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          router.push({
            pathname: "/results",
            params: {
              query: productInfo.query,
              results: JSON.stringify(productInfo.rezultate),
            },
          });
        }}
      >
        <Text style={styles.buttonText}>🛍️ Vezi ce este în magazin</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#d32f2f" }]}
        onPress={() => {
          router.push({
            pathname: "/alternatives",
            params: { name: productInfo.nume },
          });
        }}
      >
        <Text style={styles.buttonText}>🍃 Vezi alternative mai sănătoase</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", alignItems: "center",paddingTop: 100 },
  image: { width: 200, height: 200, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 16 },
  scores: { marginBottom: 16 },
  score: { fontSize: 14, fontWeight: "600" },
  button: {
    backgroundColor: "#1565c0",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
