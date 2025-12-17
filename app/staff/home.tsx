import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Api } from '@/services/api';
import { Appointment, Staff } from '@/types';
import { Colors } from '@/constants/Colors';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Calendar, CheckCircle, Clock, Tag } from 'lucide-react-native';

export default function StaffHome() {
    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState<Staff | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        // Process background tasks
        await Promise.all([
            Api.processAbsences(),
            Api.processCompletions(), // New
            Api.checkReminders()
        ]);

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
            const s = await Api.getStaffByEmail(user.email);
            if (s) {
                setStaff(s);
                const appts = await Api.getStaffAppointments(s.id);
                // Filter and sort per React DOM logic
                const sorted = appts
                    .filter(a => a.status !== 'cancelled')
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setAppointments(sorted);
            }
        }
        setLoading(false);
    };

    const activeAppts = appointments.filter(a =>
        ['confirmed', 'checked-in', 'absence'].includes(a.status)
    );

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const isToday = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    };

    const renderAppointment = (appt: Appointment) => {
        const today = isToday(appt.date);
        const dateObj = new Date(appt.date);
        const month = dateObj.toLocaleDateString('en-GB', { month: 'short' });
        const day = dateObj.getDate();

        return (
            <View key={appt.id} style={styles.card}>
                <View style={styles.badgeContainer}>
                    <Badge status={appt.status} />
                </View>

                <View style={styles.cardContent}>
                    {/* Date Box */}
                    <View style={[styles.dateBox, today ? styles.dateBoxToday : styles.dateBoxNormal]}>
                        <Text style={[styles.dateMonth, today ? styles.textWhite : styles.textDark]}>{month}</Text>
                        <Text style={[styles.dateDay, today ? styles.textWhite : styles.textDark]}>{day}</Text>
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.customerName}>{appt.customerName || 'Walk-In'}</Text>
                        <View style={styles.metaRow}>
                            <Clock size={12} color="#6b7280" />
                            <Text style={styles.metaText}>
                                {formatTime(appt.date)} {appt.duration ? `(${appt.duration} mins)` : ''}
                            </Text>
                        </View>
                        {appt.serviceName && (
                            <View style={styles.serviceTag}>
                                <Tag size={12} color={Colors.light.rose500} />
                                <Text style={styles.serviceText}>{appt.serviceName}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.refLabel}>REF ID</Text>
                        <Text style={styles.refValue}>{appt.id}</Text>
                    </View>
                    {(appt.status === 'confirmed' || appt.status === 'checked-in') && (
                        <View style={[styles.statusIcon, appt.status === 'checked-in' ? styles.bgBlue : styles.bgGreen]}>
                            <CheckCircle size={16} color={appt.status === 'checked-in' ? '#2563eb' : '#16a34a'} />
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.portalLabel}>STYLIST PORTAL</Text>
                        <Text style={styles.welcomeText}>Hello, {staff?.name?.split(' ')[0] || 'Staff'}</Text>
                    </View>
                    <Avatar src={staff?.avatarUrl} size="md" />
                </View>

                {/* Title Row */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{activeAppts.length} Active</Text>
                    </View>
                </View>

                {/* List */}
                {activeAppts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Calendar size={48} color="#d1d5db" />
                        <Text style={styles.emptyText}>No active appointments.</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {activeAppts.map(renderAppointment)}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    // Compacted Padding (24 -> 16)
    scrollContent: { padding: 16, paddingBottom: 130 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    portalLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 },
    welcomeText: { fontSize: 20, fontWeight: '900', color: '#111827' }, // 24 -> 20
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' }, // 18 -> 16
    countBadge: { backgroundColor: '#ffe4e6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    countText: { fontSize: 10, fontWeight: '700', color: Colors.light.rose500 },
    emptyState: { padding: 32, alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 24, borderWidth: 1, borderColor: '#f3f4f6' },
    emptyText: { color: '#6b7280', fontWeight: '500', marginTop: 16 },
    list: { gap: 12 },
    // Compact Card
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    badgeContainer: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
    cardContent: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    dateBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, // 56 -> 48
    dateBoxToday: { backgroundColor: Colors.light.rose500 },
    dateBoxNormal: { backgroundColor: '#f3f4f6' },
    textWhite: { color: '#fff' },
    textDark: { color: '#111827' },
    dateMonth: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    dateDay: { fontSize: 18, fontWeight: '900', lineHeight: 18 }, // 20 -> 18
    customerName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 }, // 18 -> 16
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, fontWeight: '500', color: '#6b7280' },
    serviceTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    serviceText: { fontSize: 10, fontWeight: '700', color: Colors.light.rose500, textTransform: 'uppercase' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#f3f4f6' },
    refLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' },
    refValue: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace', color: '#111827' },
    statusIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    bgBlue: { backgroundColor: '#dbeafe' },
    bgGreen: { backgroundColor: '#dcfce7' },
});
