import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from './ui'
import { colors, spacing, roleAccent, type Role } from '../theme'

export default function AppHeader({ role }: { role: Role | string }) {
  return (
    <View style={styles.header}>
      <Text variant="heading" color={roleAccent(role)}>MyCare+</Text>
      <Text variant="caption" muted style={{ textTransform: 'capitalize' }}>{role} dashboard</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
