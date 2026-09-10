import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Button, Card, EmptyState, Text } from './ui'
import DateField from './DateField'
import { colors, radius, spacing } from '../theme'
import PeriodPredictor from '../utils/periodPredictor.ts'
import { api, apiErrorMessage } from '../api/client'

export type ChildPeriod = { startDate: string; duration: number; symptoms?: string[] }

// Per-child cycle tracking: record this child's finished periods + symptoms,
// predict her next window from that history.
export default function ChildTrackPanel({ childId, childName, accent }: { childId: string; childName: string; accent: string }) {
  const navigation = useNavigation<{ navigate: (screen: string) => void }>()
  const [periods, setPeriods] = useState<ChildPeriod[]>([])
  const [startDate, setStartDate] = useState('')
  const [duration, setDuration] = useState('5')
  const [symptoms, setSymptoms] = useState('')
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ periods: ChildPeriod[] }>(`/parent/children/${childId}/periods`)
      setPeriods(res.data.periods)
    } catch { /* stays empty until backend regenerates client */ }
    finally { setLoaded(true) }
  }, [childId])

  useEffect(() => { setLoaded(false); load() }, [load])

  const dates = useMemo(() => periods.map((p) => p.startDate), [periods])
  const prediction = useMemo(() => new PeriodPredictor(dates).predict(), [dates])
  const phase = useMemo(() => new PeriodPredictor(dates).getCurrentPhase(), [dates])

  const save = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      Alert.alert('Pick a date', 'Choose the first day from the calendar.')
      return
    }
    const days = Number(duration)
    if (!Number.isInteger(days) || days < 1 || days > 14) {
      Alert.alert('Check length', 'Period length must be between 1 and 14 days.')
      return
    }
    try {
      const res = await api.post<{ periods: ChildPeriod[] }>(`/parent/children/${childId}/periods`, {
        startDate,
        duration: days,
        symptoms: symptoms.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20),
      })
      setPeriods(res.data.periods)
      setStartDate('')
      setSymptoms('')
    } catch (e) {
      Alert.alert('Could not save', apiErrorMessage(e))
    }
  }

  const remove = async (date: string) => {
    try {
      const res = await api.delete<{ periods: ChildPeriod[] }>(`/parent/children/${childId}/periods/${date}`)
      setPeriods(res.data.periods)
    } catch (e) {
      Alert.alert('Could not remove', apiErrorMessage(e))
    }
  }

  return (
    <Card>
      <Text variant="caption" color={accent}>TRACKING · {childName.toUpperCase()}</Text>
      <Text variant="heading" style={{ marginTop: spacing.xs }}>
        {prediction.predictedRange ? `Next window from ${prediction.predictedRange.start.slice(5)}` : 'No prediction yet'}
      </Text>
      <Text muted style={{ marginTop: spacing.xs }}>{prediction.message}</Text>
      {typeof phase.daysUntilNextPeriod === 'number' && phase.daysUntilNextPeriod <= 7 && prediction.predictedRange ? (
        <View style={[styles.upcoming, { borderColor: accent }]}>
          <Text variant="label">
            {phase.daysUntilNextPeriod <= 0 ? `${childName}'s window is here` : `${childName}'s cycle may start in ${phase.daysUntilNextPeriod} day${phase.daysUntilNextPeriod === 1 ? '' : 's'}`}
          </Text>
          <Button title="Shop essentials" onPress={() => navigation.navigate('Shop')} accent={accent} style={{ marginTop: spacing.sm }} />
        </View>
      ) : null}

      <Text variant="label" style={styles.section}>Record a finished period</Text>
      <View style={styles.formRow}>
        <View style={{ flex: 1 }}><DateField label="First day" value={startDate} onChange={setStartDate} maximumDate={new Date()} /></View>
        <View style={{ width: 88 }}><Text variant="caption" muted>Days</Text><TextInput value={duration} onChangeText={setDuration} keyboardType="number-pad" style={styles.input} /></View>
      </View>
      <TextInput value={symptoms} onChangeText={setSymptoms} placeholder="Symptoms (optional, comma separated)" placeholderTextColor={colors.gray400} style={[styles.input, { marginTop: spacing.sm }]} />
      <Button title={`Save for ${childName}`} onPress={save} accent={accent} style={{ marginTop: spacing.sm }} />

      <Text variant="label" style={styles.section}>History</Text>
      {!loaded ? <Text variant="caption" muted>Loading…</Text> : periods.length === 0 ? (
        <EmptyState icon="calendar-outline" title="No periods logged" subtitle={`Log ${childName}'s past periods to start predictions.`} />
      ) : (
        periods.slice().reverse().map((p) => (
          <View key={p.startDate} style={styles.historyRow}>
            <View style={{ flex: 1 }}>
              <Text variant="label">{p.startDate} · {p.duration} days</Text>
              {p.symptoms?.length ? <Text variant="caption" muted>{p.symptoms.join(', ')}</Text> : null}
            </View>
            <TouchableOpacity accessibilityLabel={`Remove period ${p.startDate}`} onPress={() => remove(p.startDate)}>
              <Text variant="caption" color={colors.danger}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  upcoming: { marginTop: spacing.md, padding: spacing.md, borderWidth: 1.5, borderRadius: radius.lg },
  section: { marginTop: spacing.lg, marginBottom: spacing.sm },
  formRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.xs, color: colors.text, backgroundColor: colors.gray100 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.gray100 },
})
