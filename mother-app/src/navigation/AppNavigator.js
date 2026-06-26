import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import CountyLogo from '../components/CountyLogo';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MonitoringScreen from '../screens/MonitoringScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterMotherScreen from '../screens/RegisterMotherScreen';
import FacilitiesScreen from '../screens/FacilitiesScreen';
import HealthTipsScreen from '../screens/HealthTipsScreen';
import MotherSignupScreen from '../screens/MotherSignupScreen';
import PregnancyDiaryScreen from '../screens/PregnancyDiaryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#C0392B',
        tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
            paddingBottom: 8,
            paddingTop: 8,
            minHeight: 60,
          },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('home'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Monitoring"
        component={MonitoringScreen}
        options={{
          tabBarLabel: t('monitoring'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarLabel: t('appointments'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📅</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('profile'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading, user } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F8F0' }}>
        <CountyLogo size={80} />
        <ActivityIndicator size="large" color="#006633" style={{ marginTop: 24 }} />
        <Text style={{ marginTop: 12, color: '#666', fontSize: 16 }}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            {user?.role === 'mother' && !user?.completedOnboarding ? (
              <Stack.Screen name="PregnancyDiary" component={PregnancyDiaryScreen} />
            ) : (
              <Stack.Screen name="Main" component={HomeTabs} />
            )}
            {['chv', 'facility_staff', 'county_admin'].includes(user?.role) && (
              <Stack.Screen name="RegisterMother" component={RegisterMotherScreen} />
            )}
            <Stack.Screen name="Facilities" component={FacilitiesScreen} />
            <Stack.Screen name="HealthTips" component={HealthTipsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="MotherSignup" component={MotherSignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
