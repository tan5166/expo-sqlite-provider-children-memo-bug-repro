import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import "react-native-reanimated";

export default function RootLayout() {
  const [dbInit, setdbInit] = useState(false);

  useEffect(() => {
    console.log("dbInit: ", dbInit);
  }, [dbInit]);

  return (
    <SQLiteProvider
      databaseName={"repro"}
      options={{ enableChangeListener: true }}
      onInit={async () => {
        setdbInit(true);
      }}
    >
      {dbInit ? (
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>dbInit: {String(dbInit)}</Text>
        </View>
      )}
      <StatusBar style="auto" />
    </SQLiteProvider>
  );
}
