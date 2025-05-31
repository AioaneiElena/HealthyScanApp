import React, { use, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import useAuthGuard from '../../hooks/useAuthGuard';
import type { LocationObjectCoords } from 'expo-location';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

export default function ProductScreen() {
  useAuthGuard();
  const router = useRouter();
  const { product } = useLocalSearchParams();
  const produs = product ? JSON.parse(product as string) : null;

  const [location, setLocation] = useState<LocationObjectCoords | null>(null);
  const [magazinCoord, setMagazinCoord] = useState<any>(null);
  const [distanta, setDistanta] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const nutriColor = (score: string) => {
    switch (score) {
      case "A": return "green";
      case "B": return "#9ccc65";
      case "C": return "#f9a825";
      case "D": return "orange";
      case "E": return "red";
      default: return "gray";
    }
  };

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchClosestStore = async (numeMagazin: string, lat: number, lon: number) => {
    const query = `
      [out:json];
      (
        node["name"~"${numeMagazin}", i](around:25000, ${lat}, ${lon});
        way["name"~"${numeMagazin}", i](around:25000, ${lat}, ${lon});
        relation["name"~"${numeMagazin}", i](around:25000, ${lat}, ${lon});
      );
      out center;
    `;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    });

    const json = await res.json();
    if (!json.elements || json.elements.length === 0) return null;

    const sorted = json.elements.map((el: any) => {
      const lat2 = el.lat ?? el.center?.lat;
      const lon2 = el.lon ?? el.center?.lon;
      const d = haversineDistance(lat, lon, lat2, lon2);
      return { ...el, dist: d, lat: lat2, lon: lon2 };
    }).sort((a: any, b: any) => a.dist - b.dist);

    return sorted[0];
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert("Permisiunea la locație este necesară pentru a găsi magazinul.");
          return;
        }

        const userLoc = await Location.getCurrentPositionAsync({});
        setLocation(userLoc.coords);

        const denumireMagazin = (produs.magazin ?? "").split(" ")[0].toLowerCase();
        console.log("🔍 Magazin căutat:", denumireMagazin);
        console.log("📍 Locație utilizator:", userLoc.coords);

        const closest = await fetchClosestStore(denumireMagazin, userLoc.coords.latitude, userLoc.coords.longitude);

        if (closest) {
          setMagazinCoord({
            lat: closest.lat,
            lon: closest.lon,
            display_name: closest.tags?.name || produs.magazin,
          });
          setDistanta(closest.dist);
        } else {
          console.warn("❗️ Nicio locație Overpass găsită");
        }
      } catch (err) {
        console.error("Eroare locație:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!produs) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Produsul nu a fost găsit.</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#ffd6ec", "#fff4b3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: STATUS_BAR_HEIGHT + 80 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Înapoi</Text>
        </TouchableOpacity>

        {produs.imagine && (
          <Image source={{ uri: produs.imagine }} style={styles.image} />
        )}

        <View style={styles.card}>
          <Text style={styles.name}>{produs.titlu ?? "—"}</Text>
          <Text style={styles.price}>{produs.pret ? `${produs.pret} lei` : "Preț indisponibil"}</Text>
          <Text style={styles.magazin}>🛒 {produs.magazin ?? "—"}</Text>
          <Text style={styles.desc}>{produs.descriere ?? "Fără descriere"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>NutriScore:</Text>
          <Text style={[styles.nutriscore, { color: nutriColor(produs.nutriscore) }]}> {produs.nutriscore ?? "necunoscut"}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : magazinCoord ? (
          <View style={styles.card}>
            <Text style={styles.label}>📍 Cel mai apropiat magazin:</Text>
            <Text style={styles.desc}>{magazinCoord.display_name}</Text>
            {distanta && (
              <Text style={styles.label}>📏 Distanță aproximativă: {distanta.toFixed(2)} km</Text>
            )}

            <MapView
              style={styles.map}
              initialRegion={{
                latitude: magazinCoord.lat,
                longitude: magazinCoord.lon,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{ latitude: magazinCoord.lat, longitude: magazinCoord.lon }}
                title={produs.magazin}
                description="Cel mai apropiat magazin"
              />
            </MapView>

            <TouchableOpacity
              style={styles.openMaps}
              onPress={() =>
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${magazinCoord.lat},${magazinCoord.lon}`)
              }
            >
              <Text style={styles.openMapsText}>🗺️ Deschide în Google Maps</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.empty}>Nu s-a găsit magazin apropiat în zona ta.</Text>
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
    alignItems: 'center',
  },
  backButton: { alignSelf: 'flex-start', marginBottom: 10 },
  backText: { fontSize: 16, color: '#1565c0', fontWeight: 'bold' },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#333",
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  name: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  price: { fontSize: 18, color: '#2e7d32', marginVertical: 4 },
  magazin: { fontSize: 15, color: '#555', marginBottom: 6 },
  desc: { fontSize: 14, color: '#666' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  nutriscore: { fontSize: 24, fontWeight: 'bold' },
  map: { height: 200, borderRadius: 12, marginTop: 10 },
  openMaps: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#1565c0",
  },
  openMapsText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  empty: {
    fontSize: 14,
    marginTop: 20,
    color: "#999",
    textAlign: "center",
  },
});
