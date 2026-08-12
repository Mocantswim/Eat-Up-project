import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import CustomSportsScreen from '../screens/CustomSportsScreen';
import CustomSportFormScreen from '../screens/CustomSportFormScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import AboutScreen from '../screens/AboutScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="CustomSports" component={CustomSportsScreen} />
      <Stack.Screen name="CustomSportForm" component={CustomSportFormScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
}
