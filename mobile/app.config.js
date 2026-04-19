/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();

const appJson = require("./app.json");

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    plugins: [...(appJson.expo.plugins ?? []), "expo-asset"],
    userInterfaceStyle: "dark",
    extra: {
      ...(appJson.expo.extra ?? {}),
      hasGoogleMapsKey: Boolean(googleMapsApiKey),
      googleMapsApiKey: googleMapsApiKey || undefined,
    },
    ios: {
      ...appJson.expo.ios,
      config: {
        ...(appJson.expo.ios?.config ?? {}),
        googleMapsApiKey,
      },
    },
    android: {
      ...appJson.expo.android,
      usesCleartextTraffic: true,
      config: {
        ...(appJson.expo.android?.config ?? {}),
        googleMaps: {
          ...(appJson.expo.android?.config?.googleMaps ?? {}),
          apiKey: googleMapsApiKey,
        },
      },
    },
  },
};
