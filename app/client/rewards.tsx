import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { useFocusEffect, useRouter, useNavigation } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Api } from '@/services/api';
import { User, Reward } from '@/types';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Trophy, ScanLine, X, History, Ticket, Gift, TrendingUp, CheckCircle, Clock, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/contexts/ThemeContext';
import { RewardHistoryItem } from '@/types';
import { getTierInfo } from '@/utils/helpers';

// Rewards catalog matching React DOM version
const MOCK_REWARDS: Reward[] = [
    { id: 'r1', title: 'RM10 Voucher', description: 'RM10 off your next service.', cost: 500, type: 'voucher', value: 10, imageUrl: '', discountCents: 1000 },
    { id: 'r2', title: 'RM20 Voucher', description: 'RM20 off services over RM100.', cost: 1000, type: 'voucher', value: 20, imageUrl: '', discountCents: 2000 },
    { id: 'r3', title: 'RM50 Voucher', description: 'RM50 off any premium package.', cost: 2500, type: 'voucher', value: 50, imageUrl: '', discountCents: 5000 },
    { id: 'r4', title: '5% Off', description: '5% discount on total bill.', cost: 800, type: 'voucher', value: 5, imageUrl: '', discountCents: 0 },
    { id: 'r5', title: '10% Off', description: '10% discount on total bill.', cost: 1500, type: 'voucher', value: 10, imageUrl: '', discountCents: 0 },
    { id: 'r6', title: '20% Off', description: '20% off for VIP treatments.', cost: 3000, type: 'voucher', value: 20, imageUrl: '', discountCents: 0 },
];

