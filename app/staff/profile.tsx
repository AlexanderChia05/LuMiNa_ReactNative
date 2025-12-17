import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Api } from '@/services/api';
import { Staff } from '@/types';
import { Colors } from '@/constants/Colors';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { LogOut, Star, Award, Shield, Mail } from 'lucide-react-native';

export default function StaffProfile() {
    const router = useRouter();
    const [staff, setStaff] = useState<Staff | null>(null);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const loadProfile = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
            setUserEmail(user.email);
            const s = await Api.getStaffByEmail(user.email);
            setStaff(s);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/auth/login');
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={Colors.light.rose500} />
                    <Text style={{ marginTop: 16 }}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!staff) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>Unable to load staff profile.</Text>
                    <Text style={styles.subText}>Logged in as: {userEmail}</Text>
                    <Button onPress={handleLogout} variant="outline">Sign Out</Button>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Avatar src={staff.avatarUrl} size="lg" />
                        <View style={styles.onlineBadge} />
                    </View>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <Text style={styles.staffRank}>{staff.rank}</Text>

                    <View style={styles.ratingBadge}>
                        <Star size={14} color="#b45309" fill="#b45309" />
                        <Text style={styles.ratingText}>{staff.rating.toFixed(1)} Rating</Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>142</Text>
                        <Text style={styles.statLabel}>Total Appts</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>98%</Text>
                        <Text style={styles.statLabel}>Completion</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>4.8</Text>
                        <Text style={styles.statLabel}>Avg Rating</Text>
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>STAFF DETAILS</Text>
                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Mail size={16} color={Colors.light.rose500} />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{userEmail}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Shield size={16} color={Colors.light.rose500} />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Role ID</Text>
                            <Text style={styles.infoValue}>{staff.id}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Award size={16} color={Colors.light.rose500} />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Specialization</Text>
                            <Text style={styles.infoValue}>Hair Styling & Treatment</Text>
                        </View>
                    </View>
                </View>

                <Button
                    variant="secondary"
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <LogOut size={16} color={Colors.light.rose500} />
                        <Text style={{ color: Colors.light.rose500, fontWeight: '700' }}>Sign Out</Text>
                    </View>
                </Button>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 16, paddingBottom: 130 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
    errorText: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
    subText: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
    header: { alignItems: 'center', marginBottom: 24 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
    staffName: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 4 }, // 24 -> 20
    staffRank: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    ratingText: { fontSize: 12, fontWeight: '700', color: '#b45309' },
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statCard: { flex: 1, alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6' },
    statValue: { fontSize: 18, fontWeight: '900', color: Colors.light.rose500, marginBottom: 4 }, // 20 -> 18
    statLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', marginBottom: 16, letterSpacing: 1 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ffe4e6', alignItems: 'center', justifyContent: 'center' },
    infoLabel: { fontSize: 10, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' },
    infoValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
    logoutBtn: { backgroundColor: '#fff', borderColor: '#ffe4e6' },
});
