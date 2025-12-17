import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { Api } from '@/services/api';
import { supabase } from '@/services/supabase';
import { Appointment, Service, Staff, AppointmentStatus } from '@/types';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Calendar, Clock, CreditCard, Hash, X, Star, AlertTriangle, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getRankSurcharge, formatSGDate } from '@/utils/helpers';

// --- Custom Calendar Component ---
const CustomCalendar = ({ selectedDate, onSelectDate, isDark, colors }: any) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentMonth(newDate);
    };

    const renderDays = () => {
        const slots = [];
        for (let i = 0; i < firstDay; i++) {
            slots.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
        }
        for (let i = 1; i <= days; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const dateStr = date.toLocaleDateString('en-CA');
            const isSelected = selectedDate === dateStr;
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

            slots.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.calendarDay,
                        isSelected && { backgroundColor: Colors.light.rose500 },
                        isPast && { opacity: 0.3 }
                    ]}
                    disabled={isPast}
                    onPress={() => onSelectDate(dateStr)}
                >
                    <Text style={[
                        styles.calendarDayText,
                        { color: isDark ? colors.text900 : '#111827' },
                        isSelected && { color: '#fff' }
                    ]}>{i}</Text>
                </TouchableOpacity>
            );
        }
        return slots;
    };

    return (
        <View style={[styles.calendarContainer, { borderColor: isDark ? colors.border : '#e5e7eb' }]}>
            <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => changeMonth(-1)}><ChevronLeft size={20} color={isDark ? colors.text900 : '#000'} /></TouchableOpacity>
                <Text style={[styles.calendarTitle, { color: isDark ? colors.text900 : '#000' }]}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</Text>
                <TouchableOpacity onPress={() => changeMonth(1)}><ChevronRight size={20} color={isDark ? colors.text900 : '#000'} /></TouchableOpacity>
            </View>
            <View style={styles.weekRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <Text key={i} style={styles.weekDayText}>{d}</Text>
                ))}
            </View>
            <View style={styles.daysGrid}>{renderDays()}</View>
        </View>
    );
};

