import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'

import Login from '../screens/Login'
import SignUp from '../screens/SignUp'
import GirlDashboard from '../screens/GirlDashboard'
import BoyDashboard from '../screens/BoyDashboard'
import ParentDashboard from '../screens/ParentDashboard'
import AdminDashboard from '../screens/AdminDashboard'
import NoRoleScreen from '../screens/NoRoleScreen'

export type RootStackParamList = {
  Login: undefined
  SignUp: undefined
  Home: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

function Splash() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
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
  const { loading, session } = useAuth()

  if (loading) return <Splash />

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
        </>
      ) : (
        <Stack.Screen name="Home" component={RoleRouter} />
      )}
    </Stack.Navigator>
  )
}
