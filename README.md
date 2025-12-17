# Lumina Mobile Application

A premium salon booking application built with **React Native (Expo SDK 51)** and **Supabase**.

## 📱 Prerequisites

Before you start, ensure you have the following installed:

1.  **Node.js (LTS version)**: [Download Node.js](https://nodejs.org/)
2.  **Expo Go App**: Install on your physical device.
    *   [iOS (App Store)](https://apps.apple.com/us/app/expo-go/id982107779)
    *   [Android (Play Store)](https://play.google.com/store/apps/details?id=host.exp.exponent)
3.  **Git**: [Download Git](https://git-scm.com/)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/alexanderchia05/LuMiNa_ReactNative.git
cd LuMiNa_ReactNative
```

### 2. Install Dependencies
Install the required packages using `npm`:
```bash
npm install
```

### 3. Run the Application
Start the Expo development server with the clear cache flag to avoid common issues:
```bash
npx expo start -c
```

### 4. Open on Your Device
*   **Android**: Open the **Expo Go** app and scan the QR code displayed in your terminal.
*   **iOS**: Open the **Camera** app, scan the QR code, and tap the notification to open in Expo Go.

> **Note**: Ensure your phone and computer are on the **same Wi-Fi network**.

---

## 🛠️ Project Structure

*   **`/app`**: Main application screens and routing (Expo Router).
    *   **`/client`**: Customer-facing screens (Home, Book, Profile, etc.).
    *   **`/staff`**: Staff-facing dashboard (Schedule, Check-in, etc.).
    *   **`/auth`**: Login and Registration screens.
*   **`/components`**: Reusable UI components.
*   **`/constants`**: App-wide constants (Colors, Theme).
*   **`/services`**: API and Database services (Supabase).
*   **`/assets`**: Images and fonts.

---

## 🎨 Features
*   **Dual Role Support**: Separate interfaces for Clients and Staff.
*   **Dark Mode**: Fully supported Gold/Black theme for dark mode alongside the classic Rose/White light theme.
*   **Real-time Booking**: Seamless appointment scheduling with conflict detection.
*   **Digital Receipts**: Consolidated receipt tracking with notifications.

---

## ❓ Troubleshooting

### Connection Issues
If the app gets stuck on "Downloading bundle" or fails to connect:
1.  Ensure devices are on the same Wi-Fi.
2.  Press `r` in the terminal to reload.
3.  Restart the bundler: `Ctrl + C` then run `npx expo start -c`.

### "Cannot read property 'id' of null"
This usually happens if the user session is lost or not fully loaded.
*   **Fix**: Close the app completely and reopen it. Ensure you log in again if prompted.

### Styling Issues (Dark Mode)
If colors look incorrect, try toggling the system theme or reloading the app (`r`) to force a re-render of the theme context.

---

## 📄 License
This project is for educational purposes.
