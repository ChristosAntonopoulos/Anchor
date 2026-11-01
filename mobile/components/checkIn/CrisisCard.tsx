import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { CHECK_IN_COPY } from '../../constants/checkIn';

export function CrisisCard({ prominent = false }: { prominent?: boolean }) {
  return (
    <View
      style={[styles.card, prominent && styles.prominent]}
      accessibilityRole="summary"
      accessibilityLabel={`${CHECK_IN_COPY.crisis.title}. ${CHECK_IN_COPY.crisis.body}`}
    >
      <Text style={styles.title}>{CHECK_IN_COPY.crisis.title}</Text>
      <Text style={styles.body}>{CHECK_IN_COPY.crisis.body}</Text>
      <Text style={styles.link}>{CHECK_IN_COPY.crisis.emergency}</Text>
      <Pressable
        onPress={() => {
          void Linking.openURL(CHECK_IN_COPY.crisis.resourcesUrl);
        }}
        accessibilityRole="link"
        accessibilityLabel={CHECK_IN_COPY.crisis.resources}
      >
        <Text style={styles.action}>{CHECK_IN_COPY.crisis.resources}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.m,
    gap: spacing.s,
  },
  prominent: {
    borderColor: colors.warning,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    lineHeight: typography.lineHeight.caption,
  },
  link: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.caption,
  },
  action: {
    color: colors.category.work,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    minHeight: 44,
    textAlignVertical: 'center',
  },
});
