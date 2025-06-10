"use client"

import { View, StyleSheet, Platform, StatusBar, ViewStyle } from "react-native"
import type { ReactNode } from "react"

const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24
const TOP_NAVBAR_HEIGHT = STATUS_BAR_HEIGHT + 30
const BOTTOM_NAVBAR_HEIGHT = Platform.OS === "ios" ? 90 : 70

type Props = {
  children: ReactNode
  hasTopNavbar?: boolean
  hasBottomNavbar?: boolean
  style?: ViewStyle | ViewStyle[]  
}

export default function ScreenWrapper({
  children,
  hasTopNavbar = true,
  hasBottomNavbar = true,
  style,
}: Props) {
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: hasTopNavbar ? TOP_NAVBAR_HEIGHT : 0,
          paddingBottom: hasBottomNavbar ? BOTTOM_NAVBAR_HEIGHT : 0,
        },
        style, 
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
