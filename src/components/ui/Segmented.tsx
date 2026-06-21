import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from './Text'
import { colors, spacing, radius } from '../../theme'

type Tab = { key: string; label: string }

interface Props {
  tabs: Tab[]
  value: string
  onChange: (key: string) => void
  accent?: string
}

export function Segmented({ tabs, value, onChange, accent = colors.primary }: Props) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const active = tab.key === value
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active && { backgroundColor: accent }]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.8}
          >
            <Text
              variant="label"
              color={active ? colors.textInverse : colors.textMuted}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default Segmented
