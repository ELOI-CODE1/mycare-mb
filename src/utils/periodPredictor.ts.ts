import { addDays, differenceInDays, parseISO, format } from 'date-fns';

export type PeriodDate = string;

export type PredictionResult = {
  predictedRange: { start: string; end: string } | null;
  confidence: number;
  method: string;
  isIrregular: boolean;
  message: string;
  variation: number;
  windowSize: number;
};

export type CycleLength = {
  startDate: string;
  endDate: string;
  length: number;
};

class PeriodPredictor {
  periodDates: PeriodDate[];

  constructor(periodDates: PeriodDate[]) {
    this.periodDates = [...periodDates].sort();
  }

  calculateCycleLengths(): CycleLength[] {
    const cycles: CycleLength[] = [];
    
    for (let i = 0; i < this.periodDates.length - 1; i++) {
      const startDate = this.periodDates[i];
      const endDate = this.periodDates[i + 1];
      const length = differenceInDays(parseISO(endDate), parseISO(startDate));
      
      cycles.push({
        startDate,
        endDate,
        length
      });
    }
    
    return cycles;
  }

  calculateStandardDeviation(lengths: number[]): number {
    if (lengths.length < 2) return 0;
    
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const squaredDiffs = lengths.map(length => Math.pow(length - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / lengths.length;
    
    return Math.sqrt(variance);
  }

  getIrregularityScore(cycleLengths: CycleLength[]): number {
    const recentCycles = cycleLengths.slice(-6);
    const lengths = recentCycles.map(c => c.length);
    return this.calculateStandardDeviation(lengths);
  }

  classifyRegularity(variation: number): 'regular' | 'moderately_irregular' | 'highly_irregular' {
    if (variation < 3) return 'regular';
    if (variation <= 7) return 'moderately_irregular';
    return 'highly_irregular';
  }

  weightedAveragePrediction(cycles: CycleLength[], weights: number[]): number {
    const recentCycles = cycles.slice(-weights.length);
    let weightedSum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < recentCycles.length; i++) {
      weightedSum += recentCycles[i].length * weights[i];
      weightSum += weights[i];
    }
    
    return weightedSum / weightSum;
  }

  medianPrediction(cycles: CycleLength[]): number {
    const recentCycles = cycles.slice(-6);
    const lengths = recentCycles.map(c => c.length).sort((a, b) => a - b);
    const mid = Math.floor(lengths.length / 2);
    
    if (lengths.length % 2 === 0) {
      return (lengths[mid - 1] + lengths[mid]) / 2;
    }
    return lengths[mid];
  }

  detectCalendarPattern(): { exists: boolean; avgDayOfMonth: number } {
    const lastPeriods = this.periodDates.slice(-6);
    const dayOfMonths: number[] = [];
    
    for (const date of lastPeriods) {
      const day = parseInt(date.split('-')[2]);
      dayOfMonths.push(day);
    }
    
    if (dayOfMonths.length < 4) return { exists: false, avgDayOfMonth: 0 };
    
    const minDay = Math.min(...dayOfMonths);
    const maxDay = Math.max(...dayOfMonths);
    const range = maxDay - minDay;
    
    if (range <= 5) {
      const avgDayOfMonth = Math.round(dayOfMonths.reduce((a, b) => a + b, 0) / dayOfMonths.length);
      return { exists: true, avgDayOfMonth };
    }
    
    return { exists: false, avgDayOfMonth: 0 };
  }

  calculateConfidence(variation: number, cycleCount: number): number {
    let base = 0.50;
    
    const cycleBonus = Math.min(cycleCount * 0.05, 0.30);
    base += cycleBonus;
    
    if (variation < 3) base += 0.30;
    else if (variation < 5) base += 0.20;
    else if (variation < 7) base += 0.10;
    else if (variation > 12) base -= 0.20;
    
    return Math.min(0.95, Math.max(0.30, base));
  }

  generateMessage(
    regularity: 'regular' | 'moderately_irregular' | 'highly_irregular',
    confidence: number,
    method: string,
    windowSize: number,
    avgDayOfMonth?: number
  ): string {
    if (method === 'calendar_pattern' && avgDayOfMonth) {
      return `Based on your calendar pattern (period always around the ${avgDayOfMonth}th).`;
    }
    
    if (this.periodDates.length < 2) {
      return 'Log 2 periods to see predictions.';
    }
    
    if (this.periodDates.length < 3) {
      return 'Log one more period for more accurate predictions.';
    }
    
    switch (regularity) {
      case 'regular':
        return 'Your cycle is very regular. Prediction is likely accurate.';
      case 'moderately_irregular':
        return `Your cycles are moderately regular. The prediction window is ${windowSize} days.`;
      case 'highly_irregular':
        return 'Your cycles vary a lot. Watch for symptoms near the predicted window.';
      default:
        return 'Prediction based on your cycle history.';
    }
  }

  public predict(): PredictionResult {
    if (this.periodDates.length < 2) {
      return {
        predictedRange: null,
        confidence: 0,
        method: 'insufficient_data',
        isIrregular: false,
        message: 'Log 2 periods to see predictions.',
        variation: 0,
        windowSize: 0
      };
    }

    const cycles = this.calculateCycleLengths();
    const variation = this.getIrregularityScore(cycles);
    const regularity = this.classifyRegularity(variation);
    const isIrregular = regularity !== 'regular';
    
    const calendarPattern = this.detectCalendarPattern();
    
    if (calendarPattern.exists && this.periodDates.length >= 4) {
      const lastDate = parseISO(this.periodDates[this.periodDates.length - 1]);
      let nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      
      const targetDay = calendarPattern.avgDayOfMonth;
      const maxDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
      const adjustedDay = Math.min(targetDay, maxDay);
      nextDate.setDate(adjustedDay);
      
      const predictedDate = format(nextDate, 'yyyy-MM-dd');
      
      return {
        predictedRange: {
          start: format(addDays(parseISO(predictedDate), -2), 'yyyy-MM-dd'),
          end: format(addDays(parseISO(predictedDate), 2), 'yyyy-MM-dd')
        },
        confidence: 0.85,
        method: 'calendar_pattern',
        isIrregular: false,
        message: this.generateMessage(regularity, 0.85, 'calendar_pattern', 2, calendarPattern.avgDayOfMonth),
        variation,
        windowSize: 2
      };
    }
    
    let predictedCycleLength: number;
    let windowSize: number;
    let method: string;
    
    if (regularity === 'regular') {
      const weights = [0.5, 0.3, 0.2];
      predictedCycleLength = this.weightedAveragePrediction(cycles, weights);
      windowSize = 2;
      method = 'weighted_average';
    } else if (regularity === 'moderately_irregular') {
      const weights = [0.4, 0.3, 0.2, 0.1];
      predictedCycleLength = this.weightedAveragePrediction(cycles, weights);
      windowSize = Math.min(Math.round(variation), 7);
      method = 'weighted_average_irregular';
    } else {
      predictedCycleLength = this.medianPrediction(cycles);
      windowSize = Math.min(Math.round(variation), 14);
      method = 'median';
    }
    
    const lastPeriodStart = parseISO(this.periodDates[this.periodDates.length - 1]);
    const predictedDate = addDays(lastPeriodStart, Math.round(predictedCycleLength));
    
    const confidence = this.calculateConfidence(variation, cycles.length);
    const message = this.generateMessage(regularity, confidence, method, windowSize);
    
    return {
      predictedRange: {
        start: format(addDays(predictedDate, -windowSize), 'yyyy-MM-dd'),
        end: format(addDays(predictedDate, windowSize), 'yyyy-MM-dd')
      },
      confidence,
      method,
      isIrregular,
      message,
      variation,
      windowSize
    };
  }

  public getCurrentPhase(): { phase: string; cycleDay: number; daysUntilNextPeriod?: number } {
    if (this.periodDates.length === 0) {
      return { phase: 'No data', cycleDay: 0, daysUntilNextPeriod: undefined };
    }
    
    const lastPeriodStart = parseISO(this.periodDates[this.periodDates.length - 1]);
    const today = new Date();
    const daysSinceLast = differenceInDays(today, lastPeriodStart);
    
    let cycleDay = daysSinceLast + 1;
    let phase = '';
    
    if (cycleDay <= 5) phase = 'Menstrual';
    else if (cycleDay <= 13) phase = 'Follicular';
    else if (cycleDay <= 16) phase = 'Ovulation';
    else phase = 'Luteal';
    
    let daysUntilNextPeriod: number | undefined;
    const prediction = this.predict();
    if (prediction.predictedRange) {
      const nextStart = parseISO(prediction.predictedRange.start);
      daysUntilNextPeriod = differenceInDays(nextStart, today);
      if (daysUntilNextPeriod < 0) daysUntilNextPeriod = 0;
    }
    
    return { phase, cycleDay, daysUntilNextPeriod };
  }
}

export default PeriodPredictor;