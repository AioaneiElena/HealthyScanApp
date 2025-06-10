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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthGuard from "../../hooks/useAuthGuard";

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

export default function ScanPhotoScreen() {
  useAuthGuard();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
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
      await scanAndSearch(uri);
    }
  };

  const scanAndSearch = async (uri: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch("http://192.168.0.102:8000/scan-and-search", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      const data = await response.json();
      if (data.top3 && data.top3.length > 0) {
        setSearchResult({
          query: data.query,
          imagine: uri,
          top3: data.top3
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
    <LinearGradient
      colors={["#ffd6ec", "#fff4b3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Scanează Eticheta unui Produs</Text>
        <Text style={styles.subtitle}>Fotografiază o etichetă și caută cele mai bune oferte pentru produsul recunoscut.</Text>

        <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.cameraText}>Deschide Camera</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" style={{ margin: 20 }} />}
        {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

        {searchResult && (
          <TouchableOpacity
            style={styles.goToResults}
            onPress={() => router.push({
              pathname: "/(stack)/results",
              params: {
                query: searchResult.query,
                results: JSON.stringify(searchResult.top3),
              },
            })}
          >
            <Text style={styles.goToResultsText}>🔎 Vezi rezultate</Text>
          </TouchableOpacity>
        )}

        {searchResult && (
          <TouchableOpacity onPress={() => {
            setImageUri(null);
            setSearchResult(null);
          }}>
            <Text style={styles.rescan}>🔁 Încearcă alt produs</Text>
          </TouchableOpacity>
        )}
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
  cameraIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  cameraText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565c0',
  },
  image: {
    width: 220,
    height: 220,
    marginTop: 10,
    borderRadius: 8,
  },
  goToResults: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2e7d32',
    borderRadius: 8,
  },
  goToResultsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rescan: {
    marginTop: 20,
    fontWeight: 'bold',
    color: '#1565c0',
    textDecorationLine: 'underline',
  },
});
