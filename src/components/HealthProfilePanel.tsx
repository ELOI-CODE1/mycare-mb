import React, { useCallback, useState } from 'react'
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Button, Card, Text } from './ui'
import DateField from './DateField'
import { api, apiErrorMessage } from '../api/client'
import { colors, radius, spacing } from '../theme'

const DISCLAIMER = 'MyCare+ offers general wellness information only and is not a medical diagnosis. Seek professional care for severe pain, very heavy bleeding, fainting, fever with pelvic pain, or any symptom that worries you.'
const RED_FLAGS = ['Soaking through pads/tampons every 1–2 hours', 'Severe pain that stops daily life', 'Fainting, dizziness, or shortness of breath', 'Fever with pelvic pain or unusual discharge']

function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'
  } catch { return 'UTC' }
}

type Profile = {
  averageCycleDays?: number | null
  lastPeriodStart?: string | null
  birthDate?: string | null
  timeZone?: string | null
  symptomsHistory?: string[] | null
  disclaimerAccepted?: boolean
  disclaimerVersion?: string | null
  consentVersion?: string | null
}

export default function HealthProfilePanel({ accent }: { accent: string }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [cycleDays, setCycleDays] = useState('28')
  const [lastPeriod, setLastPeriod] = useState('')
  const [symptom, setSymptom] = useState('')
  const [checkIns, setCheckIns] = useState<Array<{ date: string; mood?: string; energy?: string; sleep?: string; symptoms?: string[] }>>([])
  const [consents, setConsents] = useState<Array<{ id: string; version: string; acceptedAt: string }>>([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [p, c, k] = await Promise.all([
        api.get<{ profile: Profile | null }>('/health/profile'),
        api.get<{ checkIns: Array<{ date: string; mood?: string; energy?: string; sleep?: string; symptoms?: string[] }> }>('/health/check-ins'),
        api.get<{ consents: Array<{ id: string; version: string; acceptedAt: string }> }>('/health/consent').catch(() => ({ data: { consents: [] } })),
      ])
      setProfile(p.data.profile)
      if (p.data.profile?.averageCycleDays) setCycleDays(String(p.data.profile.averageCycleDays))
      if (p.data.profile?.lastPeriodStart) setLastPeriod(p.data.profile.lastPeriodStart.slice(0, 10))
      setCheckIns(c.data.checkIns)
      setConsents(k.data.consents)
    } catch { /* panel shows empty state */ }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const saveAssumptions = async () => {
    const days = Number(cycleDays)
    if (!Number.isInteger(days) || days < 15 || days > 60) {
      Alert.alert('Check cycle length', 'Average cycle is usually 15–60 days.')
      return
    }
    if (lastPeriod && !/^\d{4}-\d{2}-\d{2}$/.test(lastPeriod)) {
      Alert.alert('Check date', 'Last period must look like YYYY-MM-DD.')
      return
    }
    setSaving(true)
    try {
      const res = await api.put<{ profile: Profile }>('/health/profile', {
        averageCycleDays: days,
        lastPeriodStart: lastPeriod || undefined,
        timeZone: deviceTimeZone(),
      })
      setProfile(res.data.profile)
      Alert.alert('Saved', 'Your cycle assumptions were updated.')
    } catch (e) {
      Alert.alert('Could not save', apiErrorMessage(e))
    } finally { setSaving(false) }
  }

  const addSymptom = async () => {
    const value = symptom.trim()
    if (!value) return
    const next = [...(profile?.symptomsHistory ?? []), value].slice(0, 60)
    try {
      const res = await api.put<{ profile: Profile }>('/health/profile', { symptomsHistory: next, timeZone: deviceTimeZone() })
      setProfile(res.data.profile)
      setSymptom('')
    } catch (e) { Alert.alert('Could not save symptom', apiErrorMessage(e)) }
  }

  const removeSymptom = async (value: string) => {
    const next = (profile?.symptomsHistory ?? []).filter((s) => s !== value)
    try {
      const res = await api.put<{ profile: Profile }>('/health/profile', { symptomsHistory: next })
      setProfile(res.data.profile)
    } catch (e) { Alert.alert('Could not remove', apiErrorMessage(e)) }
  }

  const acceptConsent = async () => {
    try {
      await api.post('/health/consent', { version: 'v1', policy: 'health-data' })
      await api.put('/health/profile', { disclaimerAccepted: true, disclaimerVersion: 'v1' })
      load()
      Alert.alert('Thanks', 'Your consent (v1) was recorded.')
    } catch (e) { Alert.alert('Could not record consent', apiErrorMessage(e)) }
  }

  const exportData = async () => {
    try {
      const res = await api.get('/health/export')
      Alert.alert('Export ready', `Includes profile, ${res.data.periods?.length ?? 0} period logs, ${res.data.checkIns?.length ?? 0} check-ins.`)
      console.log('[health-export]', JSON.stringify(res.data).slice(0, 2000))
    } catch (e) { Alert.alert('Export failed', apiErrorMessage(e)) }
  }

  const deleteData = async () => {
    Alert.alert('Delete health data?', 'This removes your profile, periods, and check-ins from the server. This cannot be undone.', [
      { text: 'Keep data', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/health/data')
            setProfile(null)
            setCheckIns([])
            Alert.alert('Deleted', 'Your server-side health data was removed.')
          } catch (e) { Alert.alert('Could not delete', apiErrorMessage(e)) }
        },
      },
    ])
  }

  const moodCounts = checkIns.reduce<Record<string, number>>((acc, c) => {
    if (c.mood) acc[c.mood] = (acc[c.mood] ?? 0) + 1
    return acc
  }, {})
  const maxCount = Math.max(1, ...Object.values(moodCounts))

  return (
    <Card>
      <Text variant="caption" color={accent}>HEALTH PROFILE</Text>
      <Text variant="heading" style={{ marginTop: spacing.xs }}>Your private picture</Text>
      <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Stored in your account database · timezone {profile?.timeZone ?? deviceTimeZone()}</Text>

      <Text variant="label" style={styles.section}>Cycle assumptions</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}><Text variant="caption" muted>Average cycle (days)</Text><TextInput value={cycleDays} onChangeText={setCycleDays} keyboardType="number-pad" style={styles.input} /></View>
        <View style={{ flex: 1.4 }}><DateField label="Last period start" value={lastPeriod} onChange={setLastPeriod} maximumDate={new Date()} /></View>
      </View>
      <Button title="Save assumptions" onPress={saveAssumptions} loading={saving} accent={accent} style={{ marginTop: spacing.sm }} />

      <Text variant="label" style={styles.section}>Symptom history</Text>
      <View style={styles.chipWrap}>
        {(profile?.symptomsHistory ?? []).map((s) => (
          <TouchableOpacity key={s} onPress={() => removeSymptom(s)} style={styles.chip}>
            <Text variant="caption">{s} ✕</Text>
          </TouchableOpacity>
        ))}
        {(profile?.symptomsHistory ?? []).length === 0 ? <Text variant="caption" muted>No symptoms recorded yet.</Text> : null}
      </View>
      <View style={styles.row}>
        <TextInput value={symptom} onChangeText={setSymptom} placeholder="e.g. cramps" placeholderTextColor={colors.gray400} style={[styles.input, { flex: 1 }]} />
        <Button title="Add" onPress={addSymptom} accent={accent} fullWidth={false} />
      </View>

      <Text variant="label" style={styles.section}>Check-in history</Text>
      {checkIns.length === 0 ? (
        <Text variant="caption" muted>No check-ins yet — use Track to log mood, energy, and sleep.</Text>
      ) : (
        <View>
          {Object.entries(moodCounts).map(([mood, count]) => (
            <View key={mood} style={styles.barRow}>
              <Text variant="caption" style={{ width: 72 }}>{mood}</Text>
              <View style={styles.barTrack}><View style={[styles.barFill, { width: `${(count / maxCount) * 100}%`, backgroundColor: accent }]} /></View>
              <Text variant="caption" muted>{count}</Text>
            </View>
          ))}
          {checkIns.slice(0, 5).map((c) => (
            <Text key={c.date} variant="caption" muted style={styles.historyLine}>
              {c.date.slice(0, 10)} · {c.mood || '—'} · {c.energy || '—'} · {c.sleep || '—'}{(c.symptoms as unknown as string[])?.length ? ` · ${(c.symptoms as unknown as string[]).join(', ')}` : ''}
            </Text>
          ))}
        </View>
      )}

      <Text variant="label" style={styles.section}>Consent</Text>
      <Text variant="caption" muted>Current version: {profile?.consentVersion ?? consents[0]?.version ?? 'not recorded'}</Text>
      {consents.length > 0 ? <Text variant="caption" muted style={{ marginTop: 2 }}>History: {consents.map((c) => `${c.version} (${new Date(c.acceptedAt).toLocaleDateString()})`).join(' · ')}</Text> : null}
      <Button title="Accept health-data consent (v1)" onPress={acceptConsent} variant="secondary" style={{ marginTop: spacing.sm }} />

      <Text variant="label" style={styles.section}>Data controls</Text>
      <View style={styles.controlsRow}>
        <View style={styles.controlBtn}><Button title="Export my data" onPress={exportData} variant="secondary" /></View>
        <View style={styles.controlBtn}><Button title="Delete health data" onPress={deleteData} variant="danger" /></View>
      </View>

      <View style={styles.disclaimer}>
        <Text variant="label">Medical disclaimer</Text>
        <Text variant="caption" muted style={{ marginTop: spacing.xs, lineHeight: 18 }}>{DISCLAIMER}</Text>
        <Text variant="label" style={{ marginTop: spacing.sm }}>Seek care promptly if you notice:</Text>
        {RED_FLAGS.map((flag) => <Text key={flag} variant="caption" muted style={styles.flag}>• {flag}</Text>)}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  controlsRow: { flexDirection: 'row', gap: spacing.sm },
  controlBtn: { flex: 1, minWidth: 0 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.xs, color: colors.text, backgroundColor: colors.gray100 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.gray100 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.gray100, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  historyLine: { marginTop: 2, lineHeight: 18 },
  disclaimer: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.gray100 },
  flag: { marginTop: 2, lineHeight: 18 },
})
