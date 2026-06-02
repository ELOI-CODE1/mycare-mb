import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@period_dates';

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