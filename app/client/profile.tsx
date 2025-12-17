import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Api } from '@/services/api';
import { User as UserType } from '@/types';
import { formatCardNumber, formatCardExpiry } from '@/utils/helpers';
import {
    Edit2,
    User as UserIcon,
    CreditCard,
    Settings,
    HelpCircle,
    LogOut,
    ChevronRight,
    Lock,
    X,
    Trash2,
    Plus
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { CreditCard as CardType } from '@/types';

export default function ClientProfile() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(false);

    // PIN State
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [pinError, setPinError] = useState('');

    // Payment Methods State
    const [cards, setCards] = useState<CardType[]>([]);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [addCardMode, setAddCardMode] = useState(false);

    // Add Card Form
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [holderName, setHolderName] = useState('');

    // Edit Profile State
    const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');

    useFocusEffect(
        useCallback(() => {
            loadUser();
        }, [])
    );

    const loadUser = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const [profile, savedCards] = await Promise.all([
                    Api.getUserProfile(authUser.id),
                    Api.getSavedCards(authUser.id)
                ]);

                if (profile) {
                    setUser(profile);
                }
                setCards(savedCards);
            } else {
                // Fallback
                const fallbackUser: any = {
                    id: authUser.id,
                    email: authUser.email || '',
                    name: authUser.user_metadata?.name || 'User',
                    phone: authUser.user_metadata?.phone || '',
                    points: 0,
                    lifetimePoints: 0,
                    avatarUrl: authUser.user_metadata?.avatar_url,
                    role: 'client'
                };
                setUser(fallbackUser);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Initialize edit form when user loads
    useEffect(() => {
        if (user) {
            setEditName(user.name);
            setEditPhone(user.phone || '');
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        if (!user) return;
        setLoading(true);
        // Mock API call to update profile
        const { error } = await supabase.auth.updateUser({
            data: { name: editName, phone: editPhone }
        });

        if (!error) {
            setUser({ ...user, name: editName, phone: editPhone });
            Alert.alert('Success', 'Profile updated successfully');
            setEditProfileModalVisible(false);
        } else {
            Alert.alert('Error', 'Failed to update profile');
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    await supabase.auth.signOut();
                    router.replace('/auth/login');
                }
            }
        ]);
    };

    const handleAddCard = async () => {
        if (!user || !cardNumber || !expiry || !cvc || !holderName) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        setLoading(true);
        // Simple validation or formatting could happen here
        const newCard = await Api.addCard(user.id, {
            last4: cardNumber.slice(-4),
            brand: 'visa', // Mock brand detection
            expiry: expiry,
            holderName: holderName
        });
        setLoading(false);

        if (newCard) {
            setCards(prev => [...prev, newCard]);
            setAddCardMode(false);
            setCardNumber(''); setExpiry(''); setCvc(''); setHolderName('');
            Alert.alert("Success", "Card added successfully.");
        } else {
            Alert.alert("Error", "Failed to add card.");
        }
    };

    const handleDeleteCard = async (id: string) => {
        const success = await Api.deleteCard(id);
        if (success) {
            setCards(prev => prev.filter(c => c.id !== id));
        } else {
            Alert.alert("Error", "Failed to delete card.");
        }
    };

    const handleUpdatePin = async () => {
        if (!newPin || newPin.length !== 6) {
            setPinError("PIN must be 6 digits.");
            return;
        }

        if (!user) return;

        setLoading(true);
        const success = await Api.updateTransactionPin(user.id, newPin);
        setLoading(false);

        if (success) {
            Alert.alert("Success", "PIN Updated Successfully");
            setPinModalVisible(false);
            setNewPin('');
            setPinError('');
        } else {
            setPinError("Failed to update PIN.");
        }
    };

    const MenuCard = ({ icon: Icon, title, onPress }: { icon: any, title: string, onPress: () => void }) => (
        <Card onPress={onPress} style={[styles.menuCard, { borderColor: isDark ? colors.accentBorder : '#ffe4e6', backgroundColor: isDark ? colors.bgCard : '#fff' }]} noPadding>
            <View style={styles.menuRow}>
                <View style={styles.menuLeft}>
                    <Icon size={18} color={colors.accent} />
                    <Text style={[styles.menuText, { color: isDark ? colors.text900 : '#111827' }]}>{title}</Text>
                </View>
                <ChevronRight size={14} color={isDark ? colors.text400 : '#9ca3af'} />
            </View>
        </Card>
    );

    if (!user) return <View style={styles.container} />;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatarWrapper, { backgroundColor: isDark ? colors.bgCard : '#f9fafb' }]}>
                            <UserIcon size={40} color={colors.accent} />
                        </View>
                        <TouchableOpacity onPress={() => setEditProfileModalVisible(true)} style={[styles.editBadge, { backgroundColor: colors.accent }]}>
                            <Edit2 size={12} color={isDark ? '#000000' : '#ffffff'} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.name, { color: isDark ? colors.text900 : '#111827' }]}>{user.name}</Text>
                    <Text style={styles.email}>{user.email}</Text>
                </View>

                {/* Menu */}
                <View style={styles.menuContainer}>
                    <MenuCard
                        icon={UserIcon}
                        title="Personal Details"
                        onPress={() => setEditProfileModalVisible(true)}
                    />
                    <MenuCard
                        icon={CreditCard}
                        title="Payment Methods"
                        onPress={() => setPaymentModalVisible(true)}
                    />
                    <MenuCard
                        icon={Lock}
                        title="Transaction PIN"
                        onPress={() => setPinModalVisible(true)}
                    />
                    <MenuCard
                        icon={Settings}
                        title="Preferences"
                        onPress={() => Alert.alert('Preferences')}
                    />
                    <MenuCard
                        icon={HelpCircle}
                        title="Help & Support"
                        onPress={() => Alert.alert('Help')}
                    />
                </View>

                <Button
                    variant="outline"
                    onPress={handleLogout}
                    style={[styles.logoutButton, { borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca', backgroundColor: isDark ? 'transparent' : '#fff' }]}
                    textStyle={styles.logoutText}
                >
                    <View style={styles.logoutContent}>
                        <LogOut size={16} color="#ef4444" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </View>
                </Button>
            </ScrollView>


            {/* Payment Methods - Now Centered & Transparent */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={paymentModalVisible}
                onRequestClose={() => setPaymentModalVisible(false)}
            >
                <View style={[styles.modalOverlay]}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? colors.bgCard : '#fff' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: isDark ? colors.text900 : '#111827' }]}>Payment Methods</Text>
                            <TouchableOpacity onPress={() => {
                                if (addCardMode) setAddCardMode(false);
                                else setPaymentModalVisible(false);
                            }}>
                                <X size={20} color={isDark ? colors.text600 : '#6b7280'} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ maxHeight: 500 }}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {!addCardMode ? (
                                    <>
                                        {cards.map(card => (
                                            <View key={card.id} style={[styles.cardItem, { backgroundColor: isDark ? colors.bgSecondary : '#fff', borderColor: isDark ? colors.border : '#e5e7eb' }]}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    <View style={{ width: 40, height: 25, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
                                                    <View>
                                                        <Text style={[styles.cardLast4, { color: isDark ? colors.text900 : '#000' }]}>•••• {card.last4}</Text>
                                                        <Text style={styles.cardExpiry}>Expires {card.expiry}</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity onPress={() => handleDeleteCard(card.id)}>
                                                    <Trash2 size={18} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}

                                        <TouchableOpacity
                                            style={[styles.addCardBtn, { borderColor: isDark ? colors.border : '#e5e7eb' }]}
                                            onPress={() => setAddCardMode(true)}
                                        >
                                            <Plus size={20} color={isDark ? colors.text600 : '#6b7280'} />
                                            <Text style={[styles.addCardText, { color: isDark ? colors.text600 : '#6b7280' }]}>Add New Card</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <View style={{ gap: 12 }}>
                                        <View>
                                            <Text style={[styles.inputLabel, { color: isDark ? colors.text600 : '#374151' }]}>Card Number</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: isDark ? colors.bgSecondary : '#fff', borderColor: isDark ? colors.border : '#d1d5db', color: isDark ? colors.text900 : '#000' }]}
                                                placeholder="0000 0000 0000 0000"
                                                placeholderTextColor={isDark ? '#525252' : '#9ca3af'}
                                                keyboardType="number-pad"
                                                value={cardNumber}
                                                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                                            />
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.inputLabel, { color: isDark ? colors.text600 : '#374151' }]}>Expiry</Text>
                                                <TextInput
                                                    style={[styles.input, { backgroundColor: isDark ? colors.bgSecondary : '#fff', borderColor: isDark ? colors.border : '#d1d5db', color: isDark ? colors.text900 : '#000' }]}
                                                    placeholder="MM/YY"
                                                    placeholderTextColor={isDark ? '#525252' : '#9ca3af'}
                                                    value={expiry}
                                                    onChangeText={(text) => setExpiry(formatCardExpiry(text))}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.inputLabel, { color: isDark ? colors.text600 : '#374151' }]}>CVC</Text>
                                                <TextInput
                                                    style={[styles.input, { backgroundColor: isDark ? colors.bgSecondary : '#fff', borderColor: isDark ? colors.border : '#d1d5db', color: isDark ? colors.text900 : '#000' }]}
                                                    placeholder="123"
                                                    placeholderTextColor={isDark ? '#525252' : '#9ca3af'}
                                                    keyboardType="number-pad"
                                                    value={cvc}
                                                    onChangeText={setCvc}
                                                />
                                            </View>
                                        </View>
                                        <View>
                                            <Text style={[styles.inputLabel, { color: isDark ? colors.text600 : '#374151' }]}>Cardholder Name</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: isDark ? colors.bgSecondary : '#fff', borderColor: isDark ? colors.border : '#d1d5db', color: isDark ? colors.text900 : '#000' }]}
                                                placeholder="Name on Card"
                                                placeholderTextColor={isDark ? '#525252' : '#9ca3af'}
                                                value={holderName}
                                                onChangeText={setHolderName}
                                            />
                                        </View>
                                        <Button onPress={handleAddCard} loading={loading} style={{ marginTop: 8 }}>
                                            Save Card
                                        </Button>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* PIN Modal (Already Exists - Adding Theme) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={pinModalVisible}
                onRequestClose={() => setPinModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? colors.bgCard : '#fff' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: isDark ? colors.text900 : '#111827' }]}>Update PIN</Text>
                            <TouchableOpacity onPress={() => setPinModalVisible(false)}>
                                <X size={20} color={isDark ? colors.text600 : '#6b7280'} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={[styles.modalSubtitle, { color: isDark ? colors.text600 : '#4b5563' }]}>Set a new 6-digit PIN for Touch 'n Go transactions.</Text>

                            <TextInput
                                style={[
                                    styles.pinInput,
                                    { backgroundColor: isDark ? colors.bgSecondary : '#fff', borderColor: isDark ? colors.border : '#d1d5db', color: isDark ? colors.text900 : '#111827' },
                                    { letterSpacing: newPin.length > 0 ? 6 : 0 }
                                ]}
                                value={newPin}
                                onChangeText={(text) => setNewPin(text.replace(/[^0-9]/g, ''))}
                                placeholder="Enter 6-digit PIN"
                                placeholderTextColor={isDark ? '#525252' : '#9ca3af'}
                                keyboardType="number-pad"
                                maxLength={6}
                                secureTextEntry
                            />

                            {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}

                            <Button
                                onPress={handleUpdatePin}
                                loading={loading}
                                style={styles.saveButton}
                            >
                                Save PIN
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Profile Modal - Now Centered & Transparent */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={editProfileModalVisible}
                onRequestClose={() => setEditProfileModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? colors.bgCard : '#fff' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: isDark ? colors.text900 : '#000' }]}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setEditProfileModalVisible(false)}>
                                <X size={20} color={isDark ? colors.text900 : '#000'} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View>
                                <Text style={[styles.inputLabel, { color: isDark ? colors.text600 : '#374151' }]}>Full Name</Text>
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: isDark ? colors.bgSecondary : '#fff',
                                        borderColor: isDark ? colors.border : '#e5e7eb',
                                        color: isDark ? colors.text900 : '#000'
                                    }]}
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Enter full name"
                                    placeholderTextColor={isDark ? '#525252' : '#9ca3af'}
                                />
                            </View>

                            <View>
                                <Text style={[styles.inputLabel, { color: isDark ? colors.text600 : '#374151' }]}>Phone Number</Text>
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: isDark ? colors.bgSecondary : '#fff',
                                        borderColor: isDark ? colors.border : '#e5e7eb',
                                        color: isDark ? colors.text900 : '#000'
                                    }]}
                                    value={editPhone}
                                    onChangeText={setEditPhone}
                                    placeholder="Enter phone number"
                                    keyboardType="phone-pad"
                                    placeholderTextColor={isDark ? '#525252' : '#9ca3af'}
                                />
                            </View>

                            <Button style={{ marginTop: 8 }} onPress={handleUpdateProfile} loading={loading}>
                                Save Changes
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb', // Gray 50
    },
    content: {
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 16, // 24 -> 16
        marginTop: 10,
    },
    avatarContainer: {
        marginBottom: 12, // 16 -> 12
        position: 'relative',
    },
    avatarWrapper: {
        width: 96, // 112 -> 96
        height: 96, // 112 -> 96
        borderRadius: 48,
        backgroundColor: '#e5e7eb', // Gray 200
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#ffffff',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        // backgroundColor set dynamically in component
        padding: 6,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#ffffff',
    },
    name: {
        fontSize: 20, // 24 -> 20
        fontWeight: '700',
        color: '#111827', // Gray 900
        marginBottom: 2,
    },
    email: {
        fontSize: 12, // 14 -> 12
        color: '#6b7280', // Gray 500
    },
    menuContainer: {
        paddingHorizontal: 16, // 20 -> 16
        gap: 8, // 12 -> 8
    },
    menuCard: {
        borderWidth: 1,
        borderColor: '#ffe4e6', // Rose 100
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12, // 16 -> 12
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10, // 12 -> 10
    },
    menuText: {
        fontSize: 14, // 16 -> 14
        fontWeight: '500',
        color: '#111827',
    },
    logoutButton: {
        marginHorizontal: 16, // 20 -> 16
        marginTop: 20, // 24 -> 20
        borderColor: '#fecaca', // Red 200
        backgroundColor: '#ffffff',
        height: 40,
        minHeight: 40,
    },
    logoutContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoutText: {
        color: '#ef4444', // Red 500
        fontSize: 14,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '90%',
        maxWidth: 360,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24, // Added more padding
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    modalBody: {
        gap: 12,
    },
    modalSubtitle: {
        fontSize: 12,
        color: '#4b5563',
    },
    pinInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        padding: 8,
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 6,
        color: '#111827',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 10,
        textAlign: 'center',
        fontWeight: '600',
    },
    saveButton: {
        marginTop: 4,
        height: 36,
        minHeight: 36,
    },
    // Payment Methods Styles
    modalContainer: {
        flex: 1,
    },
    cardItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 12,
    },
    cardLast4: {
        fontSize: 14,
        fontWeight: '700',
    },
    cardExpiry: {
        fontSize: 12,
        color: '#6b7280',
    },
    addCardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 12,
        gap: 8,
    },
    addCardText: {
        fontSize: 14,
        fontWeight: '600',
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
    }
});
