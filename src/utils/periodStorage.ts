import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, format, parseISO } from 'date-fns';

const STORAGE_KEY = '@period_dates';
const LOGS_KEY = '@period_logs';

export type PeriodLog = { startDate: string; duration: number };

export const savePeriodDates = async (dates: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
  } catch (error) {
    console.error('Error saving period dates:', error);
  }
};

export const loadPeriodDates = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading period dates:', error);
    return [];
  }
};

export const addPeriodDate = async (date: string): Promise<string[]> => {
  const dates = await loadPeriodDates();
  if (dates.includes(date)) return dates;
  const newDates = [date, ...dates].sort().reverse();
  await savePeriodDates(newDates);
  return newDates;
};

export const removePeriodDate = async (date: string): Promise<string[]> => {
  const dates = await loadPeriodDates();
  const newDates = dates.filter(d => d !== date);
  await savePeriodDates(newDates);
  return newDates;
};

export const loadPeriodLogs = async (): Promise<PeriodLog[]> => {
  try {
    const data = await AsyncStorage.getItem(LOGS_KEY);
    if (data) return JSON.parse(data);
    const legacyDates = await loadPeriodDates();
    return legacyDates.map((startDate) => ({ startDate, duration: 1 }));
  } catch (error) {
    console.error('Error loading period logs:', error);
    return [];
  }
};

export const savePeriodLogs = async (logs: PeriodLog[]): Promise<void> => {
  await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
};

export const addPeriodLog = async (startDate: string, duration: number): Promise<PeriodLog[]> => {
  const logs = await loadPeriodLogs();
  const next = [
    ...logs.filter((log) => log.startDate !== startDate),
    { startDate, duration: Math.min(14, Math.max(1, Math.round(duration))) },
  ].sort((a, b) => b.startDate.localeCompare(a.startDate));
  await savePeriodLogs(next);
  return next;
};

export const periodDays = (log: PeriodLog): string[] => {
  return Array.from({ length: log.duration }, (_, index) => format(addDays(parseISO(log.startDate), index), 'yyyy-MM-dd'));
};