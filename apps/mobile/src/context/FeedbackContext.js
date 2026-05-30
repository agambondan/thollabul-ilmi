import { CheckCircle2, Info, X, XCircle } from 'lucide-react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMobileLocale } from '../i18n/MobileLocaleProvider';
import { colors, radius, shadows, spacing } from '../theme';
import { hapticError, hapticSuccess, hapticWarning } from '../utils/haptics';

const FeedbackContext = createContext({
  showError: () => {},
  showInfo: () => {},
  showSuccess: () => {},
});

const variants = {
  error: {
    Icon: XCircle,
    borderColor: colors.danger,
    color: colors.danger,
    titleKey: 'feedback.error',
  },
  info: {
    Icon: Info,
    borderColor: colors.accent,
    color: colors.accent,
    titleKey: 'feedback.info',
  },
  success: {
    Icon: CheckCircle2,
    borderColor: colors.primary,
    color: colors.primary,
    titleKey: 'feedback.success',
  },
};

export function FeedbackProvider({ children }) {
  const { t } = useMobileLocale();
  const [toast, setToast] = useState(null);

  const show = useCallback((type, message, options = {}) => {
    if (!message) return;
    if (options.haptic !== false) {
      if (type === 'success') hapticSuccess();
      else if (type === 'error') hapticError();
      else hapticWarning();
    }
    setToast({
      id: `${Date.now()}:${type}`,
      message,
      title: options.title,
      type,
    });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const value = useMemo(
    () => ({
      showError: (message, options) => show('error', message, options),
      showInfo: (message, options) => show('info', message, options),
      showSuccess: (message, options) => show('success', message, options),
    }),
    [show],
  );

  const variant = toast ? variants[toast.type] ?? variants.info : null;
  const ToastIcon = variant?.Icon;

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {toast && variant ? (
        <View pointerEvents="box-none" style={styles.toastLayer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('feedback.close')}
            android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
            onPress={() => setToast(null)}
            style={[styles.toast, { borderColor: variant.borderColor }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${variant.color}18` }]}>
              <ToastIcon color={variant.color} size={20} strokeWidth={2.4} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{toast.title ?? t(variant.titleKey)}</Text>
              <Text style={styles.message}>{toast.message}</Text>
            </View>
            <X color={colors.muted} size={16} strokeWidth={2.4} />
          </Pressable>
        </View>
      ) : null}
    </FeedbackContext.Provider>
  );
}

export const useFeedback = () => useContext(FeedbackContext);

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  message: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 2,
  },
  title: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  toast: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.raised,
  },
  toastLayer: {
    bottom: 86,
    left: spacing.md,
    position: 'absolute',
    right: spacing.md,
    zIndex: 1000,
  },
});
