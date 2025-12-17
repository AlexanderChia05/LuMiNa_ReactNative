import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            router.replace('/auth/login');
        } else {
            // Domain-based routing: @lumina.com → Staff, all others → Client
            const email = session.user.email || '';
            if (email.endsWith('@lumina.com')) {
                router.replace('/staff/home');
            } else {
                router.replace('/client/home');
            }
        }
    };

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#e65a78" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
});
