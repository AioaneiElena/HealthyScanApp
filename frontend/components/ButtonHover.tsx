"use client"

import { useState } from "react"
import { TouchableOpacity, Text, Image, StyleSheet, type ViewStyle, type TextStyle } from "react-native"

type Props = {
  imageSrc?: any
  icon?: string // For emoji icons
  label: string
  onPress: () => void
  backgroundColor?: string
  pressedColor?: string
  textColor?: string
  style?: ViewStyle
  textStyle?: TextStyle
  fullWidth?: boolean
}

export default function FancyButton({
  imageSrc,
  icon,
  label,
  onPress,
  backgroundColor = "rgba(236, 72, 153, 0.9)",
  pressedColor = "rgba(219, 39, 119, 0.9)",
  textColor = "#fff",
  style,
  textStyle,
  fullWidth = false,
}: Props) {
  const [pressed, setPressed] = useState(false)

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: pressed ? pressedColor : backgroundColor,
          width: fullWidth ? "100%" : "auto",
        },
        style,
      ]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      activeOpacity={1}
    >
      {imageSrc && <Image source={imageSrc} style={styles.image} />}
      <Text style={[styles.label, { color: textColor }, textStyle]}>
        {icon && `${icon} `}
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginVertical: 6,
  },
  image: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  label: {
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
})
