import React, { useState } from "react";
import { TouchableOpacity, Text, Image, StyleSheet } from "react-native";

type Props = {
  imageSrc: any;
  label: string;
  onPress: () => void;
};

export default function FancyButton({ imageSrc, label, onPress }: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        pressed && styles.buttonPressed // roz pal doar când e apăsat
      ]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      activeOpacity={1}
    >
      <Image source={imageSrc} style={styles.image} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
  },
  buttonPressed: {
    backgroundColor: "#ffb6c1", 
  },
  image: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  label: {
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
});
