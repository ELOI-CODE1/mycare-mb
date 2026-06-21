import React from 'react'
import { Text as RNText, TextProps, StyleSheet } from 'react-native'
import { colors, fontSize, fontWeight } from '../../theme'

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption'

interface Props extends TextProps {
  variant?: Variant
  color?: string
  center?: boolean
  muted?: boolean
}

const variantStyles = StyleSheet.create({
  display: { fontSize: fontSize.display, fontWeight: fontWeight.bold as any },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold as any },
  heading: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold as any },
  body: { fontSize: fontSize.md, fontWeight: fontWeight.regular as any },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as any },
  caption: { fontSize: fontSize.xs, fontWeight: fontWeight.regular as any },
})

export function Text({ variant = 'body', color, center, muted, style, ...rest }: Props) {
  return (
    <RNText
      style={[
        variantStyles[variant],
        { color: color ?? (muted ? colors.textMuted : colors.text) },
        center && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    />
  )
}

export default Text
