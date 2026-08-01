import React, { useState } from 'react'
import { View, Alert, TouchableOpacity, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Screen, Text, Input, Button } from '../components/ui'
import { supabase } from '../lib/supabase'
import { colors, spacing } from '../theme'
import type { RootStackParamList } from '../navigation/RootNavigator'

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>

export default function ResetPassword({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    const target = email.trim()
    if (!target) {
      Alert.alert('Enter email', 'Please enter your email to receive a reset link.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(target)
    setLoading(false)
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    Alert.alert('Email sent', 'Check your inbox for the password reset link.')
    navigation.navigate('Login')
  }

  return (
    <Screen background={colors.surface}>
      <View style={{ flex: 1, justifyContent: 'center', minHeight: 360 }}>
        <Text variant="title" center style={{ marginBottom: spacing.sm }}>
          Reset password
        </Text>
        <Text muted center style={{ marginBottom: spacing.lg }}>
          Enter the email address for your account and we'll send a reset link.
        </Text>

        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Button title="Send reset link" onPress={handleSend} loading={loading} />

        <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('Login')}>
          <Text color={colors.primary}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  backRow: { marginTop: spacing.lg, alignItems: 'center' },
})
