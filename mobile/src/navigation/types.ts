import type { NavigatorScreenParams } from "@react-navigation/native";

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Create: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  Phone: undefined;
  Otp: { phone: string };
  Onboarding: undefined;
  Main: NavigatorScreenParams<TabParamList>;
  PlanDetail: { planId: string };
  CreatePlan: undefined;
  Chat: { planId: string };
  NearbyPeople: undefined;
  EditProfile: undefined;
  UserProfile: { userId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
