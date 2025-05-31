import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import useAuthGuard from "../hooks/useAuthGuard";
import { LinearGradient } from 'expo-linear-gradient';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

export default function BarcodeScanScreen() {
  useAuthGuard();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [productInfo, setProductInfo] = useState<any>(null);
  const router = useRouter();

  const pickImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permisiune necesară", "Trebuie să permiți accesul la cameră.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ base64: false });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      await decodeAndFetch(uri);
    }
  };

  const decodeAndFetch = async (uri: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: "barcode.jpg",
        type: "image/jpeg"
      } as any);

      const decodeRes = await fetch("http://192.168.1.102:8000/decode-barcode", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData
      });

      if (!decodeRes.ok) {
        const err = await decodeRes.text();
        throw new Error(`Decodare eșuată: ${err}`);
      }

      const { code } = await decodeRes.json();

      const productRes = await fetch(`http://192.168.1.102:8000/barcode/${code}`);
      if (!productRes.ok) {
        const errText = await productRes.text();
        throw new Error(`Produs negăsit: ${errText}`);
      }

      const result = await productRes.json();
      setProductInfo(result);

    } catch (error) {
      Alert.alert("Eroare", (error as Error).message);
    }
    setLoading(false);
  };

  return (
    <LinearGradient
      colors={["#ffd6ec", "#fff4b3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Scanează un Cod de Bare</Text>
        <Text style={styles.subtitle}>Fotografiază eticheta unui produs pentru a-i detecta codul și a căuta cele mai bune oferte.</Text>

        <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.cameraText}>Deschide Camera</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" style={{ margin: 20 }} />}
        {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

        {productInfo && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Brand: <Text style={styles.value}>{productInfo.brand}</Text></Text>
            <Text style={styles.label}>Nume: <Text style={styles.value}>{productInfo.nume}</Text></Text>
            <Text style={styles.label}>Cantitate: <Text style={styles.value}>{productInfo.cantitate}</Text></Text>
            <Text style={styles.label}>NutriScore:
              <Text style={[styles.value, {
                color:
                  productInfo.nutriscore === "A" ? "green" :
                  productInfo.nutriscore === "E" ? "red" :
                  "#f9a825"
              }]}> {productInfo.nutriscore}</Text>
            </Text>
            <Text style={styles.label}>NOVA: <Text style={styles.value}> {productInfo.nova}</Text></Text>
            <Text style={styles.label}>EcoScore: <Text style={styles.value}> {productInfo.ecoscore}</Text></Text>
          </View>
        )}

        {productInfo?.nutriscore && (productInfo.nutriscore === "D" || productInfo.nutriscore === "E") && (
          <TouchableOpacity
            style={styles.altButton}
            onPress={() => router.push({
              pathname: "/alternatives",
              params: {
                name: productInfo.nume,
                categorie: productInfo.categorie,
              },
            })}
          >
            <Text style={styles.altButtonText}>🍃 Vezi alternative mai sănătoase</Text>
          </TouchableOpacity>
        )}

        {productInfo && (
          <>
            <TouchableOpacity
              style={styles.altButton}
              onPress={() => router.push({
                pathname: "/results",
                params: {
                  query: productInfo.query,
                  results: JSON.stringify(productInfo.rezultate || []),
                },
              })}
            >
              <Text style={styles.altButtonText}>🔎 Vezi ce e în magazine</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              setImageUri(null);
              setProductInfo(null);
            }}>
              <Text style={styles.rescan}>🔁 Încearcă alt produs</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: STATUS_BAR_HEIGHT + 100,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  cameraButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  cameraIcon: { fontSize: 32, marginBottom: 4 },
  cameraText: { fontSize: 16, fontWeight: '600', color: '#1565c0' },
  image: { width: 220, height: 220, marginTop: 10, borderRadius: 8 },
  infoBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    width: '100%',
  },
  label: { fontWeight: 'bold', marginBottom: 4 },
  value: { fontWeight: 'normal', color: '#333' },
  rescan: {
    marginTop: 20,
    fontWeight: 'bold',
    color: '#1565c0',
    textDecorationLine: 'underline',
  },
  altButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#81c784",
    borderRadius: 8,
  },
  altButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});
