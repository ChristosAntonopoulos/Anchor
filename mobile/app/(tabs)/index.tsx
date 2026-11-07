import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../constants/designTokens';
import { workPath } from '../../utils/workBlock';
import { useTodayStore } from '../../store/useTodayStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { TodayHeader } from '../../components/today/TodayHeader';
import { BetterTodayList } from '../../components/today/BetterTodayList';
import { CurrentBlockIndicator } from '../../components/today/CurrentBlockIndicator';
import { DisciplineQuickToggle } from '../../components/today/DisciplineQuickToggle';
import { DeadlineWarningBanner } from '../../components/today/DeadlineWarningBanner';
import { NaturalLanguageInput } from '../../components/tasks/NaturalLanguageInput';
import { NotificationAccessPrompt } from '../../components/notifications/NotificationAccessPrompt';
import { NowCard } from '../../components/execution/NowCard';
import { RecoveryCard } from '../../components/execution/RecoveryCard';
import { DayPlanCard } from '../../components/execution/DayPlanCard';
import { WorkSessionModal } from '../../components/execution/WorkSessionModal';
import { useExecutionStore } from '../../store/useExecutionStore';
import type { SessionLaunch } from '../../types/execution';
import { AiBriefCard } from '../../components/today/AiBriefCard';
import { TodayMealCard } from '../../components/meals/TodayMealCard';

export default function HomeScreen() {
  const router = useRouter();
  const { data, loading, error, fetchToday, completeBetterItem, acceptBetterItem, editBetterItem, rejectBetterItem, submitAIInput, markAiBriefApplied } = useTodayStore();
  const { checkStatus, startListening } = useNotificationStore();
  const {
    now,
    dayPlan,
    loading: nowLoading,
    fetchNow,
    fetchProfile,
    rejectNow,
    askStuck,
    planToday,
    applyPlan,
    recover,
    stuck,
    useStuck,
    clearStuck,
  } = useExecutionStore();
  const [refreshing, setRefreshing] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<SessionLaunch | null>(null);

  useEffect(() => {
    fetchToday();
    checkStatus();
    void fetchProfile();
    void fetchNow();
  }, [fetchToday, checkStatus, fetchProfile, fetchNow]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchToday(), fetchNow()]);
    setRefreshing(false);
  };

  if (loading && !data) {
    return (
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error && !data) {
    return (
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Something didn't load. Try again.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!data) {
    return (
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Choose one thing to move forward today.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          <TodayHeader date={data.day.date} />

          {data.aiBrief && (
            <AiBriefCard
              brief={data.aiBrief}
              onMarkApplied={markAiBriefApplied}
            />
          )}

          <TodayMealCard />

          {now?.recovery && !now.activeSession ? (
            <RecoveryCard
              card={now.recovery}
              onShorter={() => {
                setPendingStart({
                  taskId: now.recovery?.taskId ?? undefined,
                  blockId: now.recovery?.blockId,
                  title: now.recovery?.title,
                  currentAction: now.recovery?.nextAction,
                  minutes: now.recovery?.suggestedStartMinutes ?? 5,
                });
                setSessionOpen(true);
              }}
              onMove={() => void recover('move')}
              onLeave={() => void recover('leave')}
              onReplan={() => void recover('replan')}
            />
          ) : null}

          {dayPlan?.status === 'draft' ? (
            <DayPlanCard
              plan={dayPlan}
              onUse={() => void applyPlan('all')}
              onFirstOnly={() => void applyPlan('first')}
              onDiscard={() => void applyPlan('discard')}
            />
          ) : null}

          {stuck ? (
            <View style={styles.stuckCard}>
              <Text style={styles.stuckTitle}>{stuck.suggestedAction}</Text>
              <Text style={styles.stuckBody}>{stuck.explanation}</Text>
              <TouchableOpacity onPress={() => void useStuck()}>
                <Text style={styles.stuckLink}>Use this</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => clearStuck()}>
                <Text style={styles.stuckLink}>Leave for now</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <NowCard
            recommendation={now}
            loading={nowLoading}
            onStart={() => {
              if (now?.activeSession) {
                setPendingStart(null);
                setSessionOpen(true);
                return;
              }
              setPendingStart({
                taskId: now?.taskId ?? undefined,
                title: now?.taskTitle ?? undefined,
                currentAction: now?.nextAction,
                minutes: now?.suggestedStartMinutes,
              });
              setSessionOpen(true);
            }}
            onMakeSmaller={() => void askStuck({ taskId: now?.taskId ?? undefined, makeSmaller: true })}
            onChooseSomethingElse={() => void rejectNow()}
            onCapacity={(capacity) => void fetchNow({ capacity })}
            onEasier={() => void fetchNow({ easier: true, refresh: true })}
            onPlanToday={() => void planToday('today')}
          />
          
          <NotificationAccessPrompt
            onEnabled={() => {
              startListening();
            }}
          />
          
          <NaturalLanguageInput
            onSubmit={async (text) => {
              await submitAIInput(text);
            }}
          />
          
          <BetterTodayList
            items={data.betterItems}
            onToggleItem={completeBetterItem}
            onAcceptItem={acceptBetterItem}
            onEditItem={editBetterItem}
            onRejectItem={rejectBetterItem}
          />

          <CurrentBlockIndicator
            block={data.currentBlock}
            onOpen={data.currentBlock?.title ? () => router.push(workPath(data.currentBlock?.id)) : undefined}
          />

          <DisciplineQuickToggle
            discipline={data.discipline}
          />

          {data.deadlineWarning && (
            <DeadlineWarningBanner warning={data.deadlineWarning} />
          )}
        </ScrollView>
        <WorkSessionModal
          visible={sessionOpen}
          pendingStart={pendingStart}
          onClose={() => {
            setSessionOpen(false);
            setPendingStart(null);
          }}
        />
      </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stuckCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  stuckTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  stuckBody: {
    color: colors.textSecondary,
    marginTop: 6,
  },
  stuckLink: {
    color: colors.textSecondary,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
});
