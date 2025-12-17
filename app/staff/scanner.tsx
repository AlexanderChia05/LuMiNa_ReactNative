import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert, Animated, Easing } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { Api } from '@/services/api';
import { supabase } from '@/services/supabase';
import { Staff } from '@/types';
import { Colors } from '@/constants/Colors';
// @ts-ignore
import { CheckCircle, X, ChevronRight, ScanLine } from 'lucide-react-native';

export default function StaffScanner() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanResult, setScanResult] = useState('');
    const [manualCode, setManualCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [staff, setStaff] = useState<Staff | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Animation for scan line
    const scanAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
                Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true })
            ])
        ).start();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            setIsFocused(true);
            loadStaff();
            return () => {
                setIsFocused(false);
                setScanned(false);
                setStatus('idle');
            };
        }, [])
    );

    const loadStaff = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
            const s = await Api.getStaffByEmail(user.email);
            setStaff(s || null);
        }
    };

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned || status !== 'idle') return;

        let refId = data;
        try {
            if (data.startsWith('{') || data.startsWith('%7B')) {
                const decoded = decodeURIComponent(data);
                const json = JSON.parse(decoded);
                if (json.id) refId = json.id;
            } else if (data.startsWith('MEMBER:')) {
                // Handle member QR if needed, but requirements say "Check-in Client" usually means Appt Ref ID
                // The prototype logic line 158: just uses data as RefId or JSON id.
            }
        } catch (e) { }

        processScan(refId);
    };

    const handleManualSubmit = () => {
        if (!manualCode) return;
        processScan(manualCode);
    };

    const processScan = async (refId: string) => {
        if (!staff) return;
        setScanned(true);

        const { success, message } = await Api.markAppointmentPresence(refId, staff.id);

        setStatus(success ? 'success' : 'error');
        setMessage(message);
        setScanResult(refId);

        setTimeout(() => {
            if (success) {
                // Reset
                setStatus('idle');
                setScanned(false);
                setManualCode('');
            } else {
                setStatus('idle');
                setScanned(false);
            }
        }, 3000);
    };

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Text style={{ marginBottom: 10 }}>Camera permission required</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.btn}><Text style={{ color: '#fff' }}>Grant Permission</Text></TouchableOpacity>
            </View>
        );
    }

    const scanLineTranslateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 280] // Roughly height of container
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Check-in Client</Text>
                    <Text style={styles.subtitle}>Scan QR code or enter Ref ID</Text>
                </View>

                {/* Camera Square */}
                <View style={styles.cameraContainer}>
                    {isFocused && (
                        <CameraView
                            style={styles.camera}
                            facing="back"
                            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        />
                    )}

                    {/* Overlay Borders */}
                    <View style={styles.overlay}>
                        <View style={[styles.corner, styles.tl]} />
                        <View style={[styles.corner, styles.tr]} />
                        <View style={[styles.corner, styles.bl]} />
                        <View style={[styles.corner, styles.br]} />

                        {/* Scan Line */}
                        {status === 'idle' && (
                            <Animated.View
                                style={[
                                    styles.scanLine,
                                    { transform: [{ translateY: scanLineTranslateY }] }
                                ]}
                            />
                        )}
                    </View>

                    {/* Status Feedback */}
                    {status !== 'idle' && (
                        <View style={[styles.statusOverlay, status === 'success' ? styles.bgBlue : styles.bgRed]}>
                            {status === 'success' ? <CheckCircle size={64} color="#fff" /> : <X size={64} color="#fff" />}
                            <Text style={styles.statusTitle}>{status === 'success' ? 'Checked In!' : 'Error'}</Text>
                            <Text style={styles.statusMsg}>{message}</Text>
                        </View>
                    )}
                </View>

                {/* Manual Input */}
                <View style={styles.manualContainer}>
                    <Text style={styles.manualLabel}>OR ENTER MANUALLY</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            value={manualCode}
                            onChangeText={t => setManualCode(t.toUpperCase())}
                            placeholder="A1234"
                            placeholderTextColor="#9ca3af"
                            maxLength={8}
                        />
                        <TouchableOpacity
                            style={[styles.goBtn, !manualCode && styles.btnDisabled]}
                            onPress={handleManualSubmit}
                            disabled={!manualCode}
                        >
                            <ChevronRight size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 24, alignItems: 'center' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    btn: { padding: 10, backgroundColor: Colors.light.rose500, borderRadius: 8 },
    header: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
    title: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#6b7280' },

    cameraContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 40,
        overflow: 'hidden',
        backgroundColor: '#000',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        position: 'relative',
    },
    camera: { width: '100%', height: '100%' },

    overlay: { position: 'absolute', top: 32, left: 32, right: 32, bottom: 32, pointerEvents: 'none' },
    corner: { position: 'absolute', width: 32, height: 32, borderColor: Colors.light.rose500, borderWidth: 4 },
    tl: { top: 0, left: 0, borderTopLeftRadius: 12, borderRightWidth: 0, borderBottomWidth: 0 },
    tr: { top: 0, right: 0, borderTopRightRadius: 12, borderLeftWidth: 0, borderBottomWidth: 0 },
    bl: { bottom: 0, left: 0, borderBottomLeftRadius: 12, borderRightWidth: 0, borderTopWidth: 0 },
    br: { bottom: 0, right: 0, borderBottomRightRadius: 12, borderLeftWidth: 0, borderTopWidth: 0 },

    scanLine: { width: '100%', height: 4, backgroundColor: Colors.light.rose500, shadowColor: Colors.light.rose500, shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 },

    statusOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 24 },
    bgBlue: { backgroundColor: 'rgba(59, 130, 246, 0.95)' },
    bgRed: { backgroundColor: 'rgba(239, 68, 68, 0.95)' },
    statusTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginTop: 16, marginBottom: 8 },
    statusMsg: { color: 'rgba(255,255,255,0.9)', textAlign: 'center', fontSize: 14, fontWeight: '600' },

    manualContainer: { width: '100%', backgroundColor: '#f9fafb', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#f3f4f6' },
    manualLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', marginBottom: 12, textAlign: 'center', letterSpacing: 1 },
    inputRow: { flexDirection: 'row', gap: 12 },
    input: { flex: 1, backgroundColor: '#fff', height: 56, borderRadius: 16, paddingHorizontal: 16, fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
    goBtn: { width: 56, height: 56, backgroundColor: Colors.light.rose500, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.light.rose500, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
    btnDisabled: { opacity: 0.5, backgroundColor: '#9ca3af', shadowOpacity: 0 },
});
