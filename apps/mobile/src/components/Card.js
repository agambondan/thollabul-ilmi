import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardTitle({ children, meta, metaStyle, style, titleStyle }) {
  return (
    <View style={[styles.titleRow, style]}>
      <Text style={[styles.title, titleStyle]}>{children}</Text>
      {meta ? <Text style={[styles.meta, metaStyle]}>{meta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...Platform.select({
      web: {
        alignSelf: 'stretch',
        boxSizing: 'border-box',
        maxWidth: '100%',
      },
    }),
    ...shadows.paper,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.ink,
    flex: 1,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '900',
    minWidth: 0,
  },
  meta: {
    color: colors.primary,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
    marginLeft: spacing.md,
    maxWidth: '48%',
    textAlign: 'right',
  },
});
