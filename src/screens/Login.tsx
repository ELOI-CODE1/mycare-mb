import React, { useState } from 'react'
import { View, Alert, TouchableOpacity } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Screen, Text, Input, Button } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { colors, spacing } from '../theme'
import type { RootStackParamList } from '../navigation/RootNavigator'

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>

export default function Login({ navigation }: Props) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      Alert.alert('Login Failed', error)
    }
    // On success the auth state changes and the navigator swaps automatically.
  }

  return (
    <Screen background={colors.surface}>
      <View style={{ flex: 1, justifyContent: 'center', minHeight: 480 }}>
        <Text variant="display" color={colors.primary} center>
          MyCare+
        </Text>
        <Text muted center style={{ marginBottom: spacing.xxl }}>
          Login to your account
        </Text>

        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          onPress={() => {
            const target = email.trim()
            if (!target) return Alert.alert('Enter email', 'Please enter your email to receive a reset link.')
            Alert.alert('Reset password', `Send a password reset link to ${target}?`, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Send',
                onPress: async () => {
                  const { error } = await supabase.auth.resetPasswordForEmail(target)
                  Alert.alert(error ? 'Error' : 'Email sent', error ? error.message : 'Check your inbox for the reset link.')
                },
              },
            ])
          }}
          style={{ alignSelf: 'flex-end', marginTop: spacing.xs, marginBottom: spacing.md }}
        >
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Forgot password?</Text>
        </TouchableOpacity>

        <Button title="Login" onPress={handleLogin} loading={loading} />

        <TouchableOpacity
          style={{ marginTop: spacing.xl, alignItems: 'center' }}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text color={colors.primary}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  )
}
