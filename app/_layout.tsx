import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { registerServiceWorker } from '@/src/utils/registerServiceWorker';
import Head from 'expo-router/head';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      registerServiceWorker();
    }
  }, []);

  return (
    <AuthProvider>
      <Head>
        <title>Schorl</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="/global.css" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      </Head>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#262626',
          },
          headerTintColor: '#f3f4f6',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#1a1a1a',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </AuthProvider>
  );
}
