import React, { useEffect, useMemo, useState } from 'react'
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Calendar } from 'react-native-calendars'
import { format, parseISO } from 'date-fns'
import { Card, Text } from './ui'
import { colors, radius, spacing } from '../theme'
import PeriodPredictor from '../utils/periodPredictor.ts'
import { addPeriodDate, loadPeriodDates, removePeriodDate } from '../utils/periodStorage'
import { requestPermissions, schedulePeriodNotifications, setupNotificationChannel } from '../utils/notificationService'

export default function GirlCyclePanel({ accent }: { accent: string }) {
  const [periodDates, setPeriodDates] = useState<string[]>([])
  const [today, setToday] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    loadPeriodDates().then(setPeriodDates)
  }, [])

  const prediction = useMemo(() => new PeriodPredictor(periodDates).predict(), [periodDates])
  const phase = useMemo(() => new PeriodPredictor(periodDates).getCurrentPhase(), [periodDates])
  useEffect(() => {
    if (!prediction.predictedRange) return
    setupNotificationChannel().catch(() => undefined)
    requestPermissions().then((granted) => {
      if (granted) schedulePeriodNotifications(prediction.predictedRange).catch(() => undefined)
    })
  }, [prediction.predictedRange])
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {}
    periodDates.forEach((date) => { marked[date] = { selected: true, selectedColor: accent, marked: true } })
    if (prediction.predictedRange) {
      const start = parseISO(prediction.predictedRange.start)
      const end = parseISO(prediction.predictedRange.end)
      for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const date = format(cursor, 'yyyy-MM-dd')
        if (!marked[date]) marked[date] = { marked: true, dotColor: accent }
      }
    }
    return marked
  }, [accent, periodDates, prediction.predictedRange])

  const logToday = async () => {
    const next = periodDates.includes(today) ? await removePeriodDate(today) : await addPeriodDate(today)
    setPeriodDates(next)
    Alert.alert(periodDates.includes(today) ? 'Period day removed' : 'Period day logged', 'Your calendar has been updated.')
  }

  return (
    <Card>
      <Text variant="caption" color={accent}>YOUR CYCLE</Text>
      <Text variant="title" color={accent} style={{ marginTop: spacing.xs }}>{phase.phase}</Text>
      <Text muted style={{ marginTop: spacing.xs }}>Cycle day {phase.cycleDay || '—'} · {prediction.message}</Text>
      <View style={styles.summary}>
        <View><Text variant="caption" muted>Logged days</Text><Text variant="heading">{periodDates.length}</Text></View>
        <View><Text variant="caption" muted>Possible next period</Text><Text variant="heading">{prediction.predictedRange ? format(parseISO(prediction.predictedRange.start), 'MMM d') : 'Log 2+'}</Text></View>
      </View>
      <Calendar
        markedDates={{ ...markedDates, [today]: { ...(markedDates[today] || {}), selected: true, selectedColor: accent } }}
        onDayPress={(day) => setToday(day.dateString)}
        theme={{ todayTextColor: accent, arrowColor: accent, selectedDayBackgroundColor: accent, monthTextColor: colors.text, textSectionTitleColor: colors.gray700 }}
        style={styles.calendar}
      />
      <TouchableOpacity onPress={logToday} style={[styles.logButton, { backgroundColor: accent }]}>
        <Text color={colors.white}>{periodDates.includes(today) ? 'Remove logged day' : `Log ${today === format(new Date(), 'yyyy-MM-dd') ? "today's period" : 'selected day'}`}</Text>
      </TouchableOpacity>
      <Text variant="caption" muted style={{ marginTop: spacing.sm }}>We’ll remind you before the possible window and suggest related care products.</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, gap: spacing.md },
  calendar: { marginTop: spacing.md, borderRadius: radius.md },
  logButton: { alignItems: 'center', borderRadius: radius.pill, paddingVertical: spacing.md, marginTop: spacing.md },
})
