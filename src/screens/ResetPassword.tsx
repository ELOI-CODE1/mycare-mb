import React, { useState } from 'react'
import { View, Alert, TouchableOpacity, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Screen, Text, Input, Button, PasswordField } from '../components/ui'
import { colors, spacing } from '../theme'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { useAuth } from '../context/AuthContext'

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>

export default function ResetPassword({ navigation, route }: Props) {
  const { requestPasswordReset, confirmPasswordReset } = useAuth()
  const initialToken = (route.params as { token?: string } | undefined)?.token ?? ''
  const [email, setEmail] = useState('')
  const [token, setToken] = useState(initialToken)
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState(initialToken ? 'Enter a new password to finish resetting your account.' : '')

  const handleRequest = async () => {
    const target = email.trim()
    if (!target) {
      Alert.alert('Enter email', 'Please enter your email to receive a reset link.')
      return
    }
    setLoading(true)
    try {
      const message = await requestPasswordReset(target)
      setInfo(message)
    } catch (e) {
      Alert.alert('Could not send reset link', e instanceof Error ? e.message : 'Please try again.')
    } finally { setLoading(false) }
  }

  const handleConfirm = async () => {
    if (!token.trim()) {
      Alert.alert('Missing reset token', 'Paste the token from your reset email, or request a new link.')
      return
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak password', 'Use at least 8 characters.')
      return
    }
    if (newPassword !== confirm) {
      Alert.alert('Passwords do not match', 'Re-enter the same password twice.')
      return
    }
    setLoading(true)
    try {
      const message = await confirmPasswordReset(token.trim(), newPassword)
      Alert.alert('Password reset', message, [{ text: 'Back to login', onPress: () => navigation.navigate('Login') }])
    } catch (e) {
      Alert.alert('Reset failed', e instanceof Error ? e.message : 'Please request a new link.')
    } finally { setLoading(false) }
  }

  return (
    <Screen scroll background={colors.surface}>
      <View style={{ flex: 1, justifyContent: 'center', minHeight: 360 }}>
        <Text variant="title" center style={{ marginBottom: spacing.sm }}>
          Reset password
        </Text>
        <Text muted center style={{ marginBottom: spacing.lg }}>
          Request a secure link by email, then set a new password. Links expire after 60 minutes and stop working after use.
        </Text>

        {info ? <Text center style={styles.info}>{info}</Text> : null}

        <Text variant="label" style={styles.section}>1 · Request link</Text>
        <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Button title="Send reset link" onPress={handleRequest} loading={loading} />

        <Text variant="label" style={styles.section}>2 · Set new password</Text>
        <Input label="Reset token" placeholder="Paste token from email" value={token} onChangeText={setToken} autoCapitalize="none" />
        <PasswordField label="New password" placeholder="••••••••" value={newPassword} onChangeText={setNewPassword} />
        <PasswordField label="Confirm password" placeholder="••••••••" value={confirm} onChangeText={setConfirm} />
        <Button title="Set new password" onPress={handleConfirm} loading={loading} variant="secondary" />

        <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('Login')}>
          <Text color={colors.primary}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  backRow: { marginTop: spacing.lg, alignItems: 'center' },
  section: { marginTop: spacing.xl, marginBottom: spacing.sm },
  info: { marginBottom: spacing.md, lineHeight: 20 },
})
