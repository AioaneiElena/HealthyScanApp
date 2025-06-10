"use client"
import { View, TouchableOpacity, Text, StyleSheet, Platform } from "react-native"
import { useRouter, usePathname } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

export default function CustomBottomNavbar() {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.includes(path)) return true
    return false
  }

  const navItems = [
    {
      path: "/",
      icon: "home-outline",
      activeIcon: "home",
      label: "Acasă",
    },
    {
      path: "/cart",
      icon: "heart-outline",
      activeIcon: "bag",
      label: "Favorite",
    },
    {
      path: "/stats",
      icon: "stats-chart-outline",
      activeIcon: "stats-chart",
      label: "Statistici",
    },
    {
      path: "/(tabs)/receipe",
      icon: "book-outline",
      activeIcon: "pricetag",
      label: "Rețete",
    },
    {
      path: "/(tabs)/journal",
      icon: "calendar-outline",
      activeIcon: "calendar",
      label: "Jurnal",
    }
  ]

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.95)", "rgba(255, 214, 236, 0.8)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.navbar}
      >
        {navItems.map((item, index) => {
          const active = isActive(item.path)
          return (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(item.path as any)}
              style={[styles.item, active && styles.activeItem]}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
                <Ionicons
                  name={active ? (item.activeIcon as any) : (item.icon as any)}
                  size={24}
                  color={active ? "#fff" : "rgba(236, 72, 153, 0.8)"}
                />
              </View>
              <Text style={[styles.text, active && styles.activeText]}>{item.label}</Text>
            </TouchableOpacity>
          )
        })}
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navbar: {
    height: Platform.OS === "ios" ? 90 : 70,
    paddingBottom: Platform.OS === "ios" ? 25 : 10,
    paddingTop: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(236, 72, 153, 0.2)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 60,
  },
  activeItem: {
    backgroundColor: "rgba(236, 72, 153, 0.1)",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: "rgba(236, 72, 153, 0.9)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(236, 72, 153, 0.8)",
  },
  activeText: {
    color: "rgba(236, 72, 153, 1)",
    fontWeight: "600",
  },
})
