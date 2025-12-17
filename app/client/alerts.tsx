import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Api } from '@/services/api';
import { Notification, Receipt } from '@/types';
import { Colors } from '@/constants/Colors';
import { ReceiptCard } from '@/components/ReceiptCard';
import {
    Bell,
    Calendar,
    MessageSquare,
    Tag,
    Info,
    ChevronRight,
    X,
    Clock,
    FileText,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/Button';

// Extended Notification Type to include review details if needed
interface ExtendedNotification extends Notification {
    data?: any; // For flexible payload
}

type NotificationType = Notification['type'];

const TABS = [
    { id: 'all', label: 'All' },
    { id: 'reminder', label: 'Reminders' },
    { id: 'booking', label: 'Bookings' },
    { id: 'review', label: 'Reviews' },
    { id: 'promo', label: 'Offers' }
];

export default function ClientAlerts() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    const [activeTab, setActiveTab] = useState('all');
    const [notifications, setNotifications] = useState<ExtendedNotification[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [receiptModalVisible, setReceiptModalVisible] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

    const [replyModalVisible, setReplyModalVisible] = useState(false);
    const [selectedReviewReply, setSelectedReviewReply] = useState<{ review: string, reply: string } | null>(null);

    // Reminder Modal
    const [reminderModalVisible, setReminderModalVisible] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState<ExtendedNotification | null>(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const data = await Api.getUserNotifications(user.id);
            setNotifications(data);
        }
        setLoading(false);
    };

    const handleMarkAllRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Mark all as read locally
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            // Optionally call API to mark all as read
            for (const notif of notifications.filter(n => !n.read)) {
                await Api.markNotificationRead(notif.id);
            }
        }
    };

    const handleNotificationClick = async (notif: ExtendedNotification) => {
        // Mark as read
        if (!notif.read) {
            await Api.markNotificationRead(notif.id);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        }

        if (notif.type === 'booking' || notif.type === 'receipt') {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // If the notification data contains the full receipt object (from createAppointment)
                if (notif.data && notif.data.paymentMethod) {
                    setSelectedReceipt(notif.data);
                    setReceiptModalVisible(true);
                    return;
                }

                // Fetch receipt
                const receipts = await Api.getUserReceipts(user.id);

                // Try to match specific receipt
                const targetId = notif.data?.appointmentId || notif.data?.receiptId;
                let r = receipts.find((x: Receipt) => x.appointmentId === targetId || x.id === targetId);

                // Fallback: If no ID found, just show the latest one for demo purposes if it's a booking notif
                if (!r && receipts.length > 0) {
                    r = receipts[0];
                }

                if (r) {
                    setSelectedReceipt(r);
                    setReceiptModalVisible(true);
                }
            }
        }
        else if (notif.type === 'review') {
            // Mock data for review reply since it might not be in the notification object fully
            // In a real app, 'data' field would contain the message
            setSelectedReviewReply({
                review: notif.data?.originalComment || "Bad Service. How come you can open a salon ah?",
                reply: notif.message.replace('The salon management replied: ', '').replace(/^"|"$/g, '')
            });
            setReplyModalVisible(true);
        }
        else if (notif.type === 'reminder') {
            setSelectedReminder(notif);
            setReminderModalVisible(true);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'all') return true;
        if (activeTab === 'booking') return n.type === 'booking' || n.type === 'receipt' || n.type === 'info';
        return n.type === activeTab;
    });

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'booking':
            case 'receipt': return <FileText size={20} color="#16a34a" />;
            case 'reminder': return <Bell size={20} color="#eab308" />;
            case 'review': return <MessageSquare size={20} color="#9333ea" />;
            case 'promo': return <Tag size={20} color="#ef4444" />;
            default: return <Info size={20} color="#3b82f6" />;
        }
    };

    const getBgColor = (type: NotificationType) => {
        switch (type) {
            case 'booking':
            case 'receipt': return '#dcfce7';
            case 'reminder': return '#fef9c3';
            case 'review': return '#f3e8ff';
            case 'promo': return '#fee2e2';
            default: return '#dbeafe';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: isDark ? colors.text900 : '#111827' }]}>Alerts</Text>
                {notifications.some(n => !n.read) && (
                    <TouchableOpacity onPress={handleMarkAllRead} style={[styles.markAllBtn, { backgroundColor: isDark ? colors.bgCard : '#fff', borderColor: isDark ? colors.border : '#e5e7eb' }]}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#9ca3af' : '#374151' }}>Mark All Read</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tab,
                                activeTab === tab.id ? styles.tabActive : styles.tabInactive,
                                activeTab === tab.id ? { backgroundColor: colors.accent } : { backgroundColor: isDark ? colors.bgCard : '#f3f4f6' }
                            ]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === tab.id ? { color: '#fff', fontWeight: '700' } : { color: '#6b7280' }
                            ]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {loading ? <ActivityIndicator color={colors.accent} /> : (
                    filteredNotifications.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingTop: 60 }}>
                            <Bell size={48} color="#d1d5db" />
                            <Text style={{ marginTop: 16, color: '#9ca3af' }}>No notifications yet</Text>
                        </View>
                    ) : (
                        filteredNotifications.map(notif => (
                            <TouchableOpacity
                                key={notif.id}
                                style={[
                                    styles.card,
                                    { backgroundColor: isDark ? colors.bgCard : '#fff', borderColor: isDark ? colors.border : '#e5e7eb' },
                                    !notif.read && { borderColor: colors.accent }
                                ]}
                                onPress={() => handleNotificationClick(notif)}
                            >
                                <View style={[styles.iconBox, { backgroundColor: getBgColor(notif.type) }]}>
                                    {getIcon(notif.type)}
                                </View>
                                <View style={{ flex: 1, gap: 4 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={[styles.notifTitle, { color: isDark ? colors.text900 : '#111827' }]}>{notif.title}</Text>
                                        <Text style={styles.timeAgo}>{notif.date}</Text>
                                    </View>
                                    <Text style={styles.notifMsg} numberOfLines={2}>{notif.message}</Text>

                                    {/* Actions */}
                                    {(notif.type === 'booking' || notif.type === 'receipt') && (
                                        <TouchableOpacity onPress={() => handleNotificationClick(notif)} style={styles.actionLink}>
                                            <Text style={[styles.actionText, { color: colors.accent }]}>View Receipt</Text>
                                            <ChevronRight size={14} color={colors.accent} />
                                        </TouchableOpacity>
                                    )}
                                    {notif.type === 'review' && (
                                        <TouchableOpacity onPress={() => handleNotificationClick(notif)} style={styles.actionLink}>
                                            <Text style={[styles.actionText, { color: '#9333ea' }]}>See Reply</Text>
                                            <ChevronRight size={14} color="#9333ea" />
                                        </TouchableOpacity>
                                    )}
                                    {notif.type === 'reminder' && (
                                        <TouchableOpacity onPress={() => handleNotificationClick(notif)} style={styles.actionLink}>
                                            <Text style={[styles.actionText, { color: '#eab308' }]}>Check Details</Text>
                                            <ChevronRight size={14} color="#eab308" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))
                    )
                )}
            </ScrollView>

            {/* Receipt Modal */}
            <Modal visible={receiptModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? colors.bgCard : '#fff', height: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <View />
                            <TouchableOpacity onPress={() => setReceiptModalVisible(false)} style={styles.closeBtn}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            {selectedReceipt && <ReceiptCard receipt={selectedReceipt} />}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Review Reply Modal */}
            <Modal visible={replyModalVisible} transparent animationType="fade">
                <View style={[styles.modalOverlay, { justifyContent: 'center', padding: 24 }]}>
                    <View style={[styles.dialogContent, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#fff' : '#111827' }}>Admin Response</Text>
                            <TouchableOpacity onPress={() => setReplyModalVisible(false)}>
                                <X size={20} color={isDark ? '#d1d5db' : '#6b7280'} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>YOUR REVIEW</Text>
                            <Text style={{ fontSize: 14, fontStyle: 'italic', color: isDark ? '#d1d5db' : '#4b5563' }}>"{selectedReviewReply?.review}"</Text>
                        </View>

                        <View style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6', padding: 16, borderRadius: 12, marginBottom: 24 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>MESSAGE</Text>
                            <Text style={{ fontSize: 14, color: isDark ? '#fff' : '#111827' }}>"{selectedReviewReply?.reply}"</Text>
                        </View>

                        <Button onPress={() => setReplyModalVisible(false)} style={{ width: '100%', backgroundColor: colors.accent }}>
                            Close
                        </Button>
                    </View>
                </View>
            </Modal>

            {/* Reminder Modal */}
            <Modal visible={reminderModalVisible} transparent animationType="fade">
                <View style={[styles.modalOverlay, { justifyContent: 'center', padding: 24 }]}>
                    <View style={[styles.dialogContent, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, backgroundColor: '#eab308', borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 8 }}>
                            <View style={{ width: 48, height: 48, backgroundColor: isDark ? 'rgba(234, 179, 8, 0.2)' : '#fef9c3', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                                <Clock size={24} color="#eab308" />
                            </View>
                            <TouchableOpacity onPress={() => setReminderModalVisible(false)} style={{ padding: 8, backgroundColor: isDark ? '#374151' : '#f3f4f6', borderRadius: 20 }}>
                                <X size={20} color={isDark ? '#d1d5db' : '#6b7280'} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ fontSize: 24, fontWeight: '900', color: isDark ? '#fff' : '#111827', marginBottom: 8 }}>Upcoming!</Text>
                        <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: 24 }}>
                            This is a friendly reminder for your appointment tomorrow.
                        </Text>

                        <View style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6', padding: 16, borderRadius: 16, marginBottom: 24 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <Calendar size={18} color={colors.accent} />
                                <Text style={{ fontWeight: '700', color: isDark ? '#fff' : '#111827' }}>Tomorrow, 10:00 AM</Text>
                            </View>
                            <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280', marginLeft: 30 }}>Please arrive 10 minutes early.</Text>
                        </View>

                        <Button onPress={() => setReminderModalVisible(false)} style={{ width: '100%', backgroundColor: '#eab308' }}>
                            Got it
                        </Button>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: '900' },
    markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    tabsContainer: { marginBottom: 16 },
    tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 0 },
    tabActive: {},
    tabInactive: {},
    tabText: { fontSize: 12 },
    list: { padding: 16, gap: 8 },
    card: { flexDirection: 'row', padding: 12, borderRadius: 12, borderWidth: 1, gap: 12 },
    iconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    notifTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
    timeAgo: { fontSize: 10, color: '#9ca3af' },
    notifMsg: { fontSize: 12, color: '#6b7280' },
    actionLink: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    actionText: { fontSize: 12, fontWeight: '700', color: Colors.light.rose500 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
    dialogContent: { padding: 24, borderRadius: 24, width: '100%' }
});
