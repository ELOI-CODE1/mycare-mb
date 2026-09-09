import React, { useEffect, useMemo, useState } from 'react'
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { Calendar } from 'react-native-calendars'
import { format, isValid, parseISO } from 'date-fns'
import { Button, Card, Text } from './ui'
import { colors, radius, spacing } from '../theme'
import PeriodPredictor from '../utils/periodPredictor.ts'
import { addPeriodLog, loadPeriodLogs, periodDays, type PeriodLog } from '../utils/periodStorage'
import { requestPermissions, schedulePeriodNotifications, setupNotificationChannel } from '../utils/notificationService'
import { api, apiErrorMessage } from '../api/client'

export default function GirlCyclePanel({ accent }: { accent: string }) {
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([])
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [duration, setDuration] = useState('5')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    api.get<{ periods: PeriodLog[] }>('/health/periods').then((response) => setPeriodLogs(response.data.periods.map((period) => ({ ...period, startDate: period.startDate.slice(0, 10) })))).catch(() => loadPeriodLogs().then(setPeriodLogs))
  }, [])

  const periodDates = useMemo(() => periodLogs.map((log) => log.startDate), [periodLogs])
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
    periodLogs.forEach((log) => periodDays(log).forEach((date) => { marked[date] = { selected: true, selectedColor: accent, marked: true } }))
    if (prediction.predictedRange) {
      const start = parseISO(prediction.predictedRange.start)
      const end = parseISO(prediction.predictedRange.end)
      for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const date = format(cursor, 'yyyy-MM-dd')
        if (!marked[date]) marked[date] = { marked: true, dotColor: accent }
      }
    }
    return marked
  }, [accent, periodLogs, prediction.predictedRange])

  const saveLog = async () => {
    const parsedDate = parseISO(startDate)
    const parsedDuration = Number(duration)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !isValid(parsedDate)) {
      setFormError('Use a valid date in YYYY-MM-DD format.')
      return
    }
    if (!Number.isInteger(parsedDuration) || parsedDuration < 1 || parsedDuration > 14) {
      setFormError('Period length must be between 1 and 14 days.')
      return
    }
    setFormError('')
    try {
      const response = await api.post<{ period: PeriodLog }>('/health/periods', { startDate, duration: parsedDuration })
      setPeriodLogs((current) => [response.data.period, ...current.filter((period) => period.startDate.slice(0, 10) !== startDate)])
      Alert.alert('Period recorded', 'Your prediction will update from this period history.')
    } catch (error) {
      const next = await addPeriodLog(startDate, parsedDuration)
      setPeriodLogs(next)
      Alert.alert('Saved on this device', apiErrorMessage(error, 'The health service is unavailable right now.'))
    }
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
      <Text variant="heading" style={{ marginTop: spacing.xl }}>Record a period</Text>
      <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Enter the first day and how many days it lasted. The calendar below is for viewing only.</Text>
      <View style={[styles.formPanel, { borderColor: `${accent}55` }]}>
        <View style={styles.formRow}>
          <View style={styles.formField}><Text variant="caption" muted>First day</Text><TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.gray400} style={styles.input} /></View>
          <View style={styles.durationField}><Text variant="caption" muted>Days</Text><TextInput value={duration} onChangeText={setDuration} keyboardType="number-pad" style={styles.input} /></View>
        </View>
        {formError ? <Text variant="caption" color={colors.danger}>{formError}</Text> : null}
        <Button title="Save period" onPress={saveLog} accent={accent} style={{ marginTop: spacing.sm }} />
      </View>
      <Text variant="heading" style={{ marginTop: spacing.xl }}>Cycle calendar</Text>
      <View style={styles.legend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: accent }]} /><Text variant="caption" muted>Logged period</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.surface, borderColor: accent, borderWidth: 2 }]} /><Text variant="caption" muted>Predicted window</Text></View></View>
      <Calendar
        markedDates={markedDates}
        theme={{ todayTextColor: accent, arrowColor: accent, selectedDayBackgroundColor: accent, monthTextColor: colors.text, textSectionTitleColor: colors.gray700 }}
        style={styles.calendar}
      />
      <Text variant="caption" muted style={{ marginTop: spacing.sm }}>We’ll remind you before the possible window and suggest related care products.</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, gap: spacing.md },
  formRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  formField: { flex: 1 },
  durationField: { width: 88 },
  formPanel: { marginTop: spacing.md, padding: spacing.md, borderWidth: 1, borderRadius: radius.lg, backgroundColor: colors.gray100 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.xs, color: colors.text, backgroundColor: colors.gray100 },
  calendar: { marginTop: spacing.md, borderRadius: radius.md },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
})
