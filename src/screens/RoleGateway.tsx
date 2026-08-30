import React, { useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import RoleSelection from './RoleSelection'
import { useAuth } from '../context/AuthContext'

export default function RoleGateway() {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  useEffect(() => {
    if (!user) return
    if (user.role === 'girl') navigation.replace('GirlDashboard')
    if (user.role === 'boy') navigation.replace('BoyDashboard')
    if (user.role === 'parent') navigation.replace('ParentDashboard')
  }, [navigation, user])
  return <RoleSelection onSelectRole={() => undefined} />
}
