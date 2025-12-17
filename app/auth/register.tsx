import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Keyboard, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/Colors';
import { AuthInput } from '@/components/AuthInput';
import { AuthButton } from '@/components/AuthButton';
import { Mail, Lock, User, Phone, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';

export default function RegisterScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!fullName || !phone || !pin || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (pin.length !== 6) {
            Alert.alert('Error', 'Security PIN must be 6 digits');
            return;
        }

        setLoading(true);
        Keyboard.dismiss();

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        full_name: fullName,
                        phone: phone,
                        security_pin: pin,
                    }
                }
            });

            if (error) throw error;

            if (data.session) {
                Alert.alert('Success', 'Account created successfully!', [
                    { text: 'Start Experience', onPress: () => router.replace('/client/home') }
                ]);
            } else {
                // If email confirmation is on
                Alert.alert('Verification', 'Please check your email to verify your account.');
                router.back();
            }

        } catch (err: any) {
            Alert.alert('Registration Failed', err.message);
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
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <View style={[styles.logoBox, { backgroundColor: colors.accent, shadowColor: colors.accent }]}>
                            <Text style={styles.logoText}>L</Text>
                        </View>
                    </View>

                    {/* Header */}
                    <Text style={[styles.title, { color: colors.text900 }]}>Join Lumina</Text>
                    <Text style={[styles.subtitle, { color: colors.text500 }]}>Experience luxury at your fingertips.</Text>

                    {/* Form */}
                    <View style={styles.form}>
                        <AuthInput
                            icon={<User size={20} color={colors.text400} />}
                            placeholder="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />
                        <AuthInput
                            icon={<Phone size={20} color={colors.text400} />}
                            placeholder="+60 12 345 6789"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                        <AuthInput
                            icon={<Lock size={20} color={colors.text400} />}
                            placeholder="6-Digit Security PIN"
                            value={pin}
                            onChangeText={setPin}
                            keyboardType="numeric"
                            maxLength={6}
                            secureTextEntry
                        />
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
                            text="Create Account"
                            onPress={handleRegister}
                            loading={loading}
                            style={styles.registerBtn}
                        />

                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.back()}
                        >
                            <ChevronLeft size={16} color={colors.text500} />
                            <Text style={[styles.backText, { color: colors.text600 }]}>Back to Sign In</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
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
    scrollContent: {
        padding: 24,
        alignItems: 'center',
        paddingTop: 40,
    },
    logoContainer: {
        marginBottom: 16,
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
        marginBottom: 24,
        textAlign: 'center',
    },
    form: {
        width: '100%',
        gap: 4,
    },
    registerBtn: {
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
