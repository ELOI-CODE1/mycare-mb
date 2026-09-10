import React, { useCallback, useState } from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { PieChart } from 'react-native-chart-kit'
import { Card, EmptyState, Text } from './ui'
import { api } from '../api/client'
import PeriodPredictor from '../utils/periodPredictor.ts'
import type { ChildPeriod } from './ChildTrackPanel'
import { colors, radius, spacing } from '../theme'

type ChildRow = { id: string; fullName: string }

const PHASE_COLORS: Record<string, string> = {
  Menstrual: '#c94f78',
  Follicular: '#4d96c9',
  Ovulation: '#7c5cbf',
  Luteal: '#d99a3d',
  'No data': colors.gray300,
}

type ChildStatus = { id: string; name: string; phase: string; daysUntil: number | null; logs: number }

// Overall family report: which phase each child is in (pie) plus per-child rows.
export default function ParentReportPanel({ accent }: { accent: string }) {
  const [statuses, setStatuses] = useState<ChildStatus[] | null>(null)

  const load = useCallback(async () => {
    try {
      const kids = await api.get<{ children: ChildRow[] }>('/parent/children')
      const rows: ChildStatus[] = []
      for (const kid of kids.data.children) {
        const p = await api.get<{ periods: ChildPeriod[] }>(`/parent/children/${kid.id}/periods`).catch(() => null)
        const dates = (p?.data.periods ?? []).map((x) => x.startDate)
        const predictor = new PeriodPredictor(dates)
        const phase = predictor.getCurrentPhase()
        const prediction = predictor.predict()
        rows.push({
          id: kid.id,
          name: kid.fullName,
          phase: phase.phase,
          daysUntil: typeof phase.daysUntilNextPeriod === 'number' && prediction.predictedRange ? phase.daysUntilNextPeriod : null,
          logs: dates.length,
        })
      }
      setStatuses(rows)
    } catch {
      setStatuses([])
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (statuses === null) {
    return <Card><Text variant="caption" muted>Loading family report…</Text></Card>
  }
  if (statuses.length === 0) {
    return <Card><EmptyState icon="people-outline" title="No child data yet" subtitle="Add a child profile in Family, then log her periods to see the report." /></Card>
  }

  const counts = statuses.reduce<Record<string, number>>((acc, s) => {
    acc[s.phase] = (acc[s.phase] ?? 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(counts).map(([phase, count]) => ({
    name: `${phase} (${count})`,
    count,
    color: PHASE_COLORS[phase] ?? accent,
    legendFontColor: colors.gray700,
    legendFontSize: 12,
  }))
  const dueSoon = statuses.filter((s) => s.daysUntil !== null && s.daysUntil <= 7)

  return (
    <Card>
      <Text variant="caption" color={accent}>FAMILY REPORT</Text>
      <Text variant="heading" style={{ marginTop: spacing.xs }}>
        {statuses.length} child{statuses.length === 1 ? '' : 'ren'}
        {dueSoon.length > 0 ? ` · ${dueSoon.length} window${dueSoon.length === 1 ? '' : 's'} near` : ' · all calm'}
      </Text>
      <PieChart
        data={pieData}
        width={Dimensions.get('window').width - 96}
        height={180}
        chartConfig={{ color: (opacity = 1) => `rgba(36, 49, 46, ${opacity})` }}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="8"
        absolute
      />
      {statuses.map((s) => (
        <View key={s.id} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: PHASE_COLORS[s.phase] ?? accent }]} />
          <View style={{ flex: 1 }}>
            <Text variant="label">{s.name}</Text>
            <Text variant="caption" muted style={{ marginTop: 2 }}>
              {s.phase}{s.daysUntil !== null ? ` · window in ${s.daysUntil}d` : s.logs > 0 ? ' · watch for symptoms' : ' · log 2+ periods'}
            </Text>
          </View>
        </View>
      ))}
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.gray100 },
  dot: { width: 12, height: 12, borderRadius: 6 },
})
