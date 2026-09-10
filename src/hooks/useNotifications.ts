import { useCallback, useState } from 'react'
import { api } from '../api/client'
import PeriodPredictor from '../utils/periodPredictor.ts'
import type { ChildPeriod } from '../components/ChildTrackPanel'

export type NoticeKind = 'order' | 'article' | 'period' | 'child' | 'support'

export type NoticeItem = {
  id: string
  kind: NoticeKind
  title: string
  body: string
  date?: string
  read: boolean
  serverId?: string
}

type ServerNotice = { id: string; type: string; title: string; body: string; createdAt: string; readAt: string | null }
type PeriodRow = { startDate: string }

const WINDOW_DAYS = 7

function periodReminder(id: string, ownerName: string | null, dates: string[]): NoticeItem | null {
  if (dates.length < 2) return null
  const predictor = new PeriodPredictor(dates)
  const range = predictor.predict().predictedRange
  if (!range) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(`${range.start}T00:00:00`)
  const days = Math.round((start.getTime() - today.getTime()) / 86400000)
  if (days < 0 || days > WINDOW_DAYS) return null
  const who = ownerName ? `${ownerName}'s cycle` : 'Your cycle'
  const when = days === 0 ? 'is here' : `may start in ${days} day${days === 1 ? '' : 's'}`
  return {
    id,
    kind: ownerName ? 'child' : 'period',
    title: `${who} ${when}`,
    body: `${who} ${when} (around ${range.start.slice(5)}). Shop pads and essentials now so you're prepared.`,
    date: new Date().toISOString(),
    read: false,
  }
}

// Bell feed: server alerts (orders, articles, support) plus locally computed
// cycle reminders for the user and, for parents, for each child.
export function useNotifications(role: string) {
  const [items, setItems] = useState<NoticeItem[]>([])
  const [loading, setLoading] = useState(false)

  const kindOf = (type: string): NoticeKind => {
    if (type.startsWith('order_') || type === 'payment_status') return 'order'
    if (type === 'article_published') return 'article'
    if (type === 'support_reply') return 'support'
    return 'order'
  }

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<{ notifications: ServerNotice[] }>('/notifications')
      const server: NoticeItem[] = res.data.notifications.map((n) => ({
        id: `srv-${n.id}`,
        kind: kindOf(n.type),
        title: n.title,
        body: n.body,
        date: n.createdAt,
        read: Boolean(n.readAt),
        serverId: n.id,
      }))

      const local: NoticeItem[] = []
      if (role === 'girl') {
        const periods = await api.get<{ periods: PeriodRow[] }>('/health/periods').catch(() => null)
        if (periods) {
          const reminder = periodReminder('mine', null, periods.data.periods.map((p) => p.startDate.slice(0, 10)))
          if (reminder) local.push(reminder)
        }
      } else if (role === 'parent') {
        const kids = await api.get<{ children: Array<{ id: string; fullName: string }> }>('/parent/children').catch(() => null)
        if (kids) {
          for (const kid of kids.data.children) {
            const p = await api.get<{ periods: ChildPeriod[] }>(`/parent/children/${kid.id}/periods`).catch(() => null)
            if (p) {
              const reminder = periodReminder(`child-${kid.id}`, kid.fullName, p.data.periods.map((x) => x.startDate))
              if (reminder) local.push(reminder)
            }
          }
        }
      }
      // Local reminders first (time-sensitive), then server feed.
      setItems([...local, ...server])
    } catch { /* bell stays quiet */ }
    finally { setLoading(false) }
  }, [role])

  const markRead = useCallback(async (item: NoticeItem) => {
    if (!item.serverId || item.read) return
    try {
      await api.patch(`/notifications/${item.serverId}/read`)
      setItems((current) => current.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
    } catch { /* ignore */ }
  }, [])

  const unread = items.filter((i) => !i.read).length
  return { items, unread, loading, refresh, markRead }
}
