import { Tabs } from 'expo-router';
import { Home, Calendar, Bell, User } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

export default function ClientLayout() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = isDark ? Colors.dark : Colors.light;


    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.tabBarInactive,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 25,
                    left: 20,
                    right: 20,
                    backgroundColor: isDark ? '#141414' : '#ffffff',
                    borderRadius: 32,
                    height: 72,
                    borderTopWidth: 0,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    paddingBottom: 0,
                    paddingTop: 0,
                    shadowColor: isDark ? '#000' : '#000',
                    shadowOffset: {
                        width: 0,
                        height: 10,
                    },
                    shadowOpacity: isDark ? 0.5 : 0.1,
                    shadowRadius: 20,
                    elevation: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                tabBarItemStyle: {
                    height: 72,
                    paddingVertical: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    marginTop: 4,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="book_appointment"
                options={{
                    title: 'Book',
                    tabBarIcon: ({ color, size }) => <Calendar color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="alerts"
                options={{
                    title: 'Alerts',
                    tabBarIcon: ({ color, size }) => <Bell color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <User color={color} size={24} />,
                }}
            />

            {/* Hidden Routes - No Tab Bar */}
            <Tabs.Screen
                name="bookings"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="rewards"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
        </Tabs>
    );
}
