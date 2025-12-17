import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, Keyboard, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import { AuthInput } from '@/components/AuthInput';
import { AuthButton } from '@/components/AuthButton';
import { Lock, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { AuthService } from '@/services/auth';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const validatePassword = (pwd: string) => {
        const hasLength = pwd.length >= 8;
        const hasNumber = /\d/.test(pwd);
        const hasLetter = /[a-zA-Z]/.test(pwd);
        return hasLength && hasNumber && hasLetter;
    };

    const isPasswordValid = validatePassword(password) && password === confirmPassword;

    const handleUpdate = async () => {
        if (!isPasswordValid) return;

        setLoading(true);
        Keyboard.dismiss();

        try {
            const { error } = await AuthService.updateUserPassword(password);

            if (error) throw error;

            Alert.alert('Success', 'Your password has been updated.', [
                { text: 'Log In', onPress: () => router.replace('/auth/login') }
            ]);
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
                    <Text style={[styles.title, { color: colors.text900 }]}>New Password</Text>
                    <Text style={[styles.subtitle, { color: colors.text500 }]}>
                        Create a new secure password for your account.
                    </Text>

                    {/* Form */}
                    <View style={styles.form}>
                        <AuthInput
                            icon={<ShieldCheck size={20} color={colors.text400} />}
                            placeholder="New Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                        />

                        <View>
                            <AuthInput
                                icon={<Lock size={20} color={colors.text400} />}
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            {confirmPassword.length > 0 && password === confirmPassword && (
                                <View style={styles.checkIcon}>
                                    <CheckCircle2 size={18} color="#22c55e" />
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.toggleBtn}
                        >
                            <Text style={styles.toggleText}>
                                {showPassword ? "HIDE CHARACTERS" : "SHOW CHARACTERS"}
                            </Text>
                        </TouchableOpacity>

                        <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(244, 63, 94, 0.1)' : '#fff1f2', borderColor: isDark ? 'rgba(244, 63, 94, 0.2)' : '#fecdd3' }]}>
                            <Text style={[styles.infoText, { color: colors.text500 }]}>
                                Requirement: Minimum 8 characters. Must include letters and numbers.
                            </Text>
                        </View>

                        <AuthButton
                            text="Update & Log In"
                            onPress={handleUpdate}
                            loading={loading}
                            style={[
                                styles.updateBtn,
                                !isPasswordValid && styles.disabledBtn
                            ]}
                            showArrow={true}
                        />

                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.replace('/auth/login')}
                        >
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
        gap: 12, // Increased gap for visual breathing room
    },
    checkIcon: {
        position: 'absolute',
        right: 14,
        top: 14,
        zIndex: 10,
    },
    toggleBtn: {
        alignSelf: 'flex-end',
        marginBottom: 4,
    },
    toggleText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9ca3af', // Gray 400 default
        letterSpacing: 0.5,
    },
    infoBox: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    infoText: {
        fontSize: 11,
        lineHeight: 16,
    },
    updateBtn: {
        marginTop: 4,
        height: 54, // Matching Auth UI screenshot height
    },
    disabledBtn: {
        opacity: 0.5,
    },
    backBtn: {
        marginTop: 24,
        alignItems: 'center',
    },
    backText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
