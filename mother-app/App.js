import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';

function registerForPushNotifications() {
  async function register() {
    try {
      if (Platform.OS === 'web') return;
      const PushNotification = require('react-native-push-notification');
      PushNotification.configure({
        onRegister: ({ token }) => console.log('Push token:', token),
        permissions: { alert: true, badge: true, sound: true },
        requestPermissions: true,
      });
    } catch (e) {
      console.warn('Push notification registration:', e.message);
    }
  }
  register();
}

export default function App() {
  useEffect(() => { registerForPushNotifications(); }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF0F0" />
        <AppNavigator />
      </LanguageProvider>
    </AuthProvider>
  );
}
