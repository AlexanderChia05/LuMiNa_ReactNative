import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    noPadding?: boolean;
    onPress?: () => void;
}

export const Card = ({ children, style, noPadding = false, onPress }: CardProps) => {
    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.9}
                style={[
                    styles.card,
                    !noPadding && styles.padding,
                    style
                ]}
            >
                {children}
            </TouchableOpacity>
        );
    }

    return (
        <View
            style={[
                styles.card,
                !noPadding && styles.padding,
                style
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden', // Ensures content respects rounded corners
    },
    padding: {
        padding: 20,
    },
});
