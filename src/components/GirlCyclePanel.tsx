import React, { useEffect, useMemo, useState } from 'react'
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Calendar } from 'react-native-calendars'
import { format, isValid, parseISO } from 'date-fns'
import { Button, Card, Text } from './ui'
import DateField from './DateField'
import { colors, radius, spacing } from '../theme'
import PeriodPredictor from '../utils/periodPredictor.ts'
import { addPeriodLog, loadPeriodLogs, periodDays, type PeriodLog } from '../utils/periodStorage'
import { requestPermissions, schedulePeriodNotifications, setupNotificationChannel } from '../utils/notificationService'
import { api, apiErrorMessage } from '../api/client'

export default function GirlCyclePanel({ accent, mode = 'record' }: { accent: string; mode?: 'present' | 'record' }) {
  const navigation = useNavigation<{ navigate: (screen: string) => void }>()
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([])
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [duration, setDuration] = useState('5')
  const [symptoms, setSymptoms] = useState('')
  const [formError, setFormError] = useState('')
  const canRecord = mode === 'record'

  useEffect(() => {
    api.get<{ periods: PeriodLog[] }>('/health/periods').then((response) => setPeriodLogs(response.data.periods.map((period) => ({ ...period, startDate: period.startDate.slice(0, 10) })))).catch(() => loadPeriodLogs().then(setPeriodLogs))
  }, [])

  const periodDates = useMemo(() => periodLogs.map((log) => log.startDate), [periodLogs])
  const prediction = useMemo(() => new PeriodPredictor(periodDates).predict(), [periodDates])
  const phase = useMemo(() => new PeriodPredictor(periodDates).getCurrentPhase(), [periodDates])
  const report = useMemo(() => {
    const predictor = new PeriodPredictor(periodDates)
    const cycles = predictor.calculateCycleLengths()
    const avg = cycles.length > 0 ? Math.round(cycles.reduce((n, c) => n + c.length, 0) / cycles.length) : null
    return { cycles: cycles.length, avg, variation: prediction.variation }
  }, [periodDates, prediction.variation])
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
      setFormError('Pick a valid date from the calendar.')
      return
    }
    if (!Number.isInteger(parsedDuration) || parsedDuration < 1 || parsedDuration > 14) {
      setFormError('Period length must be between 1 and 14 days.')
      return
    }
    setFormError('')
    const symptomList = symptoms.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20)
    try {
      const timeZone = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return undefined } })()
      const response = await api.post<{ period: PeriodLog }>('/health/periods', { startDate, duration: parsedDuration, timeZone })
      setPeriodLogs((current) => [response.data.period, ...current.filter((period) => period.startDate.slice(0, 10) !== startDate)])
      if (symptomList.length > 0) {
        const profile = await api.get<{ profile: { symptomsHistory?: string[] } | null }>('/health/profile').catch(() => null)
        const merged = [...(profile?.data.profile?.symptomsHistory ?? []), ...symptomList].slice(0, 60)
        await api.put('/health/profile', { symptomsHistory: merged }).catch(() => undefined)
      }
      setSymptoms('')
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
      {typeof phase.daysUntilNextPeriod === 'number' && phase.daysUntilNextPeriod <= 7 ? (
        <View style={[styles.upcoming, { borderColor: accent }]}>
          <Text variant="label">
            {phase.daysUntilNextPeriod <= 0 ? 'Your cycle window is here' : `Your cycle may start in ${phase.daysUntilNextPeriod} day${phase.daysUntilNextPeriod === 1 ? '' : 's'}`}
          </Text>
          <Text variant="caption" muted style={{ marginTop: spacing.xs, lineHeight: 18 }}>
            Stock up now so you're prepared — your past cycles and symptoms predict this window.
          </Text>
          <Button title="Shop essentials" onPress={() => navigation.navigate('Shop')} accent={accent} style={{ marginTop: spacing.sm }} />
        </View>
      ) : null}
      <View style={styles.summary}>
        <View><Text variant="caption" muted>Logged days</Text><Text variant="heading">{periodDates.length}</Text></View>
        <View><Text variant="caption" muted>Possible next period</Text><Text variant="heading">{prediction.predictedRange ? format(parseISO(prediction.predictedRange.start), 'MMM d') : 'Log 2+'}</Text></View>
      </View>
      {!canRecord && report.cycles > 0 ? (
        <View style={styles.reportBox}>
          <Text variant="label">Cycle report</Text>
          <Text variant="caption" muted style={{ marginTop: spacing.xs, lineHeight: 18 }}>
            {report.cycles} cycle{report.cycles === 1 ? '' : 's'} logged · average {report.avg} days
            {report.variation < 3 ? ' · very regular' : report.variation <= 7 ? ' · fairly regular' : ' · varies — watch symptoms near the window'}.
          </Text>
        </View>
      ) : null}
      {canRecord ? (
        <>
          <Text variant="heading" style={{ marginTop: spacing.xl }}>Record a period</Text>
          <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Log a finished period with its symptoms — history powers your future prediction.</Text>
          <View style={[styles.formPanel, { borderColor: `${accent}55` }]}>
            <View style={styles.formRow}>
              <View style={styles.formField}><DateField label="First day" value={startDate} onChange={setStartDate} maximumDate={new Date()} /></View>
              <View style={styles.durationField}><Text variant="caption" muted>Days</Text><TextInput value={duration} onChangeText={setDuration} keyboardType="number-pad" style={styles.input} /></View>
            </View>
            <Text variant="caption" muted>Symptoms (optional, comma separated)</Text>
            <TextInput value={symptoms} onChangeText={setSymptoms} placeholder="e.g. cramps, headache" placeholderTextColor={colors.gray400} style={[styles.input, { marginTop: spacing.xs }]} />
            {formError ? <Text variant="caption" color={colors.danger}>{formError}</Text> : null}
            <Button title="Save period" onPress={saveLog} accent={accent} style={{ marginTop: spacing.sm }} />
          </View>
        </>
      ) : null}
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
  upcoming: { marginTop: spacing.lg, padding: spacing.md, borderWidth: 1.5, borderRadius: radius.lg, backgroundColor: colors.surface },
  reportBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.gray100 },
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
