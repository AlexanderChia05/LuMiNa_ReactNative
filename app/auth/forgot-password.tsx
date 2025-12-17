import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, Keyboard, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import { AuthInput } from '@/components/AuthInput';
import { AuthButton } from '@/components/AuthButton';
import { Mail, ChevronLeft } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        Keyboard.dismiss();

        try {
            // Note: For OTP flow, we might need signInWithOtp or specific config
            // Standard reset sends a link. Assuming OTP for parity with "Verification" screen.
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

            if (error) throw error;

            // Navigate to Verification
            router.push({ pathname: '/auth/verification', params: { email: email.trim() } });

        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <View style={[styles.logoBox, { backgroundColor: colors.accent, shadowColor: colors.accent }]}>
                            <Text style={styles.logoText}>L</Text>
                        </View>
                    </View>

                    {/* Header */}
                    <Text style={[styles.title, { color: colors.text900 }]}>Reset Password</Text>
                    <Text style={[styles.subtitle, { color: colors.text500 }]}>Experience luxury at your fingertips.</Text>

                    {/* Form */}
                    <View style={styles.form}>
                        <AuthInput
                            icon={<Mail size={20} color={colors.text400} />}
                            placeholder="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <AuthButton
                            text="Send Code"
                            onPress={handleReset}
                            loading={loading}
                            style={styles.sendBtn}
                        />

                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.back()}
                        >
                            <ChevronLeft size={16} color={colors.text500} />
                            <Text style={[styles.backText, { color: colors.text600 }]}>Back to Sign In</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 16,
        alignItems: 'center',
    },
    logoBox: {
        width: 64,
        height: 64,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    logoText: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 4,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        marginBottom: 32,
        textAlign: 'center',
    },
    form: {
        width: '100%',
        gap: 4,
    },
    sendBtn: {
        marginTop: 12,
    },
    backBtn: {
        marginTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    backText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
