import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/HomeScreen";
import { SocialSpotsScreen } from "../screens/SocialSpotsScreen";
import { CreateTabScreen } from "../screens/CreateTabScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

function tabLabel(focused: boolean, label: string) {
  return (
    <Text style={{ color: focused ? "#67e8f9" : "#64748b", fontSize: 11 }}>
      {label}
    </Text>
  );
}

function tabIcon(name: keyof typeof MaterialIcons.glyphMap) {
  return ({ focused }: { focused: boolean }) => (
    <View style={[styles.iconWrap, focused ? styles.iconWrapActive : null]}>
      <MaterialIcons
        name={name}
        size={22}
        color={focused ? "#a5f3fc" : "#64748b"}
      />
    </View>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          Platform.OS === "android" ? { elevation: 0 } : null,
        ],
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: tabIcon("map"),
          tabBarLabel: ({ focused }) => tabLabel(focused, "Home"),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={SocialSpotsScreen}
        options={{
          tabBarIcon: tabIcon("local-fire-department"),
          tabBarLabel: ({ focused }) => tabLabel(focused, "Explore"),
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateTabScreen}
        options={{
          tabBarIcon: tabIcon("add-circle"),
          tabBarLabel: ({ focused }) => tabLabel(focused, "Create"),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate("CreatePlan" as never);
          },
        })}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: tabIcon("notifications"),
          tabBarLabel: ({ focused }) => tabLabel(focused, "Alerts"),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: tabIcon("person"),
          tabBarLabel: ({ focused }) => tabLabel(focused, "Profile"),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    height: 64,
    borderRadius: 999,
    backgroundColor: "rgba(2, 6, 23, 0.68)",
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  tabItem: {
    marginTop: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.30)",
    shadowColor: "#00e3fd",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