export default function MyBookings() {
    const router = useRouter();
    const navigation = useNavigation();

    // Hide tab bar on this screen
    useFocusEffect(
        useCallback(() => {
            navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
        }, [navigation])
    );

    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

    // Reschedule Logic
    const [newDate, setNewDate] = useState('');
    const [newStaffId, setNewStaffId] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState('');

    // Review Logic
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    // Load data on screen focus
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const [s, st] = await Promise.all([
                Api.getServices(),
                Api.getStaff(),
            ]);

            let apps: Appointment[] = [];
            if (user) {
                apps = await Api.getUserAppointments(user.id);
            }

            setAppointments(apps);
            setServices(s);
            setStaffList(st);
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getService = (id: string) => services.find(s => s.id === id);
    const getStaff = (id: string) => staffList.find(s => s.id === id);

    // Format date as DD/MM/YYYY
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Format time as HH:MM AM/PM
    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // --- Actions ---
    const initiateReschedule = (appt: Appointment) => {
        setSelectedAppt(appt);
        setNewDate(appt.date.split('T')[0]);
        setNewStaffId(appt.staffId);
        setSelectedSlot(appt.date.split('T')[1]?.substring(0, 5) || '10:00');
        setRescheduleModalVisible(true);
        checkAvailability(appt.date.split('T')[0], appt.staffId);
    };

    const checkAvailability = async (date: string, staffId: string) => {
        const slots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        setAvailableSlots(slots);
    };

    const handleReschedule = async () => {
        if (!selectedAppt || !newDate || !newStaffId || !selectedSlot) return;
        const res = await Api.rescheduleAppointment(selectedAppt.dbId || selectedAppt.id, `${newDate}T${selectedSlot}`, newStaffId);
        if (res) {
            Alert.alert("Success", "Appointment rescheduled successfully!");
            setRescheduleModalVisible(false);
            loadData();
        } else {
            Alert.alert("Error", "Failed to reschedule. Slot might be taken.");
        }
    };

    const initiateCancel = (appt: Appointment) => {
        setSelectedAppt(appt);
        setCancelModalVisible(true);
    };

    const handleCancel = async () => {
        if (!selectedAppt) return;
        const success = await Api.cancelAppointment(selectedAppt.dbId || selectedAppt.id);
        if (success) {
            Alert.alert("Success", "Appointment cancelled.");
            setCancelModalVisible(false);
            loadData();
        } else {
            Alert.alert("Error", "Failed to cancel appointment.");
        }
    };

    const initiateReview = (appt: Appointment) => {
        setSelectedAppt(appt);
        setRating(0);
        setComment('');
        setReviewModalVisible(true);
    };

    const handleSubmitReview = async () => {
        if (!selectedAppt || rating === 0) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const success = await Api.submitReview(selectedAppt.dbId || selectedAppt.id, rating, comment, user.id);
        if (success) {
            Alert.alert("Thank You!", "Review submitted. You earned a RM5 voucher!");
            setReviewModalVisible(false);
            loadData();
        } else {
            Alert.alert("Error", "Failed to submit review.");
        }
    };

    // Sort appointments
    const upcomingAppointments = appointments
        .filter(a => ['confirmed', 'pending', 'checked-in'].includes(a.status) && new Date(a.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pastAppointments = appointments
        .filter(a => {
            const apptDate = new Date(a.date);
            const now = new Date();
            const diffDays = (now.getTime() - apptDate.getTime()) / (1000 * 3600 * 24);
            if (a.status === 'completed') return diffDays <= 7;
            if (a.status === 'cancelled') return diffDays <= 1;
            return apptDate <= now;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Render appointment card matching React DOM design
    const renderAppointmentCard = (appt: Appointment) => {
        const service = getService(appt.serviceId);
        const staff = getStaff(appt.staffId);
        const isUpcoming = new Date(appt.date) > new Date() && appt.status !== 'cancelled' && appt.status !== 'completed';
        const isCompleted = appt.status === 'completed';
        const isCancelled = appt.status === 'cancelled';
        const reschedules = appt.rescheduleCount || 0;
        const isRescheduleLocked = reschedules >= 3;
        const isCheckedIn = appt.status === 'checked-in';

        const surcharge = staff ? getRankSurcharge(staff.rank) : 0;
        const totalPrice = appt.pricePaid !== undefined ? appt.pricePaid : (service?.priceCents || 0) + surcharge;

        // QR Code URL - using simple data for reliability
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${appt.id}`;

        return (
            <Card key={appt.id} style={[styles.bookingCard, { backgroundColor: isDark ? colors.bgCard : '#fff' }]}>
                {/* Card Header: Date & Status */}
                <View style={[styles.cardHeader, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fdf2f4', borderBottomColor: isDark ? colors.border : '#fce7eb' }]}>
                    <View style={styles.dateRow}>
                        <Calendar size={16} color={Colors.light.rose500} />
                        <Text style={[styles.dateText, { color: isDark ? colors.text900 : '#1f2937' }]}>{formatDate(appt.date)}</Text>
                    </View>
                    <Badge status={appt.status} />
                </View>

                {/* Card Body */}
                <View style={styles.cardBody}>
                    {/* Service & Ref ID */}
                    <View style={styles.serviceRow}>
                        <Text style={[styles.serviceName, { color: isDark ? colors.text900 : Colors.light.rose700 }]}>{service?.name || 'Unknown Service'}</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.refLabel}>REF ID</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                <Hash size={12} color={Colors.light.rose400} />
                                <Text style={[styles.refValue, { color: isDark ? colors.text900 : '#111827' }]}>{appt.id}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Stylist Row */}
                    <View style={styles.stylistRow}>
                        <Avatar src={staff?.avatarUrl} size="sm" />
                        <View>
                            <Text style={styles.stylistLabel}>STYLIST</Text>
                            <Text style={[styles.stylistName, { color: isDark ? colors.text900 : '#111827' }]}>{staff?.name || 'Staff'}</Text>
                        </View>
                    </View>

                    {/* Details Grid & QR Code */}
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailsCol}>
                            {/* Time Box */}
                            <View style={[styles.detailBox, { backgroundColor: isDark ? colors.bgSecondary : '#f9fafb', borderColor: isDark ? colors.border : '#f3f4f6' }]}>
                                <View style={styles.detailHeader}>
                                    <Clock size={14} color="#6b7280" />
                                    <Text style={styles.detailLabel}>Time</Text>
                                </View>
                                <Text style={[styles.detailValue, { color: isDark ? colors.text900 : '#111827' }]}>{formatTime(appt.date)}</Text>
                            </View>

                            {/* Amount Box */}
                            <View style={[styles.detailBox, { backgroundColor: isDark ? colors.bgSecondary : '#f9fafb', borderColor: isDark ? colors.border : '#f3f4f6' }]}>
                                <View style={styles.detailHeader}>
                                    <CreditCard size={14} color="#6b7280" />
                                    <Text style={styles.detailLabel}>Total Amount</Text>
                                </View>
                                <Text style={[styles.detailValue, { color: isDark ? colors.text900 : '#111827' }]}>RM {(totalPrice / 100).toFixed(2)}</Text>
                            </View>
                        </View>

                        {/* QR Code Box */}
                        <View style={[styles.qrBox, { borderColor: isDark ? colors.border : '#e5e7eb' }]}>
                            <Image
                                source={{ uri: qrUrl }}
                                style={styles.qrImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.qrId}>{appt.id}</Text>
                            <Text style={styles.qrHint}>Scan at reception</Text>
                        </View>
                    </View>

                    {/* Reschedule Info */}
                    {isUpcoming && (
                        <View style={styles.statusIndicator}>
                            <View style={[styles.statusDot, { backgroundColor: (isRescheduleLocked || isCheckedIn) ? '#ef4444' : '#22c55e' }]} />
                            <Text style={styles.statusText}>
                                {isCheckedIn
                                    ? 'Checked-in (Actions Locked)'
                                    : isRescheduleLocked
                                        ? 'Max reschedules reached'
                                        : `${3 - reschedules} reschedules remaining`
                                }
                            </Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    {isUpcoming && (
                        <View style={styles.actionRow}>
                            <Button
                                variant="outline"
                                disabled={isRescheduleLocked || isCheckedIn}
                                style={[styles.actionBtn, { borderColor: isDark ? colors.border : '#e5e7eb', backgroundColor: isDark ? 'transparent' : '#fff', opacity: (isRescheduleLocked || isCheckedIn) ? 0.5 : 1 }]}
                                textStyle={{ color: isDark ? colors.text900 : '#374151', fontSize: 14 }}
                                onPress={() => initiateReschedule(appt)}
                            >
                                {isCheckedIn ? 'Checked In' : isRescheduleLocked ? 'Locked' : 'Reschedule'}
                            </Button>
                            <Button
                                variant="outline"
                                disabled={isCheckedIn}
                                style={[styles.actionBtn, { borderColor: '#fee2e2', backgroundColor: '#fff5f5', opacity: isCheckedIn ? 0.5 : 1 }]}
                                textStyle={{ color: '#ef4444', fontSize: 14 }}
                                onPress={() => initiateCancel(appt)}
                            >
                                Cancel
                            </Button>
                        </View>
                    )}

                    {/* Review Button */}
                    {isCompleted && !appt.reviewed && (
                        <View style={{ marginTop: 16 }}>
                            <Button onPress={() => initiateReview(appt)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Star size={16} color="#fff" fill="#fff" />
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>Write a Review & Get RM5</Text>
                                </View>
                            </Button>
                        </View>
                    )}

                    {/* Reviewed Status */}
                    {isCompleted && appt.reviewed && (
                        <View style={[styles.statusBanner, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4', borderColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#bbf7d0' }]}>
                            <Text style={[styles.statusBannerText, { color: '#16a34a' }]}>Review Submitted</Text>
                        </View>
                    )}

                    {/* Cancelled Status */}
                    {isCancelled && (
                        <View style={[styles.statusBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fecaca' }]}>
                            <Text style={[styles.statusBannerText, { color: '#ef4444' }]}>CANCELLED</Text>
                        </View>
                    )}
                </View>
            </Card>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.rose500} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text900} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text900 }]}>My Bookings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Upcoming Section */}
                {upcomingAppointments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>UPCOMING</Text>
                        {upcomingAppointments.map(renderAppointmentCard)}
                    </View>
                )}

                {/* History Section */}
                {pastAppointments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>HISTORY</Text>
                        {pastAppointments.map(renderAppointmentCard)}
                    </View>
                )}

                {/* Empty State */}
                {upcomingAppointments.length === 0 && pastAppointments.length === 0 && (
                    <View style={styles.emptyState}>
                        <Calendar size={48} color="#d1d5db" />
                        <Text style={styles.emptyText}>No bookings found.</Text>
                        <Button onPress={() => router.push('/client/book_appointment')} style={{ marginTop: 16 }}>
                            Book Now
                        </Button>
                    </View>
                )}
            </ScrollView>

            {/* Reschedule Modal */}
            <Modal visible={rescheduleModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? colors.bgCard : '#fff' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: isDark ? colors.text900 : '#000' }]}>Reschedule</Text>
                            <TouchableOpacity onPress={() => setRescheduleModalVisible(false)}><X size={20} color={isDark ? colors.text600 : '#6b7280'} /></TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 400 }}>
                            <Text style={[styles.label, { color: isDark ? colors.text600 : '#374151' }]}>Select New Date</Text>
                            <CustomCalendar selectedDate={newDate} onSelectDate={(d: string) => { setNewDate(d); checkAvailability(d, newStaffId); }} isDark={isDark} colors={colors} />
                            <Text style={[styles.label, { color: isDark ? colors.text600 : '#374151', marginTop: 16 }]}>Select Staff</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {staffList.map(s => (
                                    <TouchableOpacity key={s.id} style={[styles.chip, newStaffId === s.id && styles.chipActive]} onPress={() => { setNewStaffId(s.id); checkAvailability(newDate, s.id); }}>
                                        <Text style={[styles.chipText, newStaffId === s.id && styles.chipTextActive]}>{s.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <Text style={[styles.label, { color: isDark ? colors.text600 : '#374151', marginTop: 16 }]}>Available Slots</Text>
                            <View style={styles.slotsGrid}>
                                {availableSlots.map(slot => (
                                    <TouchableOpacity key={slot} style={[styles.slot, selectedSlot === slot && { backgroundColor: Colors.light.rose500, borderColor: Colors.light.rose500 }]} onPress={() => setSelectedSlot(slot)}>
                                        <Text style={[styles.slotText, selectedSlot === slot && { color: '#fff' }]}>{slot}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                        <Button style={{ marginTop: 24 }} onPress={handleReschedule} disabled={!newDate || !newStaffId || !selectedSlot}>Confirm Reschedule</Button>
                    </View>
                </View>
            </Modal>

            {/* Cancel Modal */}
            <Modal visible={cancelModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? colors.bgCard : '#fff' }]}>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <View style={styles.warningIcon}><AlertTriangle size={24} color="#ef4444" /></View>
                            <Text style={[styles.modalTitle, { color: isDark ? colors.text900 : '#000' }]}>Cancel Appointment?</Text>
                            <Text style={[styles.modalSubtitle, { color: isDark ? colors.text600 : '#6b7280' }]}>This action cannot be undone.</Text>
                        </View>
                        <View style={[styles.warningBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#fecaca' }]}>
                            <Text style={styles.warningText}><Text style={{ fontWeight: 'bold' }}>Cancellation Policy:</Text> Cancellations within 3 days are non-refundable. Otherwise, 80% refunded.</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                            <Button variant="outline" style={{ flex: 1, borderColor: isDark ? colors.border : '#e5e7eb' }} textStyle={{ color: isDark ? colors.text900 : '#374151' }} onPress={() => setCancelModalVisible(false)}>Keep it</Button>
                            <Button style={{ flex: 1, backgroundColor: '#ef4444' }} onPress={handleCancel}>Yes, Cancel</Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Review Modal */}
            <Modal visible={reviewModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? colors.bgCard : '#fff' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: isDark ? colors.text900 : '#000' }]}>Write a Review</Text>
                            <TouchableOpacity onPress={() => setReviewModalVisible(false)}><X size={20} color={isDark ? colors.text600 : '#6b7280'} /></TouchableOpacity>
                        </View>
                        <View style={{ alignItems: 'center', marginVertical: 24, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                    <Star size={32} color={star <= rating ? '#fbbf24' : (isDark ? '#404040' : '#d1d5db')} fill={star <= rating ? '#fbbf24' : 'transparent'} />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={[styles.label, { color: isDark ? colors.text600 : '#374151' }]}>Comment</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? colors.bgSecondary : '#fff', borderColor: isDark ? colors.border : '#e5e7eb', color: isDark ? colors.text900 : '#000' }]}
                            multiline numberOfLines={4} placeholder="Tell us about your experience..." placeholderTextColor={isDark ? '#525252' : '#9ca3af'} value={comment} onChangeText={setComment}
                        />
                        <Button style={{ marginTop: 24 }} onPress={handleSubmitReview} disabled={rating === 0}>Submit & Get RM5</Button>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 12, paddingTop: 45, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1 },
    backButton: { padding: 6, marginLeft: -6, borderRadius: 16 },
    title: { fontSize: 18, fontWeight: '700' },
    content: { padding: 12, paddingBottom: 80 },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 10, fontWeight: '700', color: '#6b7280', marginBottom: 8, letterSpacing: 1 },

    // Booking Card Styles - Compact
    bookingCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#fce7eb' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 12, fontWeight: '700' },
    cardBody: { padding: 12 },
    serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    serviceName: { fontSize: 16, fontWeight: '800' },
    refLabel: { fontSize: 8, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
    refValue: { fontSize: 10, fontWeight: '700', fontFamily: 'monospace' },
    stylistRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    stylistLabel: { fontSize: 8, fontWeight: '700', color: '#9ca3af', marginBottom: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
    stylistName: { fontSize: 12, fontWeight: '700' },

    // Details Grid - Compact
    detailsGrid: { flexDirection: 'row', gap: 8 },
    detailsCol: { flex: 1, gap: 8 },
    detailBox: { padding: 10, borderRadius: 10, borderWidth: 1 },
    detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    detailLabel: { fontSize: 10, color: '#6b7280', fontWeight: '500' },
    detailValue: { fontSize: 13, fontWeight: '700' },

    // QR Box - Compact
    qrBox: { width: 100, backgroundColor: '#fff', padding: 6, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    qrImage: { width: 60, height: 60, marginBottom: 4 },
    qrId: { fontSize: 7, fontWeight: '700', color: '#6b7280', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 },
    qrHint: { fontSize: 7, color: '#9ca3af', textAlign: 'center', marginTop: 1 },

    // Status Indicator - Compact
    statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, color: '#6b7280' },

    // Action Buttons - Compact
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flex: 1 },

    // Status Banners - Compact
    statusBanner: { marginTop: 10, padding: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
    statusBannerText: { fontSize: 10, fontWeight: '700' },

    // Empty State
    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#6b7280', fontSize: 14, marginTop: 12, marginBottom: 6 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
    modalContent: { borderRadius: 20, padding: 20, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    modalSubtitle: { fontSize: 12, textAlign: 'center', marginTop: 4 },
    label: { fontSize: 10, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { borderWidth: 1, borderRadius: 10, padding: 12, height: 80, textAlignVertical: 'top' },
    warningIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    warningBox: { padding: 12, borderRadius: 10, borderWidth: 1 },
    warningText: { fontSize: 11, color: '#ef4444', textAlign: 'center', lineHeight: 16 },

    // Calendar Styles - Compact
    calendarContainer: { borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 12 },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    calendarTitle: { fontSize: 12, fontWeight: '700' },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    weekDayText: { width: 28, textAlign: 'center', fontSize: 10, color: '#9ca3af', fontWeight: '700' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calendarDay: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
    calendarDayText: { fontSize: 11, fontWeight: '600' },

    // Chips & Slots - Compact
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#f3f4f6' },
    chipActive: { backgroundColor: Colors.light.rose500 },
    chipText: { fontSize: 11, color: '#374151', fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    slot: { width: '30%', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
    slotText: { fontSize: 11, fontWeight: '600', color: '#374151' },
});
