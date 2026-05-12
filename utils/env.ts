import Constants from 'expo-constants';

/**
 * True when the app is running inside Expo Go (executionEnvironment = 'storeClient').
 *
 * Google Sign-In relies on the mochimemo:// deep-link redirect being intercepted
 * by the native app. Expo Go cannot intercept custom scheme redirects reliably,
 * so Google OAuth will open Safari and never return to the app.
 *
 * Use a development build (eas build --profile development) or production build
 * to test Google Sign-In. Email/password auth works in Expo Go without restriction.
 *
 * executionEnvironment values:
 *   'storeClient'  — Expo Go
 *   'standalone'   — production / TestFlight / Play Store build
 *   'bare'         — development build (EAS dev profile or local run)
 */
export const isExpoGo: boolean =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo';
