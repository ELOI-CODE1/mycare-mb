import React from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'

import Login from '../screens/Login'
import SignUp from '../screens/SignUp'
import ResetPassword from '../screens/ResetPassword'
import GirlDashboard from '../screens/GirlDashboard'
import BoyDashboard from '../screens/BoyDashboard'
import ParentDashboard from '../screens/ParentDashboard'
import AdminDashboard from '../screens/AdminDashboard'
import NoRoleScreen from '../screens/NoRoleScreen'
import AccountScreen from '../screens/AccountScreen'
import ProfileScreen from '../screens/ProfileScreen'
import SettingsScreen from '../screens/SettingsScreen'
import SecurityScreen from '../screens/SecurityScreen'
import AboutScreen from '../screens/AboutScreen'
import ChildAccounts from '../screens/ChildAccounts'
import ManagedGirlDashboard from '../screens/ManagedGirlDashboard'
import type { Profile } from '../context/AuthContext'

export type RootStackParamList = {
  Login: undefined
  SignUp: undefined
  ResetPassword: undefined
  Home: undefined
  Account: undefined
  Profile: undefined
  Settings: undefined
  Security: undefined
  About: undefined
  ChildAccounts: undefined
  ManagedGirlDashboard: { childProfile: Profile }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

function Splash() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ fontSize: 36, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 }}>
        MyCare+
      </Text>
      <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
    </View>
  )
}

// Renders the dashboard matching the signed-in user's role.
function RoleRouter() {
  const { role } = useAuth()
  switch (role) {
    case 'admin':
      return <AdminDashboard />
    case 'girl':
      return <GirlDashboard />
    case 'boy':
      return <BoyDashboard />
    case 'parent':
      return <ParentDashboard />
    default:
      return <NoRoleScreen />
  }
}

export default function RootNavigator() {
  const { loading, profileLoading, session } = useAuth()

  // Wait for the session check AND (when logged in) the profile/role fetch,
  // so we never flash the "No role assigned" screen on startup.
  if (loading || (session && profileLoading)) return <Splash />

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={RoleRouter} />
          <Stack.Screen
            name="Account"
            component={AccountScreen}
            options={{ headerShown: true, title: 'Account', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: true, title: 'My Profile', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: true, title: 'Settings', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="Security"
            component={SecurityScreen}
            options={{ headerShown: true, title: 'Security & Privacy', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{ headerShown: true, title: 'About MyCare+', headerBackTitle: 'Back' }}
          />
        </>
      )}
    </Stack.Navigator>
  )
}
