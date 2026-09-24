import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { addDays, parseISO } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERIOD_ID_PREFIX = 'mycareplus-period-';
const PREFS_KEY = 'mycareplus_notif_prefs';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotifPrefs = { reminders: boolean; orderUpdates: boolean };

export async function getNotifPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (raw) return { reminders: true, orderUpdates: true, ...JSON.parse(raw) };
  } catch { /* use defaults */ }
  return { reminders: true, orderUpdates: true };
}

export async function setNotifPrefs(prefs: NotifPrefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Enable notifications to receive period reminders and order updates.');
    return false;
  }
  return true;
}

/** Silent check for background sync: never prompts, never alerts. */
export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

async function cancelOwnPeriodReminders() {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => n.identifier.startsWith(PERIOD_ID_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch { /* scheduling still proceeds */ }
}

export async function schedulePeriodNotifications(
  predictedRange: { start: string; end: string } | null,
  isConsistentlyLate: boolean = false,
  isConsistentlyEarly: boolean = false,
) {
  if (Platform.OS === 'web') return;
  const prefs = await getNotifPrefs();
  if (!prefs.reminders) return;

  // Only touch our own notifications — never wipe unrelated reminders.
  await cancelOwnPeriodReminders();
  if (!predictedRange) return;

  const granted = await requestPermissions();
  if (!granted) return;
  await setupNotificationChannel();

  const predictedStart = parseISO(predictedRange.start);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let shift = 0;
  if (isConsistentlyLate) shift += 2;
  if (isConsistentlyEarly) shift -= 2;
  const shifted = addDays(predictedStart, shift);

  const plan: Array<{ id: string; date: Date; body: string; priority: 'high' | 'default' }> = [
    { id: `${PERIOD_ID_PREFIX}5d`, date: addDays(shifted, -5), body: 'Period predicted in 5 days — stock up on essentials.', priority: 'default' },
    { id: `${PERIOD_ID_PREFIX}3d`, date: addDays(shifted, -3), body: 'Period expected in 3 days.', priority: 'default' },
    { id: `${PERIOD_ID_PREFIX}1d`, date: addDays(shifted, -1), body: 'Period expected TOMORROW.', priority: 'high' },
    { id: `${PERIOD_ID_PREFIX}0d`, date: shifted, body: 'Period expected TODAY.', priority: 'high' },
    { id: `${PERIOD_ID_PREFIX}late1`, date: addDays(shifted, 1), body: 'Period was expected yesterday. Still waiting?', priority: 'default' },
    { id: `${PERIOD_ID_PREFIX}late3`, date: addDays(shifted, 3), body: 'Period is 3 days late. This is normal. Update us.', priority: 'default' },
    { id: `${PERIOD_ID_PREFIX}late7`, date: addDays(shifted, 7), body: 'Period is 7+ days late. Consider a test if applicable.', priority: 'default' },
  ];

  for (const item of plan) {
    if (item.date <= new Date()) continue;
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: { title: 'MyCare+', body: item.body, priority: item.priority === 'high' ? 'high' : 'default' },
        // SDK 57 date trigger shape.
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.date, channelId: 'period-reminders' } as never,
      });
    } catch { /* skip one bad date, keep the rest */ }
  }
}

export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('period-reminders', {
      name: 'Period Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#c94f78',
    });
  }
}
