import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Receipt } from '@/types';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

interface ReceiptCardProps {
    receipt: Receipt;
}

export const ReceiptCard = ({ receipt }: ReceiptCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    const getFormattedDateTime = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            let d = new Date(dateStr);

            // Handle SQL timestamps used by React DOM (e.g. "2023-12-17 14:00:00")
            if (isNaN(d.getTime())) {
                d = new Date(dateStr.replace(' ', 'T'));
            }

            // If still invalid, return raw string
            if (isNaN(d.getTime())) return dateStr;

            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();

            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');

            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <Card style={[styles.card, { backgroundColor: isDark ? colors.bgCard : '#fff', borderColor: isDark ? colors.border : '#e5e7eb', borderWidth: 1 }]} noPadding>
            <View style={[styles.header, { backgroundColor: isDark ? colors.bgSecondary : '#f3f4f6', borderBottomColor: isDark ? colors.border : '#e5e7eb' }]}>
                <View style={styles.logo}>
                    <Text style={styles.logoText}>L</Text>
                </View>
                <Text style={[styles.brand, { color: isDark ? colors.text900 : '#111827' }]}>LUMINA SALON</Text>
                <Text style={styles.subtitle}>Payment Receipt</Text>
            </View>

            <View style={styles.content}>
                <Row label="Receipt No." value={receipt.id} valueStyle={styles.mono} isDark={isDark} colors={colors} />
                <Row label="Booking Date" value={getFormattedDateTime(receipt.bookingDate)} isDark={isDark} colors={colors} />
                <Row label="Appt Date" value={getFormattedDateTime(receipt.appointmentDate)} isDark={isDark} colors={colors} />
                <Row label="Payment Method" value={receipt.paymentMethod === 'card' ? 'Credit Card' : receipt.paymentMethod === 'tng' ? "Touch 'n Go" : receipt.paymentMethod} isDark={isDark} colors={colors} />

                <View style={[styles.divider, { backgroundColor: isDark ? colors.border : '#f3f4f6' }]} />

                <Text style={styles.sectionTitle}>Service Details</Text>
                <View style={styles.row}>
                    <Text style={[styles.serviceName, { color: isDark ? colors.text900 : '#111827' }]}>{receipt.serviceName}</Text>
                    <Text style={[styles.price, { color: isDark ? colors.text900 : '#111827' }]}>RM {((receipt.servicePriceCents || receipt.totalCents) / 100).toFixed(2)}</Text>
                </View>
                <Text style={styles.stylist}>Stylist: {receipt.staffName}</Text>

                {receipt.surchargeCents && receipt.surchargeCents > 0 ? (
                    <View style={styles.row}>
                        <Text style={styles.label}>Stylist Surcharge</Text>
                        <Text style={[styles.value, { color: isDark ? colors.text900 : '#111827' }]}>RM {(receipt.surchargeCents / 100).toFixed(2)}</Text>
                    </View>
                ) : null}

                <View style={[styles.divider, { backgroundColor: isDark ? colors.border : '#f3f4f6' }]} />

                <View style={styles.summary}>
                    <Row label="Subtotal" value={`RM ${(((receipt.servicePriceCents || receipt.totalCents) + (receipt.surchargeCents || 0)) / 100).toFixed(2)}`} bold isDark={isDark} colors={colors} />
                    <Row label="SST (8%)" value={`RM ${(receipt.sstCents ? receipt.sstCents / 100 : 0).toFixed(2)}`} isDark={isDark} colors={colors} />

                    {receipt.discountCents > 0 && (
                        <View style={styles.row}>
                            <Text style={styles.discountLabel}>Voucher Discount</Text>
                            <Text style={styles.discountValue}>- RM {(receipt.discountCents / 100).toFixed(2)}</Text>
                        </View>
                    )}

                    {receipt.roundingCents !== undefined && receipt.roundingCents !== 0 && (
                        <Row label="Rounding Adjustment" value={`${receipt.roundingCents > 0 ? '+' : ''}RM ${(receipt.roundingCents / 100).toFixed(2)}`} isDark={isDark} colors={colors} />
                    )}

                    <View style={[styles.totalRow, { borderTopColor: isDark ? colors.border : '#e5e7eb' }]}>
                        <Text style={styles.totalLabel}>Total Payable</Text>
                        <Text style={styles.totalValue}>RM {(receipt.depositCents / 100).toFixed(2)}</Text>
                    </View>
                </View>
            </View>

            {/* Decorative bottom */}
            <View style={[styles.bottomDeco, { backgroundColor: isDark ? colors.bgSecondary : '#f3f4f6' }]} />
        </Card>
    );
};

const Row = ({ label, value, bold, valueStyle, isDark, colors }: { label: string, value: string, bold?: boolean, valueStyle?: any, isDark: boolean, colors: any }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, bold && styles.bold, valueStyle, { color: isDark ? colors.text900 : '#111827' }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        overflow: 'hidden'
    },
    header: {
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderStyle: 'dashed',
    },
    logo: {
        width: 32,
        height: 32,
        backgroundColor: Colors.light.rose500,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    logoText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    brand: {
        fontSize: 14,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 10,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    content: {
        padding: 24,
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        color: '#6b7280',
    },
    value: {
        fontSize: 12,
        fontWeight: '500',
    },
    mono: {
        fontFamily: 'monospace',
    },
    bold: {
        fontWeight: '700',
    },
    divider: {
        height: 1,
        marginVertical: 8,
    },
    sectionTitle: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    serviceName: {
        fontSize: 14,
        fontWeight: '700',
    },
    price: {
        fontSize: 14,
        fontWeight: '500',
    },
    stylist: {
        fontSize: 12,
        color: '#9ca3af',
    },
    summary: {
        gap: 8,
    },
    discountLabel: {
        fontSize: 12,
        color: '#16a34a', // Green 600
    },
    discountValue: {
        fontSize: 12,
        color: '#16a34a',
        fontWeight: '700',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderStyle: 'dashed',
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.rose500,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.light.rose500,
    },
    bottomDeco: {
        height: 12,
        width: '100%',
    },
});
