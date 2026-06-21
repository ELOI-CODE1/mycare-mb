import React from 'react'
import { View } from 'react-native'
import { Screen, Text, Button } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { spacing } from '../theme'

export default function NoRoleScreen() {
  const { role, signOut } = useAuth()
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="heading" center style={{ marginBottom: spacing.sm }}>
          No role assigned
        </Text>
        <Text muted center style={{ marginBottom: spacing.xl }}>
          {role ? `Unrecognized role: ${role}` : 'Your account has no role set. Please contact support.'}
        </Text>
        <Button title="Logout" variant="danger" onPress={signOut} fullWidth={false} />
      </View>
    </Screen>
  )
}
