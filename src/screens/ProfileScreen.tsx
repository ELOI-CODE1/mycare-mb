import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Text, Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { colors, spacing, radius, roleAccent, roleColors, type Role } from '../theme'

type IconName = keyof typeof Ionicons.glyphMap

function Field({ icon, label, value }: { icon: IconName; label: string; value?: string | null }) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={18} color={colors.gray500} style={{ marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" muted>
          {label}
        </Text>
        <Text variant="body">{value || '—'}</Text>
      </View>
    </View>
  )
}

export default function ProfileScreen() {
  const { profile, role } = useAuth()
  const accent = roleAccent(role)
  const soft = (role && roleColors[role as Role]?.soft) || colors.gray100
  const joined = profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'

  return (
    <Screen topInset={false}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: soft }]}>
          <Ionicons name="person" size={40} color={accent} />
        </View>
        <Text variant="title" center>
          {profile?.full_name || 'My Profile'}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: soft }]}>
          <Text variant="caption" color={accent} style={{ textTransform: 'capitalize' }}>
            {role || 'user'}
          </Text>
        </View>
      </View>

      <Card>
        <Field icon="person-outline" label="Full name" value={profile?.full_name} />
        <Divider />
        <Field icon="mail-outline" label="Email" value={profile?.email} />
        <Divider />
        <Field icon="call-outline" label="Phone" value={profile?.phone} />
        <Divider />
        <Field icon="calendar-outline" label="Member since" value={joined} />
      </Card>

      <Text variant="caption" muted center style={{ marginTop: spacing.md }}>
        To update your details, please contact support.
      </Text>
    </Screen>
  )
}

function Divider() {
  return <View style={styles.divider} />
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  field: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  divider: { height: 1, backgroundColor: colors.gray100, marginVertical: spacing.xs },
})
