import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View, StyleProp } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps {
    children: React.ReactNode;
    onPress?: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'glass';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
}

export const Button = ({
    children,
    onPress,
    variant = 'primary',
    style,
    textStyle,
    disabled = false,
    loading = false,
    icon,
}: ButtonProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    const getBackgroundColor = () => {
        if (disabled) return '#e5e7eb'; // Gray 200
        switch (variant) {
            case 'primary': return colors.accent;
            case 'secondary': return isDark ? colors.bgCard : '#ffffff';
            case 'outline': return 'transparent';
            case 'glass': return 'rgba(255, 255, 255, 0.2)';
            default: return colors.accent;
        }
    };

    const getTextColor = () => {
        if (disabled) return '#9ca3af'; // Gray 400
        switch (variant) {
            case 'primary': return isDark ? '#000000' : '#ffffff';
            case 'secondary': return isDark ? colors.text900 : '#000000';
            case 'outline': return colors.accent;
            case 'glass': return '#ffffff';
            default: return '#ffffff';
        }
    };

    const getBorder = () => {
        if (variant === 'outline') return { borderWidth: 2, borderColor: colors.accent };
        if (variant === 'secondary') return { borderWidth: 1, borderColor: isDark ? colors.accent : '#ffe4e6' };
        if (variant === 'glass') return { borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' };
        return {};
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor(), shadowColor: colors.accent },
                getBorder(),
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <View style={styles.contentContainer}>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                        {children}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    iconContainer: {
        marginRight: 6,
    },
    text: {
        fontWeight: '600',
        fontSize: 16,
    },
});
