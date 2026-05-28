import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import CountyLogo from '../components/CountyLogo';

import LoginScreen from '../screens/LoginScreen';
import CHVHomeScreen from '../screens/HomeScreen';
import HomeVisitScreen from '../screens/HomeVisitScreen';
import RegisterPregnancyScreen from '../screens/RegisterPregnancyScreen';
import MothersScreen from '../screens/MothersScreen';
import MotherDetailScreen from '../screens/MotherDetailScreen';
import ReferralsScreen from '../screens/ReferralsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F8F0' }}>
        <CountyLogo size={80} />
        <ActivityIndicator size="large" color="#006633" style={{ marginTop: 24 }} />
        <Text style={{ marginTop: 12, color: '#666', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Home" component={CHVHomeScreen} />
            <Stack.Screen name="HomeVisits" component={HomeVisitScreen} />
            <Stack.Screen name="RegisterPregnancy" component={RegisterPregnancyScreen} />
            <Stack.Screen name="Mothers" component={MothersScreen} />
            <Stack.Screen name="MotherDetail" component={MotherDetailScreen} />
            <Stack.Screen name="Referrals" component={ReferralsScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
