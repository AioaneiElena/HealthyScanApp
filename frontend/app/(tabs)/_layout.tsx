import { Stack } from "expo-router";
import CustomNavbar from "../../components/CustomNavbar";
import CustomBottomNavbar from "../../components/CustomBottomNavbar";
import { View } from "react-native";

export default function RootLayout() {
  return (
    <>
      <CustomNavbar />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
        <CustomBottomNavbar />
      </View>
    </>
  );
}