export default function RewardsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const isDark = theme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;
    const navigation = useNavigation();

    const [user, setUser] = useState<User | null>(null);
    const [showQr, setShowQr] = useState(false);
    const [myVouchersOpen, setMyVouchersOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [redeemModalOpen, setRedeemModalOpen] = useState(false);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

    const [myVouchers, setMyVouchers] = useState<Reward[]>([]);
    const [history, setHistory] = useState<RewardHistoryItem[]>([]);

    useFocusEffect(
        useCallback(() => {
            navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
            loadData();
        }, [navigation])
    );

    const loadData = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const [p, v, h] = await Promise.all([
                Api.getUserProfile(authUser.id),
                Api.getUserVouchers(authUser.id),
                Api.getPointHistory(authUser.id)
            ]);
            if (p) setUser(p);
            setMyVouchers(v);
            setHistory(h);
        }
    };

    const handleClaim = (reward: Reward) => {
        if (!user) return;
        if (user.points < reward.cost) return;

        Alert.alert('Confirm Redemption', `Spend ${reward.cost} points for ${reward.title}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Redeem', onPress: () => processRedemption(reward) }
        ]);
    };

    const processRedemption = async (reward: Reward) => {
        if (!user) return;

        const success = await Api.redeemPointsForVoucher(user.id, reward);

        if (success) {
            setSelectedReward(reward);
            setRedeemModalOpen(true);
            loadData(); // Refresh points and vouchers
        } else {
            Alert.alert("Redemption Failed", "Something went wrong. Please try again.");
        }
    };

    if (!user) return <View style={styles.container} />;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
            <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text900} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text900 }]}>Rewards</Text>
                <TouchableOpacity style={[styles.historyBtn, { backgroundColor: isDark ? colors.bgCard : '#f3f4f6' }]} onPress={() => setHistoryOpen(true)}>
                    <History size={14} color="#6b7280" />
                    <Text style={styles.historyText}>History</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Tier Card (Flip Logic via simple conditional) */}
                <View style={styles.cardContainer}>
                    {!showQr ? (
                        (() => {
                            const tierInfo = getTierInfo(user.lifetimePoints);
                            // Map Tailwind gradient classes to RN colors
                            const gradientColors: { [key: string]: [string, string] } = {
                                'from-gray-300 to-gray-400': ['#d1d5db', '#9ca3af'],   // Silver
                                'from-yellow-400 to-yellow-600': ['#facc15', '#ca8a04'], // Gold
                                'from-slate-400 to-slate-600': ['#94a3b8', '#475569'],   // Platinum
                                'from-gray-800 to-black': ['#1f2937', '#000000'],        // Centurion
                            };
                            const colors = gradientColors[tierInfo.color] || ['#e11d48', '#be123c'];

                            return (
                                <LinearGradient colors={colors} style={styles.tierCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    <View style={styles.cardContent}>
                                        <View style={styles.trophyIcon}>
                                            <Trophy size={24} color="#fff" />
                                        </View>
                                        <Text style={styles.balanceLabel}>Current Balance</Text>
                                        <Text style={styles.balanceValue}>{user.points} pts</Text>
                                        <Text style={styles.tierLabel}>{tierInfo.current} Member Status</Text>

                                        <View style={styles.progressContainer}>
                                            <View style={styles.progressRow}>
                                                <Text style={styles.progressText}>
                                                    {tierInfo.next ? `Progress to ${tierInfo.next}` : 'Max Tier Reached'}
                                                </Text>
                                                <Text style={styles.progressText}>{user.lifetimePoints} / {tierInfo.nextThreshold}</Text>
                                            </View>
                                            <View style={styles.progressBarBg}>
                                                <View style={[styles.progressBarFill, { width: `${tierInfo.progress}%` }]} />
                                            </View>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.scanBtn} onPress={() => setShowQr(true)}>
                                        <ScanLine size={18} color="#fff" />
                                    </TouchableOpacity>
                                </LinearGradient>
                            );
                        })()
                    ) : (
                        <View style={[styles.qrCard, { backgroundColor: isDark ? '#fff' : '#fff' }]}>
                            <TouchableOpacity style={styles.closeQrBtn} onPress={() => setShowQr(false)}>
                                <X size={18} color="#6b7280" />
                            </TouchableOpacity>
                            <Text style={styles.qrTitle}>MEMBER ID</Text>
                            <Image
                                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MEMBER:${user.id}` }}
                                style={styles.qrImage}
                            />
                            <Text style={styles.qrCode}>{user.id.substring(0, 8).toUpperCase()}</Text>
                            <Text style={styles.qrHelp}>Scan at counter to earn points</Text>
                        </View>
                    )}
                </View>

                {/* My Vouchers Btn */}
                <Button
                    variant="secondary"
                    style={[styles.voucherBtn, { backgroundColor: isDark ? colors.bgCard : '#fff', borderColor: isDark ? colors.border : '#ffe4e6' }]}
                    onPress={() => setMyVouchersOpen(true)}
                >
                    <View style={styles.voucherBtnContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ticket size={18} color={colors.rose500} />
                            <Text style={[styles.voucherBtnText, { color: colors.rose500 }]}>My Vouchers</Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{myVouchers.length} Active</Text>
                        </View>
                    </View>
                </Button>

                {/* Catalog */}
                <Text style={[styles.sectionTitle, { color: isDark ? colors.text900 : '#111827' }]}>Redeem Rewards</Text>
                <View style={styles.grid}>
                    {MOCK_REWARDS.map(r => {
                        // Extract the main display text (e.g., "RM10" from "RM10 Voucher" or "5%" from "5% Off")
                        const mainText = r.title.split(' ')[0];

                        return (
                            <Card key={r.id} style={[styles.rewardCard, { backgroundColor: isDark ? colors.bgCard : '#ffffff' }]} noPadding>
                                <View style={styles.rewardImage}>
                                    <Text style={[styles.rewardImageText, { color: colors.rose500 }]}>{mainText}</Text>
                                    <Text style={styles.rewardImageType}>VOUCHER</Text>
                                    <View style={styles.costBadge}>
                                        <Text style={styles.costText}>{r.cost} pts</Text>
                                    </View>
                                </View>
                                <View style={styles.rewardContent}>
                                    <Text style={[styles.rewardTitle, { color: isDark ? colors.text900 : '#111827' }]} numberOfLines={2}>{r.title}</Text>
                                    <Text style={styles.rewardDesc} numberOfLines={2}>{r.description}</Text>
                                    <Button
                                        style={[styles.claimBtn, user.points < r.cost && styles.disabledBtn]}
                                        textStyle={{ fontSize: 10 }}
                                        onPress={() => handleClaim(r)}
                                        disabled={user.points < r.cost}
                                    >
                                        {user.points < r.cost ? 'Locked' : 'Claim'}
                                    </Button>
                                </View>
                            </Card>
                        );
                    })}
                </View>

            </ScrollView>

            {/* Vouchers Modal */}
            <Modal visible={myVouchersOpen} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? colors.bg : '#fff' }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: isDark ? colors.border : '#f3f4f6', borderBottomWidth: 1 }]}>
                        <Text style={[styles.modalTitle, { color: isDark ? colors.text900 : '#000' }]}>My Vouchers</Text>
                        <TouchableOpacity onPress={() => setMyVouchersOpen(false)}>
                            <X size={20} color={isDark ? colors.text900 : '#000'} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        {myVouchers.length === 0 ? (
                            <Text style={styles.emptyText}>No active vouchers.</Text>
                        ) : (
                            myVouchers.map((v, i) => (
                                <View key={i} style={[styles.voucherItem, { backgroundColor: isDark ? colors.bgCard : '#fff1f2', borderColor: isDark ? colors.border : '#ffe4e6' }]}>
                                    <View style={styles.voucherRow}>
                                        <Text style={[styles.voucherTitle, { color: colors.rose500 }]}>{v.title}</Text>
                                        <Text style={styles.activeTag}>ACTIVE</Text>
                                    </View>
                                    <Text style={[styles.voucherDesc, { color: isDark ? colors.text600 : '#4b5563' }]}>{v.description}</Text>
                                    <View style={styles.voucherMeta}>
                                        <Clock size={10} color={colors.rose500} />
                                        <Text style={[styles.expiryText, { color: colors.rose500 }]}>Expires: {v.expiryDate}</Text>
                                    </View>
                                    <View style={[styles.serialRow, { borderTopColor: isDark ? colors.border : '#fecdd3' }]}>
                                        <Text style={styles.serialLabel}>SERIAL</Text>
                                        <Text style={[styles.serialValue, { color: isDark ? colors.text900 : '#374151' }]}>{v.serialNumber}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* History Modal */}
            <Modal visible={historyOpen} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? colors.bg : '#fff' }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: isDark ? colors.border : '#f3f4f6', borderBottomWidth: 1 }]}>
                        <Text style={[styles.modalTitle, { color: isDark ? colors.text900 : '#000' }]}>Point History</Text>
                        <TouchableOpacity onPress={() => setHistoryOpen(false)}>
                            <X size={20} color={isDark ? colors.text900 : '#000'} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        {history.map((h, i) => (
                            <View key={i} style={[styles.historyItem, { borderBottomColor: isDark ? colors.border : '#f3f4f6' }]}>
                                <View style={styles.historyLeft}>
                                    <View style={[styles.historyIcon, h.type === 'earn' ? styles.bgGreen : styles.bgRose]}>
                                        {h.type === 'earn' ? <TrendingUp size={14} color="green" /> : <Gift size={14} color={colors.rose500} />}
                                    </View>
                                    <View>
                                        <Text style={[styles.historyTitle, { color: isDark ? colors.text900 : '#111827' }]}>{h.title}</Text>
                                        <Text style={styles.historyDate}>{h.date}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.historyPts, h.type === 'earn' ? styles.textGreen : styles.textRose]}>{h.pts}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Success Modal */}
            <Modal visible={redeemModalOpen} transparent>
                <View style={styles.successOverlay}>
                    <Card style={[styles.successCard, { backgroundColor: isDark ? colors.bgCard : '#fff' }]}>
                        <View style={styles.successIcon}>
                            <CheckCircle size={32} color="#16a34a" />
                        </View>
                        <Text style={[styles.successTitle, { color: isDark ? colors.text900 : '#111827' }]}>Reward Claimed!</Text>
                        <Text style={styles.successSub}>You have successfully redeemed:</Text>
                        <View style={[styles.redeemedItem, { backgroundColor: isDark ? colors.bgSecondary : '#f9fafb', borderColor: isDark ? colors.border : '#f3f4f6' }]}>
                            <Text style={[styles.redeemTitle, { color: colors.rose500 }]}>{selectedReward?.title}</Text>
                            <Text style={styles.redeemDesc}>{selectedReward?.description}</Text>
                        </View>
                        <Button onPress={() => setRedeemModalOpen(false)} style={{ width: '100%' }}>Done</Button>
                    </Card>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 40 }, // Increased top padding
    backButton: { padding: 8, marginLeft: -8, borderRadius: 20 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827', flex: 1 },
    historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f3f4f6', padding: 6, borderRadius: 12 },
    historyText: { fontSize: 10, fontWeight: '600', color: '#6b7280' },
    content: { padding: 16, paddingBottom: 100 }, // 20 -> 16
    cardContainer: { height: 220, marginBottom: 16 }, // 280 -> 220, 20 -> 16
    tierCard: { borderRadius: 20, padding: 20, height: '100%', position: 'relative' }, // 24 -> 20
    cardContent: { justifyContent: 'center', height: '100%' },
    trophyIcon: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    balanceValue: { color: '#fff', fontSize: 28, fontWeight: '900', marginVertical: 4 }, // 32 -> 28
    tierLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600', marginBottom: 16 },
    progressContainer: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 10 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    progressText: { color: 'rgba(255,255,255,0.9)', fontSize: 8, fontWeight: '700' },
    progressBarBg: { height: 4, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 2, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#fff' },
    scanBtn: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    qrCard: { borderRadius: 20, padding: 20, height: '100%', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#facc15' },
    closeQrBtn: { position: 'absolute', top: 12, right: 12, padding: 8, backgroundColor: '#f3f4f6', borderRadius: 16 },
    qrTitle: { fontSize: 12, fontWeight: 'bold', color: '#111827', letterSpacing: 2, marginBottom: 12 },
    qrImage: { width: 120, height: 120, marginBottom: 12 },
    qrCode: { fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 2, marginBottom: 8 },
    qrHelp: { fontSize: 10, color: '#9ca3af' },
    voucherBtn: { backgroundColor: '#fff', borderColor: '#ffe4e6', marginBottom: 20, height: 48, minHeight: 48 },
    voucherBtnContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    voucherBtnText: { color: Colors.light.rose500, fontSize: 12, fontWeight: '700' },
    badge: { backgroundColor: '#ffe4e6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    badgeText: { color: Colors.light.rose500, fontSize: 9, fontWeight: '700' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    rewardCard: { width: '48%', overflow: 'hidden' },
    rewardImage: { height: 100, backgroundColor: '#ffe4e6', alignItems: 'center', justifyContent: 'center' }, // 120 -> 100
    rewardImageText: { fontSize: 24, fontWeight: '900', color: Colors.light.rose500 },
    rewardImageType: { fontSize: 9, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 },
    costBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: '#eab308', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    costText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    rewardContent: { padding: 10, gap: 4 },
    rewardTitle: { fontSize: 11, fontWeight: '700', color: '#111827', height: 28 },
    rewardDesc: { fontSize: 9, color: '#6b7280', height: 24 },
    claimBtn: { height: 28, minHeight: 28, paddingVertical: 0, marginTop: 4 },
    disabledBtn: { backgroundColor: '#f3f4f6' },
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    modalContent: { padding: 16 },
    emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 32 },
    voucherItem: { padding: 12, borderRadius: 12, backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#ffe4e6', marginBottom: 12 },
    voucherRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    voucherTitle: { fontSize: 14, fontWeight: 'bold', color: '#be123c' },
    activeTag: { fontSize: 9, fontWeight: 'bold', backgroundColor: '#fecdd3', color: '#881337', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    voucherDesc: { fontSize: 11, color: '#4b5563', marginBottom: 6 },
    voucherMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
    expiryText: { fontSize: 9, fontWeight: '700', color: Colors.light.rose500 },
    serialRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#fecdd3' },
    serialLabel: { fontSize: 9, fontWeight: '700', color: '#9ca3af' },
    serialValue: { fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', color: '#374151' },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    historyIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    bgGreen: { backgroundColor: '#dcfce7' },
    bgRose: { backgroundColor: '#ffe4e6' },
    historyTitle: { fontSize: 12, fontWeight: '700', color: '#111827' },
    historyDate: { fontSize: 9, color: '#6b7280' },
    historyPts: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
    textGreen: { color: '#16a34a' },
    textRose: { color: '#e11d48' },
    successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    successCard: { width: '100%', maxWidth: 280, alignItems: 'center', padding: 20 },
    successIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    successTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 4 },
    successSub: { fontSize: 12, color: '#6b7280', marginBottom: 12 },
    redeemedItem: { width: '100%', padding: 12, backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' },
    redeemTitle: { fontSize: 14, fontWeight: '700', color: Colors.light.rose500, marginBottom: 2 },
    redeemDesc: { fontSize: 10, color: '#6b7280' },
});
