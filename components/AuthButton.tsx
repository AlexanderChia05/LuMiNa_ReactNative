import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ArrowRight } from 'lucide-react-native';

interface AuthButtonProps {
    text: string;
    onPress: () => void;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    showArrow?: boolean;
}

export const AuthButton = ({ text, onPress, loading = false, style, textStyle, showArrow = true }: AuthButtonProps) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: colors.accent, shadowColor: colors.accent },
                style
            ]}
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <>
                    <Text style={[styles.text, textStyle]}>{text}</Text>
                    {showArrow && <ArrowRight size={18} color="#fff" style={styles.arrow} />}
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    text: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    arrow: {
        marginLeft: 8,
    },
});
