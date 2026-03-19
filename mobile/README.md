# Eagle LMS Mobile (React Native / Expo)

This is the mobile application for Eagle LMS, built using React Native and Expo.

## Prerequisites

1. **Node.js**: Ensure you have Node.js installed.
2. **Expo Go**: Download the "Expo Go" app on your [iOS](https://apps.apple.com/app/expo-go/id982107779) or [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) device.
3. **Backend**: Ensure the FastAPI backend is running (typically on `http://localhost:8000`).

## Getting Started

1. **Navigate to the mobile directory**:
   ```bash
   cd mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

4. **Open the app**:
   - **On your phone**: Scan the QR code displayed in your terminal using the Expo Go app (Android) or the Camera app (iOS).
   - **On an emulator**: Press `i` for iOS simulator or `a` for Android emulator (requires Xcode/Android Studio setup).

## Building for Production

To build a standalone APK or IPA, use [EAS Build](https://docs.expo.dev/build/introduction/):

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure the build**:
   ```bash
   eas build:configure
   ```

4. **Run a build**:
   ```bash
   eas build --platform ios
   # or
   eas build --platform android
   ```

## Key Directories
- `src/api`: Axios configuration and API calls.
- `src/components`: Reusable UI components.
- `src/context`: Authentication and global state.
- `src/screens`: Individual app screens (Login, Dashboard, etc.).
- `src/theme`: Theme tokens and colors.
