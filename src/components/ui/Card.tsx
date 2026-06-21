import React from 'react'
import { View, ViewProps, StyleSheet } from 'react-native'
import { colors, radius, spacing, shadow } from '../../theme'

interface Props extends ViewProps {
  padded?: boolean
}

export function Card({ padded = true, style, children, ...rest }: Props) {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  padded: { padding: spacing.lg },
})

export default Card
