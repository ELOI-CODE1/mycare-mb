import React from 'react'
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing } from '../../theme'

interface Props {
  children: React.ReactNode
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean
  /** Apply default horizontal/vertical padding (default true). */
  padded?: boolean
  background?: string
  style?: ViewStyle
}

export function Screen({ children, scroll = true, padded = true, background, style }: Props) {
  const insets = useSafeAreaInsets()
  const containerStyle = [
    styles.container,
    { backgroundColor: background ?? colors.background, paddingTop: insets.top },
    style,
  ]
  const contentPad = padded ? { padding: spacing.lg } : undefined

  if (scroll) {
    return (
      <ScrollView
        style={containerStyle}
        contentContainerStyle={[contentPad, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    )
  }

  return <View style={[containerStyle, contentPad, { flex: 1 }]}>{children}</View>
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

export default Screen
