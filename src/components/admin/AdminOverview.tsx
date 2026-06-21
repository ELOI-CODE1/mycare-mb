import React, { useMemo } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { BarChart } from 'react-native-chart-kit'
import { Ionicons } from '@expo/vector-icons'
import { Text, Card } from '../ui'
import { colors, spacing, radius } from '../../theme'

type OrderLike = { total_price: number; status: string; created_at: string }

interface Props {
  orders: OrderLike[]
  productCount: number
  accent: string
  soft: string
}

function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AdminOverview({ orders, productCount, accent, soft }: Props) {
  const stats = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    // "Sold" / revenue excludes cancelled orders.
    const valid = orders.filter((o) => (o.status || '').toLowerCase() !== 'cancelled')

    const monthlyRevenue = new Array(12).fill(0)
    let ordersThisMonth = 0
    let ordersThisYear = 0
    let revenueThisMonth = 0
    let revenueThisYear = 0
    let totalRevenue = 0

    for (const o of valid) {
      const d = new Date(o.created_at)
      const price = Number(o.total_price) || 0
      totalRevenue += price
      if (d.getFullYear() === year) {
        ordersThisYear += 1
        revenueThisYear += price
        monthlyRevenue[d.getMonth()] += price
        if (d.getMonth() === month) {
          ordersThisMonth += 1
          revenueThisMonth += price
        }
      }
    }

    return { year, monthlyRevenue, ordersThisMonth, ordersThisYear, revenueThisMonth, revenueThisYear, totalRevenue }
  }, [orders])

  const chartWidth = Dimensions.get('window').width - spacing.lg * 2 - spacing.lg * 2

  return (
    <View>
      {/* Stat cards */}
      <View style={styles.grid}>
        <StatCard icon="cube-outline" tint={accent} soft={soft} label="Products" value={String(productCount)} />
        <StatCard
          icon="cart-outline"
          tint={accent}
          soft={soft}
          label="Sales this month"
          value={String(stats.ordersThisMonth)}
          sub={`${stats.revenueThisMonth.toLocaleString()} RWF`}
        />
        <StatCard
          icon="calendar-outline"
          tint={accent}
          soft={soft}
          label="Sales this year"
          value={String(stats.ordersThisYear)}
          sub={`${stats.revenueThisYear.toLocaleString()} RWF`}
        />
        <StatCard
          icon="cash-outline"
          tint={accent}
          soft={soft}
          label="Total revenue"
          value={`${stats.totalRevenue.toLocaleString()}`}
          sub="RWF · all time"
        />
      </View>

      {/* Revenue chart */}
      <Card>
        <Text variant="label" style={{ marginBottom: spacing.sm }}>
          Revenue by month · {stats.year}
        </Text>
        <BarChart
          // Scaled to thousands so the y-axis stays readable (250000 -> "250k").
          data={{ labels: MONTHS, datasets: [{ data: stats.monthlyRevenue.map((v) => Math.round(v / 1000)) }] }}
          width={chartWidth}
          height={220}
          fromZero
          yAxisLabel=""
          yAxisSuffix="k"
          withInnerLines={false}
          chartConfig={{
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => hexToRgba(accent, opacity),
            labelColor: () => colors.gray500,
            barPercentage: 0.5,
            propsForLabels: { fontSize: 9 },
          }}
          style={{ borderRadius: radius.md, marginLeft: -spacing.sm }}
        />
        <Text variant="caption" muted center>
          Amounts in thousands of RWF (k). Cancelled orders excluded.
        </Text>
      </Card>
    </View>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tint,
  soft,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
  sub?: string
  tint: string
  soft: string
}) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text variant="title" numberOfLines={1} style={{ marginTop: spacing.sm }}>
        {value}
      </Text>
      <Text variant="caption" muted>
        {label}
      </Text>
      {sub ? (
        <Text variant="caption" color={tint} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%' },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
