import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, Keyboard, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import { AuthInput } from '@/components/AuthInput';
import { AuthButton } from '@/components/AuthButton';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        Keyboard.dismiss();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) throw error;

            if (email.trim().endsWith('@lumina.com')) {
                router.replace('/staff/home');
            } else {
                router.replace('/client/home');
            }
        } catch (err: any) {
            Alert.alert('Login Failed', err.message);
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
                    <Text style={[styles.title, { color: colors.text900 }]}>Welcome Back</Text>
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
                        <AuthInput
                            icon={<Lock size={20} color={colors.text400} />}
                            rightIcon={showPassword ? <EyeOff size={20} color={colors.text400} /> : <Eye size={20} color={colors.text400} />}
                            onRightIconPress={() => setShowPassword(!showPassword)}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />

                        <AuthButton
                            text="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            style={styles.signInBtn}
                        />

                        <TouchableOpacity
                            style={styles.forgotBtn}
                            onPress={() => router.push('/auth/forgot-password')}
                        >
                            <Text style={[styles.forgotText, { color: colors.text600 }]}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.text500 }]}>New to Lumina? </Text>
                        <TouchableOpacity onPress={() => router.push('/auth/register')}>
                            <Text style={[styles.footerLink, { color: colors.accent }]}>Sign Up</Text>
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
    signInBtn: {
        marginTop: 12,
    },
    forgotBtn: {
        alignSelf: 'center',
        marginTop: 20,
    },
    forgotText: {
        fontSize: 13,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
    },
    footerLink: {
        fontSize: 13,
        fontWeight: '700',
    },
});
