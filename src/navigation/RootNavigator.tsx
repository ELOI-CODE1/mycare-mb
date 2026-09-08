import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import Login from '../screens/Login'
import SignUp from '../screens/SignUp'
import ResetPassword from '../screens/ResetPassword'
import RoleGateway from '../screens/RoleGateway'
import AdminDashboard from '../screens/AdminDashboard'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'

export type RootStackParamList = {
  Login: undefined
  SignUp: undefined
  ResetPassword: undefined
  RoleGateway: undefined
  GirlDashboard: undefined
  BoyDashboard: undefined
  ParentDashboard: undefined
  AdminDashboard: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  const { user, loading } = useAuth()
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? <>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
      </> : user.role === 'admin' ? <Stack.Screen name="AdminDashboard" component={AdminDashboard} /> : <Stack.Screen name="RoleGateway" component={RoleGateway} />}
    </Stack.Navigator>
  )
}
