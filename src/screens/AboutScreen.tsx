import React from 'react'
import { View, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Text, Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { colors, spacing, radius, roleAccent } from '../theme'

type IconName = keyof typeof Ionicons.glyphMap

const APP_VERSION = '1.0.0'
const SUPPORT_EMAIL = 'support@mycareplus.app'

export default function AboutScreen() {
  const { role } = useAuth()
  const accent = roleAccent(role)

  return (
    <Screen topInset={false}>
      <View style={styles.brand}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <Text variant="title" color={accent}>
          MyCare+
        </Text>
        <Text variant="caption" muted>
          Version {APP_VERSION}
        </Text>
      </View>

      <Card>
        <Text variant="heading" style={{ marginBottom: spacing.sm }}>
          Our mission
        </Text>
        <Text muted>
          MyCare+ makes sexual and reproductive health care private, accessible, and stigma-free —
          helping you track your health and order essentials with confidence and discretion.
        </Text>
      </Card>

      <Card padded={false} style={{ overflow: 'hidden' }}>
        <LinkRow
          icon="mail-outline"
          label="Contact support"
          sublabel={SUPPORT_EMAIL}
          tint={accent}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />
        <Divider />
        <LinkRow
          icon="star-outline"
          label="Rate the app"
          tint={accent}
          onPress={() => {}}
        />
      </Card>

      <Text variant="caption" muted center style={{ marginTop: spacing.lg }}>
        © {new Date().getFullYear()} MyCare+. All rights reserved.
      </Text>
    </Screen>
  )
}

function LinkRow({
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
  brand: { alignItems: 'center', marginBottom: spacing.lg, gap: 4 },
  logo: { width: 72, height: 72, borderRadius: 16, marginBottom: spacing.sm },
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
