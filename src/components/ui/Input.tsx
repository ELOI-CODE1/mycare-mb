import React from 'react'
import { View, TextInput, TextInputProps, StyleSheet } from 'react-native'
import { Text } from './Text'
import { colors, radius, spacing, fontSize } from '../../theme'

interface Props extends TextInputProps {
  label?: string
}

export function Input({ label, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.gray400}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.xs, color: colors.gray700 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
})

export default Input
