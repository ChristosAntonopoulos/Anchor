import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import type { DayBootstrap, YesterdayAssessment } from '../../types';

interface YesterdayAssessmentModalProps {
  visible: boolean;
  bootstrap: DayBootstrap | null;
  onDismiss: () => void;
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, idx) => (
        <View key={`${title}-${idx}`} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function YesterdayAssessmentModal({ visible, bootstrap, onDismiss }: YesterdayAssessmentModalProps) {
  const assessment: YesterdayAssessment | undefined = bootstrap?.yesterdayAssessment;
  const processing = bootstrap?.status === 'processing' && !assessment?.summary;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onDismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Yesterday</Text>
          <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {processing ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="large" color={colors.category.work} />
              <Text style={styles.loadingText}>Building today's plan…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.summary}>{assessment?.summary ?? 'Ready for a new day.'}</Text>
              {assessment?.moodNote ? (
                <Text style={styles.moodNote}>{assessment.moodNote}</Text>
              ) : null}
              <BulletSection title="Wins" items={assessment?.wins ?? []} />
              <BulletSection title="Misses" items={assessment?.misses ?? []} />
              <BulletSection title="Carry forward" items={assessment?.carryForward ?? []} />
            </>
          )}

          {bootstrap?.status === 'failed' && bootstrap.error ? (
            <Text style={styles.errorText}>{bootstrap.error}</Text>
          ) : null}
        </ScrollView>

        <TouchableOpacity style={styles.primaryBtn} onPress={onDismiss}>
          <Text style={styles.primaryBtnText}>
            {processing ? 'Continue while loading' : 'Start today'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeBtn: { padding: spacing.xs },
  content: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xl,
    gap: spacing.m,
  },
  loadingBlock: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.m,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
  },
  summary: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  moodNote: {
    fontSize: typography.fontSize.caption,
    color: colors.category.work,
    fontStyle: 'italic',
  },
  section: { gap: spacing.xs },
  sectionTitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.category.work,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.s,
  },
  bulletRow: { flexDirection: 'row', gap: spacing.s, alignItems: 'flex-start' },
  bullet: { color: colors.textSecondary, lineHeight: 22 },
  bulletText: { flex: 1, color: colors.textSecondary, fontSize: typography.fontSize.body, lineHeight: 22 },
  errorText: { color: colors.category.health, fontSize: typography.fontSize.caption },
  primaryBtn: {
    margin: spacing.l,
    backgroundColor: colors.category.work,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.m,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.background,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.body,
  },
});
