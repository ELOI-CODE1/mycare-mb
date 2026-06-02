import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { addDays, differenceInDays, parseISO } from 'date-fns';

// Configure notification handler - FIXED
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Denied', 'You will not receive period reminders.');
    return false;
  }
  return true;
}

export async function schedulePeriodNotifications(
  predictedRange: { start: string; end: string } | null,
  isConsistentlyLate: boolean = false,
  isConsistentlyEarly: boolean = false
) {
  // Cancel all existing notifications
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  if (!predictedRange) return;
  
  const predictedStart = parseISO(predictedRange.start);
  const today = new Date();
  
  // Calculate days offset
  let daysOffset = differenceInDays(predictedStart, today);
  
  // Apply adaptive offset
  if (isConsistentlyLate) daysOffset += 2;
  if (isConsistentlyEarly) daysOffset -= 2;
  
  // Notification schedule
  const notifications = [
    { daysBefore: 5, message: 'Period predicted in 5 days', priority: 'Low' },
    { daysBefore: 3, message: 'Period expected in 3 days', priority: 'Medium' },
    { daysBefore: 1, message: 'Period expected TOMORROW', priority: 'High' },
    { daysBefore: 0, message: 'Period expected TODAY', priority: 'High' },
  ];
  
  for (const notif of notifications) {
    const notifyDate = addDays(predictedStart, -notif.daysBefore);
    if (notifyDate > today) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'MyCare+',
          body: notif.message,
          priority: notif.priority === 'High' ? 'high' : 'default',
        },
        trigger: {
          date: notifyDate,
          channelId: 'period-reminders',
        } as any,
      });
    }
  }
  
  // Late period notifications
  const lateDays = [1, 3, 7];
  for (const daysLate of lateDays) {
    const notifyDate = addDays(predictedStart, daysLate);
    const message = daysLate === 1 
      ? 'Period was expected yesterday. Still waiting?'
      : daysLate === 3
      ? 'Period is 3 days late. This is normal. Update us.'
      : 'Period is 7+ days late. Consider a test if applicable.';
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'MyCare+',
        body: message,
      },
      trigger: {
        date: notifyDate,
        channelId: 'period-reminders',
      } as any,
    });
  }
}

export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('period-reminders', {
      name: 'Period Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e91e63',
    });
  }
}