import React from 'react'
import { useNavigation } from '@react-navigation/native'
import RoleSelection from './RoleSelection'

export default function RoleGateway() {
  const navigation = useNavigation<any>()
  return <RoleSelection onSelectRole={(role) => navigation.navigate({ girl: 'GirlDashboard', boy: 'BoyDashboard', parent: 'ParentDashboard' }[role])} />
}
