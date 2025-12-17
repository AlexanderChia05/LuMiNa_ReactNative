import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Api } from '@/services/api';
import { User, Promotion, Appointment, Service } from '@/types';
import { Star, ChevronRight, Plus, Calendar, Clock, Ticket, Moon, Sun } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { getTierInfo } from '@/utils/helpers';

export default function ClientHome() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    const [user, setUser] = useState<User | null>(null);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [upcomingAppt, setUpcomingAppt] = useState<Appointment | null>(null);
    const [popularServices, setPopularServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const profile = await Api.getUserProfile(authUser.id);
                setUser(profile);

                const promos = await Api.getPromotions();
                setPromotions(promos.filter(p => p.active));

                // Fetch services and staff for name lookups
                const services = await Api.getServices();
                const staffList = await Api.getStaff();

                const appts = await Api.getUserAppointments(authUser.id);
                const upcoming = appts
                    .filter(a => a.status === 'confirmed' || a.status === 'pending' || a.status === 'checked-in')
                    .filter(a => new Date(a.date) > new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

                // Populate service and staff names for the upcoming appointment
                if (upcoming) {
                    const service = services.find(s => s.id === upcoming.serviceId);
                    const staff = staffList.find(s => s.id === upcoming.staffId);
                    upcoming.serviceName = service?.name || 'Appointment';
                    upcoming.staffName = staff?.name || 'Staff';
                }
                setUpcomingAppt(upcoming || null);

                // Filter popular services
                const targetNames = ['Wash & Blowdry', 'Wash & Cut', 'Colour / Semi-colour'];
                const popular = services.filter(s => targetNames.some(t => s.name.includes(t) || t.includes(s.name)));
                setPopularServices(popular.length > 0 ? popular : services.slice(0, 3));
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    // Tier colors mapped from getTierInfo
    const getTierColors = (tierName: string): [string, string] => {
        switch (tierName) {
            case 'Silver': return ['#d1d5db', '#9ca3af'];
            case 'Gold': return ['#facc15', '#ca8a04'];
            case 'Platinum': return ['#94a3b8', '#475569'];
            case 'Centurion': return ['#1f2937', '#000000'];
            default: return ['#facc15', '#ca8a04'];
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.container}>
                <Text>Please Log In</Text>
            </View>
        );
    }

    const tierInfo = getTierInfo(user.lifetimePoints || 0);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.welcomeText, { color: colors.accent }]}>Welcome,</Text>
                        <Text style={[styles.userName, { color: colors.text900 }]}>{user.name}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={toggleTheme}
                        style={[styles.themeToggle, { backgroundColor: isDark ? colors.bgCard : colors.bgSecondary }]}
                    >
                        {isDark ? (
                            <Sun size={20} color={colors.text900} />
                        ) : (
                            <Moon size={20} color={colors.text600} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Points Card with Dynamic Tier Gradient */}
                <LinearGradient
                    colors={getTierColors(tierInfo.current)}
                    style={styles.pointsCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => router.push('/client/rewards')}
                        style={styles.pointsCardContent}
                    >
                        <View style={styles.pointsHeader}>
                            <View style={styles.rewardsLabel}>
                                <Star size={12} color="#fff" fill="#fff" />
                                <Text style={styles.rewardsText}>Lumina Rewards</Text>
                            </View>
                            <View style={styles.chevronCircle}>
                                <ChevronRight size={14} color="#fff" />
                            </View>
                        </View>
                        <Text style={styles.pointsAmount}>
                            {user.points} <Text style={styles.pointsUnit}>pts</Text>
                        </Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${Math.min(tierInfo.progress, 100)}%` }]} />
                        </View>
                        <Text style={styles.tierText}>
                            {tierInfo.next
                                ? `${Math.max(0, tierInfo.nextThreshold - (user.lifetimePoints || 0))} points until ${tierInfo.next}`
                                : 'Max Tier Reached!'}
                        </Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Quick Actions - Compacted */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.bookButton, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
                        activeOpacity={0.7}
                        onPress={() => router.push('/client/book_appointment')}
                    >
                        <Plus size={18} color={isDark ? '#000000' : '#ffffff'} />
                        <Text style={[styles.bookButtonText, { color: isDark ? '#000000' : '#ffffff' }]}>Book New</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.myBookingsButton, { backgroundColor: isDark ? colors.bgCard : '#ffffff', borderColor: isDark ? colors.border : '#e5e7eb' }]}
                        activeOpacity={0.7}
                        onPress={() => router.push('/client/bookings')}
                    >
                        <Calendar size={18} color={colors.accent} />
                        <Text style={[styles.myBookingsButtonText, { color: colors.text900 }]}>My Bookings</Text>
                    </TouchableOpacity>
                </View>

                {/* Upcoming Appointments */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Upcoming</Text>
                        <TouchableOpacity onPress={() => router.push('/client/bookings')}>
                            <Text style={[styles.seeAllText, { color: colors.accent }]}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {upcomingAppt ? (
                        <TouchableOpacity
                            style={[styles.appointmentCard, { backgroundColor: isDark ? colors.bgCard : '#fff' }]}
                            onPress={() => router.push('/client/bookings')}
                        >
                            <View style={styles.apptDate}>
                                <Text style={[styles.apptDay, { color: isDark ? colors.rose500 : '#e11d48' }]}>{new Date(upcomingAppt.date).getDate()}</Text>
                                <Text style={styles.apptMonth}>{new Date(upcomingAppt.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
                            </View>
                            <View style={styles.apptDetails}>
                                <Text style={[styles.apptService, { color: isDark ? colors.text900 : '#111827' }]}>{upcomingAppt.serviceName || 'Appointment'}</Text>
                                <Text style={styles.apptStylist}>with {upcomingAppt.staffName || 'Staff'}</Text>
                                <View style={styles.apptTimeRow}>
                                    <Clock size={12} color="#6b7280" />
                                    <Text style={styles.apptTime}>
                                        {new Date(upcomingAppt.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No upcoming appointments.</Text>
                        </View>
                    )}
                </View>

                {/* Special Offers (Promotions) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Special Offers</Text>
                    {promotions.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promoScroll}>
                            {promotions.map((promo) => (
                                <View key={promo.id} style={styles.promoCard}>
                                    <Image source={{ uri: promo.imageUrl || 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6' }} style={styles.promoImage} resizeMode="cover" />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                                        style={styles.promoGradient}
                                    >
                                        <View style={styles.promoContent}>
                                            <View style={styles.promoBadge}>
                                                <Text style={styles.promoBadgeText}>{promo.discount}</Text>
                                            </View>
                                            <Text style={styles.promoTitle} numberOfLines={1}>{promo.title}</Text>
                                            <Text style={styles.promoDesc} numberOfLines={2}>{promo.description}</Text>
                                            <Text style={styles.promoValid}>Valid: {new Date(promo.startDate).toLocaleDateString('en-GB')} - {new Date(promo.endDate).toLocaleDateString('en-GB')}</Text>
                                        </View>
                                    </LinearGradient>
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>Check back later!</Text>
                        </View>
                    )}
                </View>

                {/* Popular Services */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Popular Services</Text>
                    {popularServices.length > 0 ? (
                        <View style={{ gap: 12 }}>
                            {popularServices.map((service) => (
                                <TouchableOpacity
                                    key={service.id}
                                    style={styles.serviceCard}
                                    onPress={() => router.push('/client/book_appointment')}
                                    activeOpacity={0.7}
                                >
                                    <Image
                                        source={{ uri: service.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035' }}
                                        style={styles.serviceImage}
                                    />
                                    <View style={styles.serviceInfo}>
                                        <Text style={styles.serviceName}>{service.name}</Text>
                                        <View style={styles.serviceDuration}>
                                            <Clock size={12} color="#737373" />
                                            <Text style={styles.durationText}>{service.durationMinutes} mins</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.priceTag, { backgroundColor: colors.accent }]}>
                                        <Text style={[styles.priceText, { color: isDark ? '#000000' : '#ffffff' }]}>RM {(service.priceCents / 100).toFixed(0)}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}><Text>Loading...</Text></View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff', // Will be overridden by theme
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 12, // 16 -> 12 for more density
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12, // 16 -> 12
        marginTop: 8, // Reduced from 10
    },
    welcomeText: {
        fontSize: 12, // 14 -> 12
        color: '#e65a78',
        fontWeight: '500',
    },
    userName: {
        fontSize: 24, // 28 -> 24
        fontWeight: '700',
        color: '#0a0a0a',
    },
    themeToggle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pointsCard: {
        borderRadius: 16, // 20 -> 16
        padding: 16, // 20 -> 16
        marginBottom: 16, // 20 -> 16
        shadowColor: '#e65a78',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    pointsCardContent: {
        position: 'relative',
        zIndex: 10,
    },
    pointsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8, // 12 -> 8
    },
    rewardsLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6, // 8 -> 6
    },
    rewardsText: {
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
        fontSize: 12, // 14 -> 12
    },
    chevronCircle: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        padding: 4,
    },
    pointsAmount: {
        fontSize: 32, // 40 -> 32
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8, // 12 -> 8
    },
    pointsUnit: {
        fontSize: 16, // 18 -> 16
        fontWeight: '400',
        opacity: 0.8,
    },
    progressBar: {
        width: '100%',
        height: 6, // 8 -> 6
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 3,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 3,
    },
    tierText: {
        fontSize: 10, // 12 -> 10
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    quickActions: {
        flexDirection: 'row',
        gap: 10, // 12 -> 10
        marginBottom: 16, // 20 -> 16
    },
    bookButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e65a78',
        borderRadius: 12,
        padding: 12, // 16 -> 12
        gap: 6,
        shadowColor: '#e65a78',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    bookButtonText: {
        color: '#ffffff',
        fontSize: 16, // 18 -> 16
        fontWeight: '700',
    },
    myBookingsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12, // 16 -> 12
        gap: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    myBookingsButtonText: {
        color: '#0a0a0a',
        fontSize: 16, // 18 -> 16
        fontWeight: '700',
    },
    section: {
        marginBottom: 16, // 20 -> 16
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8, // 12 -> 8
    },
    sectionTitle: {
        fontSize: 18, // 20 -> 18
        fontWeight: '700',
        color: '#0a0a0a',
    },
    seeAllText: {
        color: '#e65a78',
        fontSize: 12, // 14 -> 12
        fontWeight: '700',
    },
    emptyState: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16, // 24 -> 16
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    emptyStateText: {
        color: '#737373',
        fontSize: 12, // 14 -> 12
        fontWeight: '500',
        textAlign: 'center',
    },
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // 16 -> 12
        backgroundColor: '#ffffff',
        borderRadius: 12, // 16 -> 12
        padding: 12, // 16 -> 12
        borderWidth: 1,
        borderColor: '#fce7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    serviceImage: {
        width: 56, // 64 -> 56
        height: 56, // 64 -> 56
        borderRadius: 10,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 16, // 18 -> 16
        fontWeight: '700',
        color: '#be3f5a',
        marginBottom: 4,
    },
    serviceDuration: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    durationText: {
        fontSize: 12, // 14 -> 12
        color: '#737373',
        fontWeight: '500',
    },
    priceTag: {
        backgroundColor: '#e65a78',
        borderRadius: 8,
        paddingHorizontal: 8, // 12 -> 8
        paddingVertical: 4, // 6 -> 4
    },
    priceText: {
        color: '#ffffff',
        fontSize: 12, // 14 -> 12
        fontWeight: '700',
    },
    appointmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12, // 16 -> 12
        padding: 12, // 16 -> 12
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 12, // 16 -> 12
    },
    apptDate: {
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 8, // 12 -> 8
        minWidth: 50, // 60 -> 50
    },
    apptDay: {
        fontSize: 18, // 20 -> 18
        fontWeight: '700',
        color: '#0a0a0a',
    },
    apptMonth: {
        fontSize: 10, // 12 -> 10
        color: '#737373',
        textTransform: 'uppercase',
    },
    apptDetails: {
        flex: 1,
    },
    apptService: {
        fontSize: 14, // 16 -> 14
        fontWeight: '600',
        color: '#0a0a0a',
        marginBottom: 2,
    },
    apptStylist: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    apptTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    apptTime: {
        fontSize: 12, // 14 -> 12
        color: '#737373',
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10, // 12 -> 10
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    promoScroll: {
        marginHorizontal: -16, // -20 -> -16
        paddingHorizontal: 16, // 20 -> 16
    },
    promoCard: {
        width: 260, // Wider for 16:9-ish look
        height: 140,
        marginRight: 12,
        borderRadius: 16,
        backgroundColor: '#e5e7eb',
        overflow: 'hidden',
        position: 'relative', // For absolute overlay
    },
    promoImage: {
        width: '100%',
        height: '100%',
    },
    promoGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%', // Fade from bottom but cover
        justifyContent: 'flex-end',
        padding: 12,
    },
    promoContent: {
        // No padding here, handled by gradient
    },
    promoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 2,
    },
    promoDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
    },
    promoValid: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
    },
    promoDiscount: {
        // Removed, using badge
    },
    promoBadge: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    promoBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
});
