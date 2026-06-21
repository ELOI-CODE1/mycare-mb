import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from './Text'
import { colors, spacing } from '../../theme'

interface Props {
  icon?: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
}

export function EmptyState({ icon = 'cube-outline', title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={52} color={colors.gray300} />
      <Text variant="heading" muted center style={{ marginTop: spacing.md }}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="caption" muted center style={{ marginTop: spacing.xs }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 1.5 },
})

export default EmptyState
