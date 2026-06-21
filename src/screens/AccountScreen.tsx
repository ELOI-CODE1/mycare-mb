import React from 'react'
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Text, Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { colors, spacing, radius, roleAccent, roleColors, type Role } from '../theme'

type IconName = keyof typeof Ionicons.glyphMap

function MenuRow({
  icon,
  label,
  sublabel,
  onPress,
  tint,
  danger,
}: {
  icon: IconName
  label: string
  sublabel?: string
  onPress: () => void
  tint: string
  danger?: boolean
}) {
  const color = danger ? colors.danger : colors.text
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.redSoft : `${tint}1A` }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger : tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="label" color={color}>
          {label}
        </Text>
        {sublabel ? (
          <Text variant="caption" muted>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {!danger && <Ionicons name="chevron-forward" size={18} color={colors.gray400} />}
    </TouchableOpacity>
  )
}

export default function AccountScreen() {
  const navigation = useNavigation<any>()
  const { profile, role, signOut } = useAuth()
  const accent = roleAccent(role)
  const soft = (role && roleColors[role as Role]?.soft) || colors.gray100

  const confirmLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
    ])
  }

  return (
    <Screen topInset={false}>
      {/* Profile summary */}
      <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Profile')}>
        <Card style={styles.summary}>
          <View style={[styles.avatar, { backgroundColor: soft }]}>
            <Ionicons name="person" size={32} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="heading">{profile?.full_name || 'My Account'}</Text>
            <Text variant="caption" muted>
              {profile?.email || ''}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: soft }]}>
              <Text variant="caption" color={accent} style={{ textTransform: 'capitalize' }}>
                {role || 'user'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
        </Card>
      </TouchableOpacity>

      {/* Menu */}
      <Card padded={false} style={{ overflow: 'hidden' }}>
        <MenuRow
          icon="settings-outline"
          label="Settings"
          sublabel="Notifications and preferences"
          tint={accent}
          onPress={() => navigation.navigate('Settings')}
        />
        <Divider />
        <MenuRow
          icon="shield-checkmark-outline"
          label="Security & Privacy"
          sublabel="Password and account safety"
          tint={accent}
          onPress={() => navigation.navigate('Security')}
        />
        <Divider />
        <MenuRow
          icon="information-circle-outline"
          label="About MyCare+"
          sublabel="App info and support"
          tint={accent}
          onPress={() => navigation.navigate('About')}
        />
      </Card>

      <Card padded={false} style={{ overflow: 'hidden' }}>
        <MenuRow icon="log-out-outline" label="Log Out" tint={accent} danger onPress={confirmLogout} />
      </Card>
    </Screen>
  )
}

function Divider() {
  return <View style={styles.divider} />
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
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
