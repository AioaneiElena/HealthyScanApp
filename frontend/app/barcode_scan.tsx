import React, { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import useAuthGuard from "../hooks/useAuthGuard";

export default function BarcodeScan() {
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
      await decodeAndSearch(uri);
    }
  };

    const decodeAndSearch = async (uri: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: "barcode.jpg",
        type: "image/jpeg"
      } as any);

      const decodeRes = await fetch("http://192.168.0.102:8000/decode-barcode", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData
      });

      if (!decodeRes.ok) {
        const err = await decodeRes.text();
        throw new Error(`Decodare eșuată: ${err}`);
      }

      const { code } = await decodeRes.json();
      console.log("📥 Cod extras:", code);

      const productRes = await fetch(`http://192.168.0.102:8000/barcode/${code}`);
      if (!productRes.ok) {
        const errText = await productRes.text();
        throw new Error(`Produs negăsit: ${errText}`);
      }

      const result = await productRes.json();
      console.log("📦 Produs primit:", result);
      setProductInfo(result);

      const query = `${result.brand} ${result.nume.split(' ')[0]} ${result.cantitate}`.trim().toLowerCase();
      console.log("🔍 Trimit query:", query);

      const searchRes = await fetch("http://192.168.0.102:8000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      });

      if (!searchRes.ok) {
        const err = await searchRes.text();
        throw new Error(`Căutare eșuată: ${err}`);
      }

      const data = await searchRes.json();
      if (data.top3 && data.top3.length > 0) {
        router.push({
          pathname: "/(stack)/results",
          params: {
            query: data.query,
            results: JSON.stringify(data.top3),
          },
        });
      } else {
        Alert.alert("Nicio ofertă găsită", "Încearcă un alt produs.");
      }

    } catch (error) {
      Alert.alert("Eroare", (error as Error).message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Button title="📷 Scanează Cod de Bare" onPress={pickImage} color="#1565c0" />
      {loading && <ActivityIndicator size="large" style={{ margin: 20 }} />}
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      {productInfo && (
        <View style={styles.infoBox}>
          <Text style={styles.label}>Brand: <Text style={styles.value}>{productInfo.brand}</Text></Text>
          <Text style={styles.label}>Nume: <Text style={styles.value}>{productInfo.nume}</Text></Text>
          <Text style={styles.label}>Cantitate: <Text style={styles.value}>{productInfo.cantitate}</Text></Text>
          <Text style={styles.label}>NutriScore:<Text style={[styles.value,
              {
              color:
                productInfo.nutriscore === "A" ? "green" :
                productInfo.nutriscore === "E" ? "red" :
                "#f9a825"
            }]}>{" "}{productInfo.nutriscore}</Text></Text>
            <Text style={styles.label}>NOVA:
              <Text style={styles.value}> {productInfo.nova}</Text>
            </Text>
            <Text style={styles.label}>EcoScore:
              <Text style={styles.value}> {productInfo.ecoscore}</Text>
            </Text>

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'flex-start', alignItems: 'center' },
  image: { width: 200, height: 200, marginTop: 20, borderRadius: 8 },
  infoBox: {
    marginTop: 20, padding: 16, backgroundColor: '#e0f7fa', borderRadius: 8
  },
  label: { fontWeight: 'bold', marginBottom: 4 },
  value: { fontWeight: 'normal', color: '#333' }
});
