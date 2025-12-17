import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, TextInputProps, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface AuthInputProps extends TextInputProps {
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onRightIconPress?: () => void;
}

export const AuthInput = ({ icon, rightIcon, onRightIconPress, style, ...props }: AuthInputProps) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;

    return (
        <View style={styles.container}>
            {icon && <View style={styles.iconLeft}>{icon}</View>}
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: isDark ? colors.bgCard : '#fff',
                        borderColor: colors.border,
                        color: colors.text900,
                    },
                    icon ? { paddingLeft: 44 } : { paddingLeft: 16 },
                    rightIcon ? { paddingRight: 44 } : { paddingRight: 16 },
                    style
                ]}
                placeholderTextColor={colors.text400}
                {...props}
            />
            {rightIcon && (
                <TouchableOpacity onPress={onRightIconPress} style={styles.iconRight}>
                    {rightIcon}
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        position: 'relative',
        justifyContent: 'center',
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        fontSize: 14,
    },
    iconLeft: {
        position: 'absolute',
        left: 14,
        zIndex: 1,
    },
    iconRight: {
        position: 'absolute',
        right: 14,
        zIndex: 1,
        padding: 4,
    },
});
