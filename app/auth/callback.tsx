import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/src/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // On mobile, deep linking is handled by AuthContext
      router.replace('/');
      return;
    }

    // Web only: extract tokens from URL and create session
    const handleCallback = async () => {
      try {
        // Get the full URL with hash
        const url = window.location.href;

        // Check if we have tokens in the hash
        if (url.includes('#') && (url.includes('access_token') || url.includes('type=recovery'))) {
          // Let Supabase process the callback automatically
          // The auth state listener in AuthContext will handle the session update
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Check if we have a session now
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('Auth successful, redirecting...');
        }

        // Redirect back to main screen
        router.replace('/');
      } catch (error) {
        console.error('Error in auth callback:', error);
        // Redirect anyway to avoid getting stuck
        router.replace('/');
      }
    };

    handleCallback();
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
});
