import React, { useState } from 'react'
import { View, StyleSheet, Switch } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Text, Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { colors, spacing, radius, roleAccent } from '../theme'

type IconName = keyof typeof Ionicons.glyphMap

function ToggleRow({
  icon,
  label,
  sublabel,
  value,
  onValueChange,
  tint,
}: {
  icon: IconName
  label: string
  sublabel?: string
  value: boolean
  onValueChange: (v: boolean) => void
  tint: string
}) {
  return (
    <View style={styles.row}>
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
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: tint, false: colors.gray200 }}
        thumbColor={colors.white}
      />
    </View>
  )
}

export default function SettingsScreen() {
  const { role } = useAuth()
  const accent = roleAccent(role)

  // Local UI state for now; persist these once a settings store is added.
  const [pushNotifications, setPushNotifications] = useState(true)
  const [reminders, setReminders] = useState(true)
  const [promotions, setPromotions] = useState(false)

  return (
    <Screen topInset={false}>
      <Text variant="label" muted style={styles.section}>
        NOTIFICATIONS
      </Text>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        <ToggleRow
          icon="notifications-outline"
          label="Push notifications"
          sublabel="Order updates and alerts"
          value={pushNotifications}
          onValueChange={setPushNotifications}
          tint={accent}
        />
        <Divider />
        <ToggleRow
          icon="calendar-outline"
          label="Health reminders"
          sublabel="Cycle and appointment reminders"
          value={reminders}
          onValueChange={setReminders}
          tint={accent}
        />
        <Divider />
        <ToggleRow
          icon="pricetag-outline"
          label="Offers & promotions"
          value={promotions}
          onValueChange={setPromotions}
          tint={accent}
        />
      </Card>

      <Text variant="caption" muted center style={{ marginTop: spacing.lg }}>
        Preference syncing is coming soon. Changes apply on this device for now.
      </Text>
    </Screen>
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
