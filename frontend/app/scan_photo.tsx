import React, { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function ScanPhotoScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
      await sendImageToBackend(uri);
    }
  };

  const sendImageToBackend = async (uri: string) => {
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

      const data = await response.json();
      router.push({
        pathname: "/(stack)/results",
        params: {
          query: data.query,
          results: JSON.stringify(data.top3),
        },
      });
    } catch (error) {
      Alert.alert("Eroare", "Nu s-a putut trimite imaginea.");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Button title="📷 Fă o poză" onPress={pickImage} color="#2e7d32" />
      {loading && <ActivityIndicator size="large" style={{ margin: 20 }} />}
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'flex-start', alignItems: 'center' },
  image: { width: 200, height: 200, marginTop: 20, borderRadius: 8 },
});
