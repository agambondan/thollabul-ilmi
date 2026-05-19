import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isNative = Platform.OS !== 'web';

const safeRun = (fn) => {
  if (!isNative) return;
  try {
    Promise.resolve(fn()).catch(e => console.error(e));
  } catch {}
};

export const hapticTap = () =>
  safeRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

export const hapticSelection = () => safeRun(() => Haptics.selectionAsync());

export const hapticSuccess = () =>
  safeRun(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

export const hapticWarning = () =>
  safeRun(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));

export const hapticError = () =>
  safeRun(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));

export const hapticMedium = () =>
  safeRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
