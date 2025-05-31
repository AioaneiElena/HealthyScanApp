import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type User = {
  name: string;
};

export default function useUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userString = await AsyncStorage.getItem("user");

      if (userString) {
        try {
          const parsed = JSON.parse(userString);
          console.log("✅ User extras din storage:", parsed); 
          setUser(parsed);
        } catch (e) {
          console.error("❌ Eroare parsare user:", e);
          setUser(null);
        }
      }
    };

    fetchUser();
  }, []);

  return user;
}
