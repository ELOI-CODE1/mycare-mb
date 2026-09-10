import React, { useState } from 'react'
import { Pressable, StyleSheet, TextInputProps, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Input } from './Input'
import { colors, spacing } from '../../theme'

interface Props extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string
}

// Password entry with an eye toggle so users can verify what they typed.
export default function PasswordField({ label, value, onChangeText, placeholder = '••••••••', ...rest }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <View style={styles.wrap}>
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoCapitalize="none"
        style={styles.input}
        {...rest}
      />
      <Pressable
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        onPress={() => setVisible((v) => !v)}
        style={styles.eye}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.gray500} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  input: { paddingRight: 48 },
  eye: { position: 'absolute', right: spacing.sm, bottom: spacing.lg + 6, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
})
