import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { PhoneScreen } from "../screens/PhoneScreen";
import { OtpScreen } from "../screens/OtpScreen";
import { MainTabNavigator } from "./MainTabs";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { PlanDetailScreen } from "../screens/PlanDetailScreen";
import { CreatePlanScreen } from "../screens/CreatePlanScreen";
import { ChatScreen } from "../screens/ChatScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#0f0f10",
    card: "#0f0f10",
    text: "#faf7f2",
    border: "#292524",
    primary: "#ea580c",
  },
};

function Gate() {
  const { me, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={me ? "in" : "out"}
      screenOptions={{
        headerStyle: { backgroundColor: "#0f0f10" },
        headerTintColor: "#faf7f2",
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: "#0f0f10" },
      }}
    >
      {!me ? (
        <>
          <Stack.Screen
            name="Phone"
            component={PhoneScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Otp"
            component={OtpScreen}
            options={{ title: "Verify" }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ title: "About you" }}
          />
          <Stack.Screen
            name="PlanDetail"
            component={PlanDetailScreen}
            options={{ title: "Plan" }}
          />
          <Stack.Screen
            name="CreatePlan"
            component={CreatePlanScreen}
            options={{ title: "New plan" }}
          />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer theme={navTheme}>
        <Gate />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f10",
  },
});
