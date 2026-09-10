import React, { useState } from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { Input, Text } from './ui'
import { colors, spacing } from '../theme'

function toISODate(d: Date): string {
  const year = d.getFullYear()
  const month = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromISODate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return new Date()
}

// Date entry that opens the native calendar when tapped, so users never have
// to type YYYY-MM-DD by hand. Falls back to a text field on web.
export default function DateField({ label, value, onChange, placeholder = 'YYYY-MM-DD', maximumDate }: {
  label: string
  value: string
  onChange: (isoDate: string) => void
  placeholder?: string
  maximumDate?: Date
}) {
  const [open, setOpen] = useState(false)

  if (Platform.OS === 'web') {
    return <Input label={label} placeholder={placeholder} value={value} onChangeText={onChange} />
  }

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    setOpen(false)
    if (selected) onChange(toISODate(selected))
  }

  return (
    <View>
      <Text variant="label" style={styles.label}>{label}</Text>
      <Pressable accessibilityLabel={`${label}: ${value || 'pick a date'}`} onPress={() => setOpen(true)} style={styles.box}>
        <Text style={{ flex: 1, color: value ? colors.text : colors.gray400 }}>
          {value || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={19} color={colors.gray500} />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={fromISODate(value)}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  label: { marginBottom: spacing.xs },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray100,
  },
})
