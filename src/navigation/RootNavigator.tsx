import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import Login from '../screens/Login'
import SignUp from '../screens/SignUp'
import ResetPassword from '../screens/ResetPassword'
import RoleGateway from '../screens/RoleGateway'
import GirlDashboard from '../screens/GirlDashboard'
import BoyDashboard from '../screens/BoyDashboard'
import ParentDashboard from '../screens/ParentDashboard'
import AdminDashboard from '../screens/AdminDashboard'

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
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen name="RoleGateway" component={RoleGateway} />
      <Stack.Screen name="GirlDashboard" component={GirlDashboard} />
      <Stack.Screen name="BoyDashboard" component={BoyDashboard} />
      <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
    </Stack.Navigator>
  )
}
