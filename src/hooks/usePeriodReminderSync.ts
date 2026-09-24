import { useEffect } from 'react'
import { AppState } from 'react-native'
import { api } from '../api/client'
import PeriodPredictor from '../utils/periodPredictor.ts'
import { hasNotificationPermission, schedulePeriodNotifications, setupNotificationChannel } from '../utils/notificationService'

/**
 * Single home for cycle-reminder scheduling (girl role only).
 * GirlCyclePanel mounts twice (Home + Track) so it must NOT schedule —
 * this hook runs once at app level, on launch + when the app returns
 * to the foreground. Silent: never prompts, never alerts.
 */
export function usePeriodReminderSync(role: string | undefined) {
  useEffect(() => {
    if (role !== 'girl') return
    let cancelled = false

    const sync = async () => {
      try {
        const res = await api.get<{ periods: Array<{ startDate: string }> }>('/health/periods')
        const dates = res.data.periods.map((p) => p.startDate.slice(0, 10))
        if (dates.length < 2 || cancelled) return
        const range = new PeriodPredictor(dates).predict().predictedRange
        if (!range || cancelled) return
        await setupNotificationChannel()
        if (cancelled) return
        if (await hasNotificationPermission()) {
          await schedulePeriodNotifications(range)
        }
      } catch {
        /* offline or not set up yet — try next time */
      }
    }

    sync()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync()
    })
    return () => {
      cancelled = true
      sub.remove()
    }
  }, [role])
}
