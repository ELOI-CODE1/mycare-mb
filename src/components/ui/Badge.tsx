import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from './Text'
import { colors, spacing, radius } from '../../theme'

// Order status -> color mapping.
const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#fff4e0', fg: '#b26a00' },
  confirmed: { bg: colors.blueSoft, fg: '#1565c0' },
  shipped: { bg: '#ede7f6', fg: '#5e35b1' },
  delivered: { bg: colors.greenSoft, fg: colors.success },
  cancelled: { bg: colors.redSoft, fg: colors.danger },
}

interface Props {
  label: string
  /** Use a known order status for automatic coloring. */
  status?: string
  bg?: string
  fg?: string
}

export function Badge({ label, status, bg, fg }: Props) {
  const preset = status ? STATUS_STYLE[status.toLowerCase()] : undefined
  const background = bg ?? preset?.bg ?? colors.gray100
  const foreground = fg ?? preset?.fg ?? colors.gray700

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text variant="caption" color={foreground} style={styles.text}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  text: { fontWeight: '600' as any, textTransform: 'capitalize' },
})

export default Badge
