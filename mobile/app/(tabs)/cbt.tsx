import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCBTStore } from '../../store/useCBTStore';
import { CBTInput } from '../../components/cbt/CBTInput';
import { ThoughtRecordList } from '../../components/cbt/ThoughtRecordList';
import { MoodTracker } from '../../components/cbt/MoodTracker';
import { ActivityList } from '../../components/cbt/ActivityList';
import { ActivityCompletionModal } from '../../components/cbt/ActivityCompletionModal';
import { submitIntakeAndRefresh } from '../../services/intakeService';
import { colors, spacing, typography } from '../../constants/designTokens';
import type { BehavioralActivity } from '../../types';

export default function CBTScreen() {
  const {
    entries,
    activities,
    loading,
    fetchCBTEntries,
    fetchBehavioralActivities,
    completeActivity,
  } = useCBTStore();
  const [activeTab, setActiveTab] = useState<'thoughts' | 'mood' | 'activities'>('thoughts');
  const [refreshing, setRefreshing] = useState(false);
  const [completingActivity, setCompletingActivity] = useState<BehavioralActivity | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    fetchCBTEntries(today);
    fetchBehavioralActivities();
  }, [fetchCBTEntries, fetchBehavioralActivities]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const today = new Date().toISOString().slice(0, 10);
    await Promise.all([
      fetchCBTEntries(today),
      fetchBehavioralActivities(),
    ]);
    setRefreshing(false);
  };

  const handleSubmit = async (text: string) => {
    await submitIntakeAndRefresh(text);
    const today = new Date().toISOString().slice(0, 10);
    await fetchCBTEntries(today);
    await fetchBehavioralActivities();
    setActiveTab('activities');
  };

  const handleCompleteActivity = async (request: Parameters<typeof completeActivity>[1]) => {
    if (!completingActivity) return;
    await completeActivity(completingActivity.id, request);
    setCompletingActivity(null);
  };

  return (
    <LinearGradient
      colors={['#0F1419', '#1A1F2E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textPrimary} />
        }
      >
        <CBTInput onSubmit={handleSubmit} disabled={loading} />

        <View style={styles.tabContainer}>
          <View style={styles.tabRow}>
            <View
              style={[styles.tab, activeTab === 'thoughts' && styles.tabActive]}
              onTouchEnd={() => setActiveTab('thoughts')}
            >
              <Text style={[styles.tabText, activeTab === 'thoughts' && styles.tabTextActive]}>
                Thought Records
              </Text>
            </View>
            <View
              style={[styles.tab, activeTab === 'mood' && styles.tabActive]}
              onTouchEnd={() => setActiveTab('mood')}
            >
              <Text style={[styles.tabText, activeTab === 'mood' && styles.tabTextActive]}>
                Mood
              </Text>
            </View>
            <View
              style={[styles.tab, activeTab === 'activities' && styles.tabActive]}
              onTouchEnd={() => setActiveTab('activities')}
            >
              <Text style={[styles.tabText, activeTab === 'activities' && styles.tabTextActive]}>
                Activities
              </Text>
            </View>
          </View>
        </View>

        {activeTab === 'thoughts' && <ThoughtRecordList entries={entries} />}
        {activeTab === 'mood' && <MoodTracker />}
        {activeTab === 'activities' && (
          <ActivityList
            activities={activities}
            onComplete={(activity) => setCompletingActivity(activity)}
          />
        )}
      </ScrollView>

      <ActivityCompletionModal
        visible={completingActivity != null}
        activityTitle={completingActivity?.title ?? ''}
        onClose={() => setCompletingActivity(null)}
        onSubmit={handleCompleteActivity}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  tabContainer: {
    paddingHorizontal: spacing.l,
    marginTop: spacing.m,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.category.health + '20',
  },
  tabText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  tabTextActive: {
    color: colors.category.health,
    fontWeight: typography.fontWeight.semibold,
  },
});
