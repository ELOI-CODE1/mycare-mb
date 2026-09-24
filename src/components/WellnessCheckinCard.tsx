import React, { useCallback, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Text } from './ui'
import { colors, spacing } from '../theme'
import { api } from '../api/client'

type Pillar = 'Mood' | 'Energy' | 'Sleep'

const CHOICES = ['Low', 'Okay', 'Good'] as const

const PILLAR_ICON: Record<Pillar, keyof typeof Ionicons.glyphMap> = {
  Mood: 'happy-outline',
  Energy: 'flash-outline',
  Sleep: 'moon-outline',
}

/** Mood/Energy/Sleep daily check-in. Writes to PUT /health/check-ins (any role). */
export default function WellnessCheckinCard({ accent }: { accent: string }) {
  const [active, setActive] = useState<Pillar | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})

  useFocusEffect(
    useCallback(() => {
      let alive = true
      api
        .get<{ checkIns: Array<{ date: string; mood?: string; energy?: string; sleep?: string }> }>('/health/check-ins')
        .then((response) => {
          const today = new Date().toISOString().slice(0, 10)
          const entry = response.data.checkIns.find((c) => c.date.slice(0, 10) === today)
          if (alive && entry) setValues({ Mood: entry.mood || '', Energy: entry.energy || '', Sleep: entry.sleep || '' })
        })
        .catch(() => undefined)
      return () => {
        alive = false
      }
    }, []),
  )

  const select = (choice: string) => {
    if (!active) return
    const next = { ...values, [active]: choice }
    setValues(next)
    const timeZone = (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch {
        return undefined
      }
    })()
    api
      .put('/health/check-ins', {
        date: new Date().toISOString().slice(0, 10),
        timeZone,
        mood: next.Mood || undefined,
        energy: next.Energy || undefined,
        sleep: next.Sleep || undefined,
      })
      .catch(() => undefined)
    setActive(null)
  }

  return (
    <Card>
      <Text variant="heading">Daily check-in</Text>
      <Text muted style={{ marginTop: spacing.xs }}>
        A few quick notes help you notice patterns over time.
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl }}>
        {(Object.keys(PILLAR_ICON) as Pillar[]).map((pillar) => (
          <TouchableOpacity
            key={pillar}
            accessibilityLabel={`Record ${pillar.toLowerCase()}`}
            accessibilityState={{ selected: active === pillar }}
            onPress={() => setActive(pillar)}
            style={{ alignItems: 'center', flex: 1 }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                borderWidth: 1.5,
                borderColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: values[pillar] ? accent : colors.surface,
              }}
            >
              <Ionicons name={PILLAR_ICON[pillar]} size={19} color={values[pillar] ? colors.white : accent} />
            </View>
            <Text variant="caption" color={values[pillar] ? accent : colors.gray500} style={{ marginTop: spacing.xs }}>
              {values[pillar] || pillar}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {active ? (
        <View style={{ marginTop: spacing.lg, padding: spacing.md, borderRadius: 11, backgroundColor: colors.gray100 }}>
          <Text variant="label">How was your {active.toLowerCase()}?</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            {CHOICES.map((choice) => (
              <TouchableOpacity
                key={choice}
                accessibilityRole="button"
                accessibilityState={{ selected: values[active] === choice }}
                onPress={() => select(choice)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: accent,
                  borderRadius: 999,
                  paddingVertical: spacing.sm,
                  backgroundColor: values[active] === choice ? accent : colors.surface,
                }}
              >
                <Text variant="caption" color={values[active] === choice ? colors.white : accent}>
                  {choice}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
      <Text variant="caption" muted style={{ marginTop: spacing.md }}>
        Saved to your private health profile.
      </Text>
    </Card>
  )
}
