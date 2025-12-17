import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    Image,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Api } from '@/services/api';
import { Service, Staff, Appointment, Promotion, Receipt, Reward, AppointmentStatus } from '@/types';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { ReceiptCard } from '@/components/ReceiptCard';
import {
    ArrowLeft,
    Clock,
    Users,
    Star,
    ChevronRight,
    Check,
    CreditCard,
    Wallet,
    CheckCircle,
    X,
    ChevronLeft,
    Ticket,
    Crown,
    Gift,
    Tag
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { formatSGDate, getRankSurcharge } from '@/utils/helpers';
import { AuthService } from '@/services/auth';

const EXTENDED_TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'
];

export default function BookAppointment() {
    const router = useRouter();
    const navigation = useNavigation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    const [bookingStep, setBookingStep] = useState<'services' | 'staff' | 'slot' | 'checkout' | 'success'>('services');

    // Data
    const [services, setServices] = useState<Service[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [user, setUser] = useState<any>(null);
    const [userEmail, setUserEmail] = useState('');
    const [savedCards, setSavedCards] = useState<any[]>([]);
    const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null);
    const [useNewCard, setUseNewCard] = useState(false);

    // Selection
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [selectedDateOffset, setSelectedDateOffset] = useState(0); // 0 = +5 days from now

    // Vouchers & Promos
    const [vouchers, setVouchers] = useState<Reward[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [selectedVoucher, setSelectedVoucher] = useState<Reward | null>(null);
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);


    // Calendar Generation
    const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

    // Payment Simulator
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [payStep, setPayStep] = useState<'method' | 'card' | 'tng' | 'otp' | 'processing'>('method');
    const [latestReceipt, setLatestReceipt] = useState<Receipt | null>(null);

    // Card Form
    const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvc: '', name: '' });
    const [saveNewCard, setSaveNewCard] = useState(false);

    // TNG Form
    const [tngPin, setTngPin] = useState('');

    // OTP
    const [otp, setOtp] = useState('');
    const [payError, setPayError] = useState('');
    const [processing, setProcessing] = useState(false);

    // Reset booking state and manage tab bar visibility
    useFocusEffect(
        useCallback(() => {
            // Reset all booking state when screen is focused
            setBookingStep('services');
            setSelectedService(null);
            setSelectedStaff(null);
            setSelectedSlot(null);
            setSelectedDateOffset(0);
            setSelectedVoucher(null);
            setSelectedPromotion(null);
            setLatestReceipt(null);
            setIsPaymentModalVisible(false);
            setPayStep('method');
            setCardForm({ number: '', expiry: '', cvc: '', name: '' });
            setTngPin('');
            setOtp('');
            setPayError('');

            // Show tab bar on services screen - reset to initial state
            navigation.setOptions({
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 25,
                    left: 20,
                    right: 20,
                    height: 72,
                    borderRadius: 32,
                    display: 'flex',
                    backgroundColor: isDark ? '#141414' : '#ffffff',
                    borderTopWidth: 0
                },
                tabBarActiveTintColor: colors.accent
            });

            // Return cleanup function to restore tab bar when leaving
            return () => {
                navigation.setOptions({
                    tabBarStyle: {
                        position: 'absolute',
                        bottom: 25,
                        left: 20,
                        right: 20,
                        height: 72,
                        borderRadius: 32,
                        display: 'flex',
                        backgroundColor: isDark ? '#141414' : '#ffffff',
                        borderTopWidth: 0
                    }
                });
            };
        }, [navigation])
    );

    // Hide tab bar when leaving services step
    useEffect(() => {
        if (bookingStep !== 'services') {
            // Hide tab bar by moving it off screen
            // Hide tab bar by moving it off screen
            navigation.setOptions({
                tabBarStyle: {
                    position: 'absolute',
                    bottom: -100,
                    display: 'none'
                }
            });
        } else {
            // Show tab bar with full styling
            // Show tab bar with full styling
            navigation.setOptions({
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 25,
                    left: 20,
                    right: 20,
                    height: 72,
                    borderRadius: 32,
                    display: 'flex',
                    backgroundColor: isDark ? '#141414' : '#ffffff',
                    borderTopWidth: 0
                },
                tabBarActiveTintColor: colors.accent
            });
        }
    }, [bookingStep, navigation]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
        if (authUser?.email) setUserEmail(authUser.email);

        const promises: Promise<any>[] = [
            Api.getServices(),
            Api.getStaff(),
            Api.getAllAppointments(),
            Api.getPromotions(),
            Api.getSavedCards(authUser?.id || '')
        ];

        if (authUser) {
            promises.push(Api.getUserVouchers(authUser.id));
        }

        const [servicesData, staffData, apptsData, promosData, cardsData, vouchersData] = await Promise.all(promises);

        setServices(servicesData);
        setStaffList(staffData);
        setAppointments(apptsData);
        setPromotions(promosData.filter((p: Promotion) => p.active));
        setSavedCards(cardsData || []);
        if (vouchersData) setVouchers(vouchersData);
    };

    // --- PROMOTION LOGIC ---
    useEffect(() => {
        if (!selectedService) return;

        const checkPromotions = () => {
            const now = new Date();
            const validPromos = promotions.filter(p => {
                if (!p.active) return false;
                // Filter by service if applicableServices exists (mock logic)
                // if (p.applicableServices && !p.applicableServices.includes(selectedService.id)) return false; 

                const start = new Date(p.startDate);
                const end = new Date(p.endDate);
                end.setHours(23, 59, 59, 999);
                return now >= start && now <= end;
            });

            if (validPromos.length > 0) {
                setSelectedPromotion(validPromos[0]);
                setSelectedVoucher(null);
            } else {
                setSelectedPromotion(null);
            }
        };
        checkPromotions();
    }, [selectedService, promotions]);

    // Re-validate voucher
    useEffect(() => {
        if (selectedVoucher && !selectedVoucher.title.includes('%')) {
            const base = selectedService?.priceCents || 0;
            const surcharge = selectedStaff ? getRankSurcharge(selectedStaff.rank) : 0;
            const total = base + surcharge;
            if (selectedVoucher.discountCents >= total) {
                setSelectedVoucher(null);
            }
        }
    }, [selectedService, selectedStaff, selectedVoucher]);


    // --- CALENDAR LOGIC ---
    const getBookingDate = (offset: number) => {
        const d = new Date();
        d.setDate(d.getDate() + 5 + offset);
        return d;
    };

    const generateCalendarDays = () => {
        const year = currentCalendarMonth.getFullYear();
        const month = currentCalendarMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) { days.push(null); }
        for (let i = 1; i <= daysInMonth; i++) { days.push(new Date(year, month, i)); }
        return days;
    };

    const isDateDisabled = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minDate = new Date(today);
        minDate.setDate(today.getDate() + 5);
        return date < minDate;
    };

    const handleDateClick = (date: Date) => {
        if (isDateDisabled(date)) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Calculate offset
        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const exactOffset = diffDays - 5;
        setSelectedDateOffset(exactOffset);
    };

    const isSlotTaken = (time: string) => {
        if (time === '13:00') return true;
        if (!selectedStaff) return false;

        const targetDate = getBookingDate(selectedDateOffset);
        // Simple check
        return appointments.some(appt => {
            if (appt.staffId !== selectedStaff.id) return false;
            const apptDate = new Date(appt.date);

            const isSameDay = apptDate.getDate() === targetDate.getDate() &&
                apptDate.getMonth() === targetDate.getMonth() &&
                apptDate.getFullYear() === targetDate.getFullYear();

            if (!isSameDay) return false;
            if (appt.status === 'cancelled') return false;

            const [h, m] = time.split(':').map(Number);
            return apptDate.getHours() === h && apptDate.getMinutes() === m;
        });
    };

    const handleBack = () => {
        if (bookingStep === 'services') router.back();
        else if (bookingStep === 'staff') setBookingStep('services');
        else if (bookingStep === 'slot') setBookingStep('staff');
        else if (bookingStep === 'checkout') setBookingStep('slot');
    };

    // --- RENDERERS ---

    const renderServiceStep = () => (
        <View style={styles.grid}>
            {services.map(service => (
                <Card
                    key={service.id}
                    style={[styles.serviceCard, { backgroundColor: isDark ? colors.bgCard : '#fff', borderColor: isDark ? colors.border : '#e5e7eb' }]}
                    onPress={() => { setSelectedService(service); setBookingStep('staff'); }}
                    noPadding
                >
                    <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
                    <View style={styles.serviceInfo}>
                        <View style={styles.rowBetween}>
                            <Text style={[styles.serviceName, { color: isDark ? colors.text900 : '#111827' }]}>{service.name}</Text>
                            <View style={[styles.priceTag, { backgroundColor: colors.accent }]}>
                                <Text style={styles.priceText}>From RM {(service.priceCents / 100).toFixed(0)}</Text>
                            </View>
                        </View>
                        <Text style={styles.serviceDesc} numberOfLines={2}>{service.description}</Text>
                        <View style={styles.durationBadge}>
                            <Clock size={12} color="#9ca3af" />
                            <Text style={styles.durationText}>{service.durationMinutes} mins</Text>
                        </View>
                    </View>
                </Card>
            ))}
        </View>
    );

    const renderStaffStep = () => (
        <View style={styles.grid}>
            <Card style={[styles.staffCard, { backgroundColor: isDark ? colors.bgCard : '#fff', borderColor: isDark ? colors.border : '#e5e7eb' }]} onPress={() => { setSelectedStaff(null); setBookingStep('slot'); }}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.light.rose100 }]}>
                    <Users size={24} color={colors.accent} />
                </View>
                <View style={styles.staffInfo}>
                    <Text style={[styles.staffName, { color: isDark ? colors.text900 : '#111827' }]}>Any Professional</Text>
                    <Text style={styles.staffRank}>Maximum availability</Text>
                </View>
                <ChevronRight size={20} color="#d1d5db" />
            </Card>
            {staffList.map(staff => {
                const surcharge = getRankSurcharge(staff.rank);
                const isDirector = staff.rank.includes('Director');
                return (
                    <Card key={staff.id} style={[styles.staffCard, { backgroundColor: isDark ? colors.bgCard : '#fff', borderColor: isDark ? colors.border : '#e5e7eb', overflow: 'hidden' }]} onPress={() => { setSelectedStaff(staff); setBookingStep('slot'); }}>
                        {isDirector && (
                            <View style={styles.directorBadge}>
                                <Crown size={10} color="#78350f" fill="#78350f" />
                                <Text style={styles.directorText}>TOP TIER</Text>
                            </View>
                        )}
                        <Avatar src={staff.avatarUrl} size="md" />
                        <View style={styles.staffInfo}>
                            <Text style={[styles.staffName, { color: isDark ? colors.text900 : '#111827' }]}>{staff.name}</Text>
                            <Text style={styles.staffRank}>{staff.rank}</Text>
                            <View style={styles.ratingRow}>
                                <Star size={12} color="#fbbf24" fill="#fbbf24" />
                                <Text style={styles.ratingText}>{staff.rating}</Text>
                                {surcharge > 0 && <View style={styles.surchargeTag}><Text style={styles.surchargeText}>+RM {surcharge / 100}</Text></View>}
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>
                                RM {((selectedService?.priceCents || 0) + surcharge) / 100}
                            </Text>
                        </View>
                    </Card>
                );
            })}
        </View>
    );

    const renderSlotStep = () => {
        const days = generateCalendarDays();
        const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        const selectedDate = getBookingDate(selectedDateOffset);
        selectedDate.setHours(0, 0, 0, 0);

        return (
            <View>
                <View style={[styles.calendarContainer, { backgroundColor: isDark ? colors.bgCard : '#fff', borderColor: isDark ? colors.border : '#e5e7eb' }]}>
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity onPress={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1))}>
                            <ChevronLeft size={20} color={isDark ? colors.text600 : '#4b5563'} />
                        </TouchableOpacity>
                        <Text style={[styles.calendarTitle, { color: isDark ? colors.text900 : '#111827' }]}>
                            {currentCalendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </Text>
                        <TouchableOpacity onPress={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1))}>
                            <ChevronRight size={20} color={isDark ? colors.text600 : '#4b5563'} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.weekDaysRow}>
                        {weekDays.map(d => <Text key={d} style={styles.weekDayText}>{d}</Text>)}
                    </View>

                    <View style={styles.daysGrid}>
                        {days.map((date, idx) => {
                            if (!date) return <View key={idx} style={styles.dayCell} />;
                            const disabled = isDateDisabled(date);
                            const isSelected = date.getTime() === selectedDate.getTime();

                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        styles.dayCell,
                                        isSelected && { backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
                                        disabled && styles.dayCellDisabled
                                    ]}
                                    disabled={disabled}
                                    onPress={() => handleDateClick(date)}
                                >
                                    <Text style={[
                                        styles.dayText,
                                        { color: isDark ? colors.text900 : '#111827' },
                                        isSelected && styles.dayTextSelected,
                                        disabled && styles.dayTextDisabled
                                    ]}>{date.getDate()}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: isDark ? colors.text900 : '#111827' }]}>Available Slots</Text>
                <View style={styles.slotGrid}>
                    {EXTENDED_TIME_SLOTS.map(time => {
                        const taken = isSlotTaken(time);
                        return (
                            <TouchableOpacity
                                key={time}
                                disabled={taken}
                                style={[
                                    styles.slotButton,
                                    { borderColor: isDark ? colors.border : '#e5e7eb' },
                                    taken && styles.slotButtonDisabled,
                                    selectedSlot === time && { backgroundColor: colors.accent, borderColor: colors.accent }
                                ]}
                                onPress={() => { setSelectedSlot(time); setBookingStep('checkout'); }}
                            >
                                <Text style={[
                                    styles.slotText,
                                    { color: isDark ? colors.text600 : '#4b5563' },
                                    taken && { color: '#9ca3af', textDecorationLine: 'line-through' },
                                    selectedSlot === time && styles.textWhite
                                ]}>{time}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderCheckoutStep = () => {
        if (!selectedService) return null;

        const basePrice = selectedService.priceCents;
        const rankSurcharge = selectedStaff ? getRankSurcharge(selectedStaff.rank) : 0;

        let discount = 0;
        if (selectedPromotion) {
            const label = selectedPromotion.discount;
            if (label.includes('%')) {
                const percentage = parseInt(label.replace(/\D/g, ''));
                if (!isNaN(percentage)) discount = Math.round(basePrice * (percentage / 100));
            } else if (label.toLowerCase().includes('rm')) {
                const amount = parseInt(label.replace(/\D/g, ''));
                if (!isNaN(amount)) discount = amount * 100;
            }
        } else if (selectedVoucher) {
            if (selectedVoucher.title.includes('%')) {
                const percentage = parseInt(selectedVoucher.title);
                const gross = basePrice + rankSurcharge;
                discount = Math.round(gross * (percentage / 100));
            } else {
                discount = selectedVoucher.discountCents;
            }
        }

        let taxableAmount = (basePrice + rankSurcharge) - discount;
        taxableAmount = Math.max(0, taxableAmount);

        const sstCents = Math.round(taxableAmount * 0.08);
        const totalBeforeRounding = taxableAmount + sstCents;
        const amountRM = totalBeforeRounding / 100;
        const roundedRM = (Math.round(amountRM * 20) / 20);
        const finalTotalCents = Math.round(roundedRM * 100);
        const roundingCents = finalTotalCents - totalBeforeRounding;

        return (
            <View style={styles.checkoutContainer}>
                <Card noPadding style={[styles.summaryCard, { backgroundColor: isDark ? colors.bgCard : '#fff' }]}>
                    <Image source={{ uri: selectedService.imageUrl }} style={styles.summaryImage} />
                    <View style={styles.summaryContent}>
                        <View style={styles.rowBetween}>
                            <View>
                                <Text style={[styles.summaryTitle, { color: isDark ? colors.text900 : '#111827' }]}>{selectedService.name}</Text>
                                <Text style={styles.summaryDetail}>with {selectedStaff ? selectedStaff.name : 'Any Professional'}</Text>
                            </View>
                        </View>
                        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Clock size={14} color="#6b7280" />
                            <Text style={styles.summaryDetail}>{formatSGDate(getBookingDate(selectedDateOffset).toISOString())} • {selectedSlot}</Text>
                        </View>
                    </View>
                </Card>

                {/* Promotions / Vouchers */}
                {/* Promotions / Vouchers */}
                <View style={{ gap: 8 }}>
                    <Text style={[styles.sectionLabel, { color: isDark ? colors.text900 : '#111827' }]}>Offers & Vouchers</Text>

                    {/* Promotions */}
                    {promotions.map(p => {
                        const isSelected = selectedPromotion?.id === p.id;
                        return (
                            <TouchableOpacity
                                key={p.id}
                                style={[
                                    styles.offerCard,
                                    { backgroundColor: isDark ? colors.bgCard : '#fff', borderColor: isDark ? colors.border : '#e5e7eb' },
                                    isSelected && styles.offerCardActive
                                ]}
                                onPress={() => {
                                    if (isSelected) setSelectedPromotion(null);
                                    else { setSelectedPromotion(p); setSelectedVoucher(null); }
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <View style={styles.offerRow}>
                                        <Tag size={16} color={isSelected ? '#15803d' : '#9ca3af'} />
                                        <Text style={[styles.offerTitle, !isSelected && { color: isDark ? colors.text900 : '#111827' }]}>{p.title}</Text>
                                    </View>
                                    <Text style={[styles.offerDesc, !isSelected && { color: '#6b7280' }]}>{p.discount}</Text>
                                    <Text style={[styles.offerType, !isSelected && { color: '#9ca3af' }]}>Special Offer</Text>
                                </View>
                                {isSelected ? <CheckCircle size={20} color="#15803d" /> : <View style={{ width: 20 }} />}
                            </TouchableOpacity>
                        );
                    })}

                    {/* Vouchers */}
                    {vouchers.map(v => {
                        const isSelected = selectedVoucher?.id === v.id;
                        const base = selectedService?.priceCents || 0;
                        const surcharge = selectedStaff ? getRankSurcharge(selectedStaff.rank) : 0;
                        const total = base + surcharge;
                        const isDisabled = !v.title.includes('%') && v.discountCents >= total;

                        return (
                            <TouchableOpacity
                                key={v.id}
                                disabled={isDisabled}
                                style={[
                                    styles.offerCard,
                                    { backgroundColor: isDark ? colors.bgCard : '#fff', borderColor: isDark ? colors.border : '#e5e7eb' },
                                    isSelected && styles.offerCardActive,
                                    isDisabled && { opacity: 0.5 }
                                ]}
                                onPress={() => {
                                    if (isSelected) setSelectedVoucher(null);
                                    else { setSelectedVoucher(v); setSelectedPromotion(null); }
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <View style={styles.offerRow}>
                                        <Gift size={16} color={isSelected ? '#15803d' : '#9ca3af'} />
                                        <Text style={[styles.offerTitle, !isSelected && { color: isDark ? colors.text900 : '#111827' }]}>{v.title}</Text>
                                    </View>
                                    <Text style={[styles.offerDesc, !isSelected && { color: '#6b7280' }]}>{v.description}</Text>
                                    <Text style={[styles.offerType, !isSelected && { color: '#9ca3af' }]}>My Voucher</Text>
                                    {isDisabled && <Text style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>Order value too low.</Text>}
                                </View>
                                {isSelected ? <CheckCircle size={20} color="#15803d" /> : <View style={{ width: 20 }} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Billing By Line */}
                <Card style={{ backgroundColor: isDark ? colors.bgCard : '#fff' }}>
                    <Text style={[styles.billTitle, { color: isDark ? colors.text900 : '#111827' }]}>Billing Details</Text>

                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Service Price</Text>
                        <Text style={[styles.billValue, { color: isDark ? colors.text900 : '#111827' }]}>RM {(basePrice / 100).toFixed(2)}</Text>
                    </View>

                    {discount > 0 && (
                        <View style={styles.billRow}>
                            <Text style={[styles.billLabel, { color: colors.accent }]}>Discount</Text>
                            <Text style={[styles.billValue, { color: colors.accent }]}>-RM {(discount / 100).toFixed(2)}</Text>
                        </View>
                    )}

                    {rankSurcharge > 0 && (
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Stylist Surcharge</Text>
                            <Text style={[styles.billValue, { color: isDark ? colors.text900 : '#111827' }]}>RM {(rankSurcharge / 100).toFixed(2)}</Text>
                        </View>
                    )}

                    <View style={[styles.billRow, { borderTopWidth: 1, borderTopColor: isDark ? colors.border : '#e5e7eb', paddingTop: 8 }]}>
                        <Text style={[styles.billLabel, { fontWeight: '700', color: isDark ? colors.text600 : '#374151' }]}>Taxable Amount</Text>
                        <Text style={[styles.billValue, { fontWeight: '700', color: isDark ? colors.text900 : '#111827' }]}>RM {(taxableAmount / 100).toFixed(2)}</Text>
                    </View>

                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>SST (8%)</Text>
                        <Text style={[styles.billValue, { color: isDark ? colors.text900 : '#111827' }]}>RM {(sstCents / 100).toFixed(2)}</Text>
                    </View>

                    {roundingCents !== 0 && (
                        <View style={styles.billRow}>
                            <Text style={[styles.billLabel, { fontStyle: 'italic', fontSize: 12 }]}>Rounding Adj.</Text>
                            <Text style={[styles.billValue, { fontStyle: 'italic', fontSize: 12, color: isDark ? colors.text600 : '#6b7280' }]}>{roundingCents > 0 ? '+' : ''}RM {(roundingCents / 100).toFixed(2)}</Text>
                        </View>
                    )}

                    <View style={[styles.billRow, styles.totalRow, { borderTopColor: isDark ? colors.border : '#e5e7eb' }]}>
                        <Text style={[styles.totalLabel, { color: colors.accent }]}>Total Payable</Text>
                        <Text style={[styles.totalValue, { color: colors.accent }]}>RM {(finalTotalCents / 100).toFixed(2)}</Text>
                    </View>
                </Card>

                <Button style={styles.payButton} onPress={() => openPaymentModal()}>
                    Proceed to Payment
                </Button>
            </View>
        );
    };

    // --- PAYMENT SIMULATOR LOGIC ---

    const openPaymentModal = () => {
        setIsPaymentModalVisible(true);
        setPayStep('method');
        setPayError('');
        setOtp('');
        setTngPin('');
        setSaveNewCard(false);
    };

    const validateCard = () => {
        const cleanNum = cardForm.number.replace(/\D/g, '');

        // 1. Check Brand (Visa = 4, Mastercard = 2 or 5)
        if (!cleanNum.startsWith('4') && !cleanNum.startsWith('5') && !cleanNum.startsWith('2')) {
            return "Only Visa (4) and Mastercard (2,5) accepted.";
        }

        if (cleanNum.length < 15 || cleanNum.length > 19) return "Invalid card number length.";

        // 2. Check Expiry
        if (!cardForm.expiry || cardForm.expiry.length !== 5) return "Invalid expiry.";
        const [mm, yy] = cardForm.expiry.split('/').map(Number);
        const now = new Date();
        const curYear = parseInt(now.getFullYear().toString().slice(-2));
        const curMonth = now.getMonth() + 1;

        if (!mm || !yy || mm < 1 || mm > 12) return "Invalid month.";
        if (yy < curYear || (yy === curYear && mm < curMonth)) return "Card has expired.";

        // 3. Check CVC
        if (cardForm.cvc.length < 3) return "Invalid CVC.";

        // 4. Check Holder Name
        if (!cardForm.name.trim()) return "Cardholder name is required.";

        return null;
    };

    const handleConfirmPayment = async () => {
        // This is the final step
        setProcessing(true);
        // Simulate delay
        setTimeout(async () => {
            await createAppointment();
            setProcessing(false);
        }, 1500);
    };

    // Step transitions
    const proceedToOTP = async () => {
        setPayError('');
        if (payStep === 'card') {
            if (useNewCard || savedCards.length === 0) {
                const err = validateCard();
                if (err) { setPayError(err); return; }
            } else if (!selectedSavedCard) {
                setPayError("Please select a card.");
                return;
            }

            // Mock send OTP
            setProcessing(true);
            const { error } = await AuthService.sendLoginOtp(userEmail || 'test@example.com'); // Mock
            setProcessing(false);
            if (error) {
                // In simulator we can ignore error or show it. 
                // For now, let's just proceed to OTP as Supabase limit might hit
            }
            setPayStep('otp');

        } else if (payStep === 'tng') {
            if (tngPin.length !== 6) { setPayError("PIN must be 6 digits"); return; }
            // Verify PIN logic mocked
            setProcessing(true);
            const isValid = await Api.verifyTransactionPin(user.id, tngPin);
            setProcessing(false);
            if (isValid) {
                handleConfirmPayment();
            } else {
                setPayError("Invalid PIN (Try 123456)");
            }
        }
    };

    const verifyOTP = async () => {
        setProcessing(true);
        // In real app, verify with supabase. 
        // Here we just accept any 6 digit
        if (otp.length === 6) {
            handleConfirmPayment();
        } else {
            setProcessing(false);
            setPayError("Invalid OTP");
        }
    };


    const createAppointment = async () => {
        if (!user || !selectedService || !selectedSlot) return;

        try {
            if (!user || !selectedService) {
                Alert.alert('Error', 'Missing user or service information.');
                setProcessing(false);
                return;
            }

            const dateObj = getBookingDate(selectedDateOffset);
            const dateStr = dateObj.toISOString().split('T')[0];

            // Recalculate Logic to get FINAL CENTS
            const basePrice = selectedService.priceCents;
            const rankSurcharge = selectedStaff ? getRankSurcharge(selectedStaff.rank) : 0;
            let discount = 0;
            if (selectedPromotion) {
                const label = selectedPromotion.discount;
                if (label.includes('%')) {
                    const percentage = parseInt(label.replace(/\D/g, ''));
                    if (!isNaN(percentage)) discount = Math.round(basePrice * (percentage / 100));
                } else if (label.toLowerCase().includes('rm')) {
                    const amount = parseInt(label.replace(/\D/g, ''));
                    if (!isNaN(amount)) discount = amount * 100;
                }
            } else if (selectedVoucher) {
                if (selectedVoucher.title.includes('%')) {
                    const percentage = parseInt(selectedVoucher.title);
                    const gross = basePrice + rankSurcharge;
                    discount = Math.round(gross * (percentage / 100));
                } else {
                    discount = selectedVoucher.discountCents;
                }
            }
            let taxableAmount = (basePrice + rankSurcharge) - discount;
            taxableAmount = Math.max(0, taxableAmount);
            const sstCents = Math.round(taxableAmount * 0.08);
            const totalBeforeRounding = taxableAmount + sstCents;
            const amountRM = totalBeforeRounding / 100;
            const roundedRM = (Math.round(amountRM * 20) / 20);
            const finalTotalCents = Math.round(roundedRM * 100);
            const roundingCents = finalTotalCents - totalBeforeRounding;

            // Generate transaction reference
            const transactionRef = `SIM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            // Call API
            const apptData: Partial<Appointment> = {
                userId: user.id,
                serviceId: selectedService.id,
                staffId: selectedStaff ? selectedStaff.id : undefined,
                date: `${dateStr}T${selectedSlot}:00`,
                status: AppointmentStatus.CONFIRMED
            };

            if (!apptData.staffId && staffList.length > 0) apptData.staffId = staffList[0].id;

            // Pass all receipt data to API for database storage
            const result = await Api.createAppointment(apptData, finalTotalCents, selectedVoucher || undefined, {
                paymentMethod: payStep === 'card' || payStep === 'otp' ? 'card' : "Touch 'n Go",
                sstCents: sstCents,
                surchargeCents: rankSurcharge,
                roundingCents: roundingCents,
                transactionRef: transactionRef,
                servicePriceCents: basePrice,
                totalPayableCents: finalTotalCents,
                discountCents: discount
            });

            if (result) {
                setIsPaymentModalVisible(false);

                const r: Receipt = {
                    id: result.orderId, // Use order_id as Receipt No.
                    appointmentId: result.refId,
                    userId: user.id,
                    serviceName: selectedService.name,
                    staffName: selectedStaff ? selectedStaff.name : 'Any Professional',
                    date: new Date().toISOString(),
                    bookingDate: new Date().toISOString(),
                    appointmentDate: `${dateStr}T${selectedSlot}`,
                    servicePriceCents: basePrice, // Original service price
                    surchargeCents: rankSurcharge, // Stylist surcharge
                    totalCents: basePrice + rankSurcharge, // Total before discount/tax
                    depositCents: finalTotalCents,
                    balanceCents: 0,
                    sstCents: sstCents,
                    roundingCents: roundingCents,
                    discountCents: discount,
                    paymentMethod: payStep === 'card' || payStep === 'otp' ? 'Credit Card' : "Touch 'n Go",
                    transactionRef: transactionRef,
                    status: 'paid',
                    refundCents: 0
                };
                setLatestReceipt(r);
                setBookingStep('success');
            } else {
                Alert.alert("Error", "Failed to booking");
            }

        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Something went wrong.");
        }
    }


    if (!user) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </SafeAreaView>
        );
    }

    if (bookingStep === 'success') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
                <ScrollView contentContainerStyle={styles.successContent}>
                    <View style={styles.successIcon}>
                        <CheckCircle size={48} color="#16a34a" />
                    </View>
                    <View />
                    <Text style={[styles.successTitle, { color: isDark ? colors.text900 : '#111827' }]}>Booking Confirmed!</Text>
                    <Text style={styles.successSub}>Payment successful.</Text>
                    {latestReceipt && <ReceiptCard receipt={latestReceipt} />}
                    <Button onPress={() => router.replace('/client/home')} style={styles.doneButton}>
                        Done
                    </Button>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color={isDark ? colors.text900 : "#111827"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? colors.text900 : '#111827' }]}>
                    {bookingStep === 'services' ? 'Select Service' :
                        bookingStep === 'staff' ? 'Select Stylist' :
                            bookingStep === 'slot' ? 'Select Time' : 'Checkout'}
                </Text>

                {/* Progress Dots in Header */}
                <View style={{ flexDirection: 'row', gap: 4 }}>
                    {['services', 'staff', 'slot', 'checkout'].map((step, i) => {
                        const steps = ['services', 'staff', 'slot', 'checkout'];
                        const isActive = steps.indexOf(step) <= steps.indexOf(bookingStep);
                        return <View key={step} style={[styles.progressDot, isActive && { backgroundColor: colors.accent }]} />;
                    })}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {bookingStep === 'services' && renderServiceStep()}
                {bookingStep === 'staff' && renderStaffStep()}
                {bookingStep === 'slot' && renderSlotStep()}
                {bookingStep === 'checkout' && renderCheckoutStep()}
            </ScrollView>



            {/* Payment Simulator Modal */}
            <Modal visible={isPaymentModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? colors.bgCard : '#fff' }]}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            {payStep === 'method' ? (
                                <Text style={[styles.modalTitle, { color: isDark ? colors.text900 : '#111827' }]}>Payment Method</Text>
                            ) : (
                                <TouchableOpacity onPress={() => setPayStep('method')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <ChevronLeft size={20} color="#6b7280" />
                                    <Text style={{ color: '#6b7280', fontWeight: '700' }}>Back</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => setIsPaymentModalVisible(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
                        </View>

                        {/* Body */}
                        <View style={styles.modalBody}>
                            {payStep === 'method' && (
                                <View style={{ gap: 12 }}>
                                    <TouchableOpacity style={[styles.payMethodCard, isDark && { borderColor: colors.border }]} onPress={() => setPayStep('card')}>
                                        <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
                                            <CreditCard size={20} color="#2563eb" />
                                        </View>
                                        <View>
                                            <Text style={[styles.methodTitle, { color: isDark ? colors.text900 : '#111827' }]}>Credit / Debit Card</Text>
                                            <Text style={styles.methodSub}>Visa & Mastercard</Text>
                                        </View>
                                        <ChevronRight size={20} color="#d1d5db" style={{ marginLeft: 'auto' }} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.payMethodCard, isDark && { borderColor: colors.border }]} onPress={() => setPayStep('tng')}>
                                        <View style={[styles.iconCircle, { backgroundColor: '#2563eb' }]}>
                                            <Wallet size={20} color="#fff" />
                                        </View>
                                        <View>
                                            <Text style={[styles.methodTitle, { color: isDark ? colors.text900 : '#111827' }]}>Touch 'n Go eWallet</Text>
                                            <Text style={styles.methodSub}>Secure PIN</Text>
                                        </View>
                                        <ChevronRight size={20} color="#d1d5db" style={{ marginLeft: 'auto' }} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {payStep === 'card' && (
                                <View style={{ gap: 16 }}>

                                    {/* Saved Cards List */}
                                    {!useNewCard && savedCards.length > 0 && (
                                        <View style={{ gap: 12 }}>
                                            <Text style={{ fontWeight: '700', color: isDark ? colors.text600 : '#6b7280', fontSize: 12 }}>SAVED CARDS</Text>
                                            {savedCards.map((card: any) => (
                                                <TouchableOpacity
                                                    key={card.id}
                                                    style={[styles.payMethodCard, selectedSavedCard === card.id && { borderColor: colors.accent, backgroundColor: isDark ? '#374151' : '#fff1f2' }]}
                                                    onPress={() => setSelectedSavedCard(card.id)}
                                                >
                                                    <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
                                                        <CreditCard size={20} color="#2563eb" />
                                                    </View>
                                                    <View>
                                                        <Text style={[styles.methodTitle, { color: isDark ? colors.text900 : '#111827' }]}>•••• {card.last4}</Text>
                                                        <Text style={styles.methodSub}>Expires {card.expiry}</Text>
                                                    </View>
                                                    {selectedSavedCard === card.id && <Check size={20} color={colors.accent} style={{ marginLeft: 'auto' }} />}
                                                </TouchableOpacity>
                                            ))}

                                            <TouchableOpacity onPress={() => { setUseNewCard(true); setSelectedSavedCard(null); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                                <View style={{ width: 40, height: 40, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#9ca3af', alignItems: 'center', justifyContent: 'center' }}>
                                                    <CreditCard size={20} color="#9ca3af" />
                                                </View>
                                                <Text style={{ fontWeight: '600', color: isDark ? colors.text900 : '#111827' }}>Use New Card</Text>
                                            </TouchableOpacity>

                                            {payError ? <Text style={styles.errorText}>{payError}</Text> : null}
                                            <Button onPress={proceedToOTP} loading={processing} disabled={!selectedSavedCard}>
                                                Pay with Saved Card
                                            </Button>
                                        </View>
                                    )}

                                    {/* New Card Form */}
                                    {(useNewCard || savedCards.length === 0) && (
                                        <View style={{ gap: 16 }}>
                                            {savedCards.length > 0 && (
                                                <TouchableOpacity onPress={() => setUseNewCard(false)} style={{ marginBottom: 8 }}>
                                                    <Text style={{ color: colors.accent, fontWeight: '600' }}>Back to Saved Cards</Text>
                                                </TouchableOpacity>
                                            )}

                                            <TextInput
                                                placeholder="Card Number"
                                                placeholderTextColor="#9ca3af"
                                                value={cardForm.number}
                                                onChangeText={t => setCardForm({ ...cardForm, number: t })}
                                                style={[styles.input, { color: isDark ? colors.text900 : '#111827', borderColor: isDark ? colors.border : '#e5e7eb' }]}
                                                keyboardType="number-pad"
                                                maxLength={19}
                                            />
                                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                                <TextInput
                                                    placeholder="MM/YY"
                                                    placeholderTextColor="#9ca3af"
                                                    value={cardForm.expiry}
                                                    onChangeText={t => setCardForm({ ...cardForm, expiry: t })}
                                                    style={[styles.input, { flex: 1, color: isDark ? colors.text900 : '#111827', borderColor: isDark ? colors.border : '#e5e7eb' }]}
                                                    maxLength={5}
                                                />
                                                <TextInput
                                                    placeholder="CVC"
                                                    placeholderTextColor="#9ca3af"
                                                    value={cardForm.cvc}
                                                    onChangeText={t => setCardForm({ ...cardForm, cvc: t })}
                                                    style={[styles.input, { flex: 1, color: isDark ? colors.text900 : '#111827', borderColor: isDark ? colors.border : '#e5e7eb' }]}
                                                    keyboardType="number-pad"
                                                    secureTextEntry
                                                    maxLength={4}
                                                />
                                            </View>
                                            <TextInput
                                                placeholder="Cardholder Name"
                                                placeholderTextColor="#9ca3af"
                                                value={cardForm.name}
                                                onChangeText={t => setCardForm({ ...cardForm, name: t })}
                                                style={[styles.input, { color: isDark ? colors.text900 : '#111827', borderColor: isDark ? colors.border : '#e5e7eb' }]}
                                            />

                                            {payError ? <Text style={styles.errorText}>{payError}</Text> : null}
                                            <Button onPress={proceedToOTP} loading={processing}>Pay</Button>
                                        </View>
                                    )}
                                </View>
                            )}

                            {payStep === 'tng' && (
                                <View style={{ gap: 24, alignItems: 'center' }}>
                                    <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' }}>
                                        <Wallet size={32} color="#fff" />
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={{ fontSize: 14, color: '#6b7280' }}>Amount</Text>
                                        <Text style={{ fontSize: 32, fontWeight: '900', color: isDark ? colors.text900 : '#111827' }}>RM {(selectedService?.priceCents || 0) / 100}</Text>
                                    </View>
                                    <View style={{ width: '100%' }}>
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 8 }}>6-DIGIT PIN</Text>
                                        <TextInput
                                            placeholder="••••••"
                                            placeholderTextColor="#9ca3af"
                                            value={tngPin}
                                            onChangeText={setTngPin}
                                            style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8, color: isDark ? colors.text900 : '#111827', borderColor: isDark ? colors.border : '#e5e7eb' }]}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            secureTextEntry
                                        />
                                    </View>
                                    {payError ? <Text style={styles.errorText}>{payError}</Text> : null}
                                    <Button onPress={proceedToOTP} loading={processing} style={{ width: '100%', backgroundColor: '#2563eb' }}>Pay Now</Button>
                                </View>
                            )}

                            {payStep === 'otp' && (
                                <View style={{ gap: 24, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 16, color: isDark ? colors.text900 : '#111827', textAlign: 'center' }}>
                                        Enter the OTP sent to {userEmail}
                                    </Text>
                                    <TextInput
                                        placeholder="123456"
                                        placeholderTextColor="#9ca3af"
                                        value={otp}
                                        onChangeText={setOtp}
                                        style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8, width: '100%', color: isDark ? colors.text900 : '#111827', borderColor: isDark ? colors.border : '#e5e7eb' }]}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                    />
                                    {payError ? <Text style={styles.errorText}>{payError}</Text> : null}
                                    <Button onPress={verifyOTP} loading={processing} style={{ width: '100%' }}>Confirm Payment</Button>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    content: { padding: 20, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e7eb' },
    progressDotActive: { backgroundColor: Colors.light.rose500 },
    grid: { gap: 16 },
    serviceCard: { flexDirection: 'row', gap: 16, alignItems: 'center', overflow: 'hidden' },
    serviceImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f3f4f6' },
    serviceInfo: { flex: 1, gap: 4, paddingVertical: 10, paddingRight: 10 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    serviceName: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
    priceTag: { backgroundColor: Colors.light.rose500, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    priceText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
    serviceDesc: { fontSize: 12, color: '#6b7280' },
    durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    durationText: { fontSize: 12, color: '#9ca3af', fontWeight: 'bold' },
    staffCard: { flexDirection: 'row', alignItems: 'center', gap: 16, overflow: 'visible' },
    avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    staffInfo: { flex: 1 },
    staffName: { fontSize: 16, fontWeight: '700', color: '#111827' },
    staffRank: { fontSize: 12, color: '#6b7280' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    ratingText: { fontSize: 12, fontWeight: '700', color: '#4b5563' },
    calendarContainer: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    calendarTitle: { fontSize: 16, fontWeight: '700' },
    weekDaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    weekDayText: { width: '14.28%', textAlign: 'center', fontSize: 12, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
    dayCellSelected: { backgroundColor: Colors.light.rose500, shadowColor: Colors.light.rose500, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
    dayCellDisabled: { opacity: 0.3 },
    dayText: { fontSize: 14, fontWeight: '500' },
    dayTextSelected: { color: '#ffffff', fontWeight: '700' },
    dayTextDisabled: { color: '#d1d5db' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12, marginTop: 8 },
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    slotButton: { width: '31%', paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    slotButtonDisabled: { backgroundColor: '#f3f4f6', borderColor: '#f3f4f6' },
    slotText: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
    textWhite: { color: '#ffffff' },
    checkoutContainer: { gap: 24 },
    summaryCard: { overflow: 'hidden' },
    summaryImage: { width: '100%', height: 120, backgroundColor: '#f3f4f6' },
    summaryContent: { padding: 16 },
    summaryTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    summaryDetail: { fontSize: 14, color: '#6b7280' },
    billTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 16 },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    billLabel: { fontSize: 14, color: '#6b7280' },
    billValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
    totalRow: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12, marginTop: 8 },
    totalLabel: { fontSize: 18, fontWeight: '900', color: Colors.light.rose500 },
    totalValue: { fontSize: 18, fontWeight: '900', color: Colors.light.rose500 },
    payButton: { marginTop: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    modalBody: { gap: 16 },
    payMethodCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, gap: 12 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    methodTitle: { fontWeight: '700', fontSize: 14 },
    methodSub: { fontSize: 12, color: '#6b7280' },
    input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 16 },
    errorText: { color: '#ef4444', fontSize: 12, textAlign: 'center' },
    successContent: { alignItems: 'center', padding: 24 },
    successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    successTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
    successSub: { fontSize: 16, color: '#6b7280', marginBottom: 32 },
    doneButton: { width: '100%', marginTop: 32 },
    // New Styles for Vouchers and Staff Badges
    directorBadge: { position: 'absolute', top: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#facc15', borderBottomLeftRadius: 8 },
    directorText: { fontSize: 8, fontWeight: '900', color: '#78350f' },
    surchargeTag: { backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    surchargeText: { fontSize: 10, fontWeight: '700', color: '#6b7280' },
    sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 },
    offerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 8 },
    offerCardActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
    offerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    offerTitle: { fontSize: 14, fontWeight: '700', color: '#166534' },
    offerDesc: { fontSize: 12, color: '#15803d' },
    offerType: { fontSize: 10, color: '#86efac', fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
    voucherItem: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    voucherItemActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    voucherItemActiveRose: { borderColor: '#e11d48', backgroundColor: '#fff1f2' },
    voucherItemDisabled: { opacity: 0.5 },
    voucherTitle: { fontSize: 14, fontWeight: '700' },
    voucherDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 }
});
