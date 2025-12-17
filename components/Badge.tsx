import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
    status: string;
}

export const Badge = ({ status }: BadgeProps) => {
    const getStyles = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'confirmed') return { bg: '#dcfce7', text: '#14532d', border: '#bbf7d0' }; // Green 100/900/200
        if (s === 'checked-in') return { bg: '#dbeafe', text: '#1e3a8a', border: '#bfdbfe' }; // Blue
        if (s === 'pending') return { bg: '#fef3c7', text: '#78350f', border: '#fde68a' }; // Amber
        if (s === 'cancelled') return { bg: '#fee2e2', text: '#7f1d1d', border: '#fecaca' }; // Red
        if (s === 'completed') return { bg: '#f3f4f6', text: '#000000', border: '#e5e7eb' }; // Gray
        if (s === 'absence') return { bg: '#ffedd5', text: '#7c2d12', border: '#fed7aa' }; // Orange

        return { bg: '#ffe4e6', text: '#4c0519', border: '#fecdd3' }; // Rose (Default)
    };

    const style = getStyles(status);

    return (
        <View style={[styles.container, { backgroundColor: style.bg, borderColor: style.border }]}>
            <Text style={[styles.text, { color: style.text }]}>
                {status.toUpperCase().replace('-', ' ')}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 10,
        fontWeight: '700',
    },
});
