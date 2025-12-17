import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const Avatar = ({ src, size = 'md' }: AvatarProps) => {
    const getSize = () => {
        switch (size) {
            case 'sm': return 32;
            case 'md': return 48;
            case 'lg': return 80;
            default: return 48;
        }
    };

    const s = getSize();

    if (!src || src === 'https://i.pravatar.cc/150') {
        // Fallback placeholder
        return (
            <View style={[styles.fallback, { width: s, height: s, borderRadius: s / 2 }]}>
                <View style={[styles.dot, { width: s / 3, height: s / 3 }]} />
            </View>
        );
    }

    return (
        <Image
            source={{ uri: src }}
            style={{ width: s, height: s, borderRadius: s / 2, borderWidth: 2, borderColor: '#ffffff' }}
            resizeMode="cover"
        />
    );
};

const styles = StyleSheet.create({
    fallback: {
        backgroundColor: '#e5e7eb', // Gray 200
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    dot: {
        backgroundColor: '#9ca3af', // Gray 400
        borderRadius: 999,
    }
});
