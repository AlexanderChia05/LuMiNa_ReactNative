import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/auth/login');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="client" />
        <Stack.Screen name="staff" />
      </Stack>
    </ThemeProvider>
  );
}
