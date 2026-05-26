export type Cycle = {
  id: string
  startDate: string
  endDate: string | null
}

export type Prediction = {
  canPredict: boolean
  message?: string
  nextPeriodDate?: string
  daysUntil?: number
  cycleDay?: number
  currentPhase?: string
}

export function predictCycle(cycleHistory: Cycle[]): Prediction {
  if (cycleHistory.length < 2) {
    return { 
      canPredict: false, 
      message: 'Log 2 periods to see predictions' 
    }
  }
  
  const lengths: number[] = []
  for (let i = 0; i < Math.min(cycleHistory.length - 1, 3); i++) {
    const start1 = new Date(cycleHistory[i].startDate)
    const start2 = new Date(cycleHistory[i+1].startDate)
    const days = Math.abs(Math.floor((start1.getTime() - start2.getTime()) / (1000 * 60 * 60 * 24)))
    if (days >= 21 && days <= 40) lengths.push(days)
  }
  
  const avgCycle = lengths.length > 0 
    ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
    : 28
    
  const lastStart = new Date(cycleHistory[0].startDate)
  const nextPeriod = new Date(lastStart)
  nextPeriod.setDate(lastStart.getDate() + avgCycle)
  
  const today = new Date()
  const daysSinceLast = Math.floor((today.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24))
  const cycleDay = (daysSinceLast % avgCycle) + 1
  
  let currentPhase = ''
  if (cycleDay <= 5) currentPhase = '🩸 Menstrual'
  else if (cycleDay <= 13) currentPhase = '🌱 Follicular'
  else if (cycleDay <= 16) currentPhase = '🥚 Ovulation'
  else currentPhase = '🌙 Luteal'
  
  const daysUntil = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  return {
    canPredict: true,
    nextPeriodDate: nextPeriod.toISOString().split('T')[0],
    daysUntil: daysUntil,
    cycleDay: cycleDay,
    currentPhase: currentPhase
  }
}