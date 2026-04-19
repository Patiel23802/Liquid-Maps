import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { PhoneScreen } from "../screens/PhoneScreen";
import { OtpScreen } from "../screens/OtpScreen";
import { MainTabNavigator } from "./MainTabs";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { PlanDetailScreen } from "../screens/PlanDetailScreen";
import { CreatePlanScreen } from "../screens/CreatePlanScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { NearbyPeopleScreen } from "../screens/NearbyPeopleScreen";
import { EditProfileScreen } from "../screens/EditProfileScreen";
import { UserProfileScreen } from "../screens/UserProfileScreen";
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
    primary: "#c084fc",
  },
};

function Gate() {
  const { me, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#67e8f9" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={me ? "in" : "out"}
      initialRouteName={me ? "Main" : "Welcome"}
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
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: "Log in" }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ title: "Sign up" }}
          />
          <Stack.Screen
            name="Phone"
            component={PhoneScreen}
            options={{ title: "Phone OTP" }}
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
          <Stack.Screen
            name="NearbyPeople"
            component={NearbyPeopleScreen}
            options={{ title: "People nearby" }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: "Edit profile" }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ title: "Profile" }}
          />
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
