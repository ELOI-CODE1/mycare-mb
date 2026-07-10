import React, { useState } from 'react'
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Text, Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { colors, spacing, radius, roleAccent } from '../theme'

type IconName = keyof typeof Ionicons.glyphMap

export default function SecurityScreen() {
  const { profile, role } = useAuth()
  const accent = roleAccent(role)
  const [sending, setSending] = useState(false)

  const changePassword = async () => {
    if (!profile?.email) {
      Alert.alert('Error', 'No email is associated with your account.')
      return
    }
    Alert.alert('Change Password', `We'll email a password reset link to ${profile.email}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Link',
        onPress: async () => {
          setSending(true)
          const { error } = await supabase.auth.resetPasswordForEmail(profile.email)
          setSending(false)
          Alert.alert(
            error ? 'Error' : 'Email Sent',
            error ? error.message : 'Check your inbox for the password reset link.',
          )
        },
      },
    ])
  }

  return (
    <Screen topInset={false}>
      <Text variant="label" muted style={styles.section}>
        ACCOUNT SAFETY
      </Text>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        <ActionRow
          icon="key-outline"
          label="Change password"
          sublabel={sending ? 'Sending reset link…' : 'Reset via email'}
          tint={accent}
          onPress={changePassword}
        />
      </Card>

      <Text variant="label" muted style={[styles.section, { marginTop: spacing.lg }]}>
        PRIVACY
      </Text>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        <ActionRow
          icon="document-text-outline"
          label="Privacy policy"
          tint={accent}
          onPress={() => Alert.alert('Privacy', 'Your data is kept private and is never shared without consent.')}
        />
      </Card>
    </Screen>
  )
}

function ActionRow({
  icon,
  label,
  sublabel,
  tint,
  onPress,
}: {
  icon: IconName
  label: string
  sublabel?: string
  tint: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: `${tint}1A` }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="label">{label}</Text>
        {sublabel ? (
          <Text variant="caption" muted>
            {sublabel}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
    </TouchableOpacity>
  )
}

function Divider() {
  return <View style={styles.divider} />
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.sm, marginLeft: spacing.xs, letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: colors.gray100, marginLeft: 64 },
})
