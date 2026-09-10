import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '../api/client'

export type ChildAccount = { id: string; fullName: string; birthDate?: string | null }

type ChildContextValue = {
  children: ChildAccount[]
  selectedId: string | null
  selected: ChildAccount | null
  select: (id: string) => void
  refresh: () => Promise<void>
}

// Shares the parent's currently-viewed child between Family and Track,
// so Track always shows the selected child's name and data.
const ChildContext = createContext<ChildContextValue | undefined>(undefined)

export function ChildProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<ChildAccount[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<{ children: ChildAccount[] }>('/parent/children')
      setList(res.data.children)
      setSelectedId((current) => current ?? res.data.children[0]?.id ?? null)
    } catch { /* stays empty */ }
  }, [])

  const select = useCallback((id: string) => setSelectedId(id), [])

  const value = useMemo(() => ({
    children: list,
    selectedId,
    selected: list.find((c) => c.id === selectedId) ?? list[0] ?? null,
    select,
    refresh,
  }), [list, selectedId, select, refresh])

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>
}

export function useChild() {
  const value = useContext(ChildContext)
  if (!value) throw new Error('useChild must be used within ChildProvider')
  return value
}
