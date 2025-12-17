import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, Keyboard, useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import { AuthInput } from '@/components/AuthInput';
import { AuthButton } from '@/components/AuthButton';
import { Key, ChevronLeft } from 'lucide-react-native';

export default function VerificationScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(30);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleVerify = async () => {
        if (!token) {
            Alert.alert('Error', 'Please enter the verification code');
            return;
        }

        setLoading(true);
        Keyboard.dismiss();

        try {
            // Verify OTP
            // Type could be 'signup' or 'recovery' or 'magiclink'
            // We'll try 'recovery' first as this is typical for "Reset Password" flow
            const { data, error } = await supabase.auth.verifyOtp({
                email: email || '',
                token,
                type: 'recovery',
            });

            if (error) {
                // Try signup if recovery failed? Or alert. 
                // For this demo, we assume recovery flow.
                throw error;
            }

            if (data.session) {
                if (email && !router.canGoBack()) {
                    // Start of recovery session, replace stack
                    router.replace('/auth/reset-password');
                } else {
                    // For parity with standard flow
                    router.replace('/auth/reset-password');
                }
            }
        } catch (err: any) {
            Alert.alert('Verification Failed', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setTimer(30);
        try {
            await supabase.auth.resetPasswordForEmail(email || '');
            Alert.alert('Sent', 'Code resent to your email.');
        } catch (err: any) {
            Alert.alert('Error', err.message);
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
                    <Text style={[styles.title, { color: colors.text900 }]}>Verification</Text>
                    <Text style={[styles.subtitle, { color: colors.text500 }]}>
                        Enter the code sent to {email || 'your email'}
                    </Text>

                    {/* Form */}
                    <View style={styles.form}>
                        <AuthInput
                            icon={<Key size={20} color={colors.text400} />}
                            placeholder="One-Time Password"
                            value={token}
                            onChangeText={setToken}
                            keyboardType="number-pad"
                            maxLength={6}
                        />

                        <TouchableOpacity onPress={handleResend} disabled={timer > 0} style={{ alignSelf: 'center', marginBottom: 24 }}>
                            <Text style={[styles.resendText, { color: timer > 0 ? colors.text400 : colors.accent }]}>
                                {timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code'}
                            </Text>
                        </TouchableOpacity>

                        <AuthButton
                            text="Verify Code"
                            onPress={handleVerify}
                            loading={loading}
                            showArrow={false}
                        />

                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.replace('/auth/login')}
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
        paddingHorizontal: 20,
    },
    form: {
        width: '100%',
        gap: 4,
    },
    resendText: {
        fontSize: 13,
        fontWeight: '600',
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
