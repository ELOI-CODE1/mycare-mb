import React from 'react'
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native'
import { Text } from './Text'
import { colors, radius, spacing, fontSize, fontWeight } from '../../theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface Props {
  title: string
  onPress?: (e: GestureResponderEvent) => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  /** Override the fill/text accent (e.g. per-role color). Applies to `primary`. */
  accent?: string
  fullWidth?: boolean
  style?: ViewStyle
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accent = colors.primary,
  fullWidth = true,
  style,
}: Props) {
  const isDisabled = disabled || loading

  const bg =
    variant === 'primary'
      ? accent
      : variant === 'danger'
      ? colors.danger
      : variant === 'secondary'
      ? colors.gray100
      : 'transparent'

  const textColor =
    variant === 'secondary' ? colors.text : variant === 'ghost' ? accent : colors.textInverse

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        { backgroundColor: bg },
        fullWidth && { alignSelf: 'stretch' },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={{ color: textColor, fontSize: fontSize.md, fontWeight: fontWeight.semibold as any }}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
})

export default Button
