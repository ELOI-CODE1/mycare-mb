import React from 'react'
import RoleSelection from './RoleSelection'
import RoleTabs from '../navigation/RoleTabs'
import { useAuth } from '../context/AuthContext'

export default function RoleGateway() {
  const { user } = useAuth()
  if (!user) return null
  if (user.role === 'girl' || user.role === 'boy' || user.role === 'parent') {
    return <RoleTabs role={user.role} />
  }
  return <RoleSelection onSelectRole={() => undefined} />
}
