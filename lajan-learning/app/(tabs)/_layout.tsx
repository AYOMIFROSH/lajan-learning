import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import colors from '@/constants/colors';
import { Home, Search, DollarSign, Bell, User } from 'lucide-react-native';
import { useAuthStore } from '@/store/auth-store';
import AgeInputPopup from '@/components/AgeInputPopUp';

export default function TabLayout() {
  const { needsAgeInput } = useAuthStore();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.darkGray,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: Platform.OS === 'ios' ? 90 : 60,
            paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: colors.light,
          },
          headerTintColor: colors.dark,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Home size={size} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, size }) => (
              <Search size={size} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="offerings"
          options={{
            title: 'Offerings',
            tabBarIcon: ({ color, size }) => (
              <DollarSign size={size} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            tabBarIcon: ({ color, size }) => (
              <Bell size={size} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <User size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      
      {/* Age Input Popup for existing users */}
      <AgeInputPopup visible={needsAgeInput} />
    </>
  );
}