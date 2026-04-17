import type { NavigatorScreenParams } from "@react-navigation/native";

export type TabParamList = {
  Home: undefined;
  Discover: undefined;
  Map: undefined;
  Communities: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Phone: undefined;
  Otp: { phone: string };
  Onboarding: undefined;
  Main: NavigatorScreenParams<TabParamList>;
  PlanDetail: { planId: string };
  CreatePlan: undefined;
  Chat: { planId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
