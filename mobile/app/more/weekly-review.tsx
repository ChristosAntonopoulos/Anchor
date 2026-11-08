import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing } from '../../constants/designTokens';
import { useWeeklyReviewStore } from '../../store/useWeeklyReviewStore';
import { WeeklySummary } from '../../components/weekly-review/WeeklySummary';
import { ReviewQuestionInput } from '../../components/weekly-review/ReviewQuestionInput';
import { SubmitReviewButton } from '../../components/weekly-review/SubmitReviewButton';
import { ErrorBanner } from '../../components/shared/ErrorBanner';

export default function WeeklyReviewScreen() {
  const { data, loading, error, fetchWeeklyReview, submitWeeklyReview } = useWeeklyReviewStore();
  const [answers, setAnswers] = useState({
    shipped: '',
    improved: '',
    avoided: '',
    nextFocus: '',
  });

  useEffect(() => {
    void fetchWeeklyReview();
  }, [fetchWeeklyReview]);

  const handleSubmit = () => {
    void submitWeeklyReview(answers);
  };

  const ready =
    answers.shipped.trim() &&
    answers.improved.trim() &&
    answers.avoided.trim() &&
    answers.nextFocus.trim();

  if (loading && !data) {
    return (
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          {error ? <ErrorBanner message={error} onRetry={() => void fetchWeeklyReview()} /> : null}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
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
          {error ? <ErrorBanner message={error} onRetry={() => void fetchWeeklyReview()} /> : null}
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No weekly review available.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (data.completed) {
    return (
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          {error ? <ErrorBanner message={error} onRetry={() => void fetchWeeklyReview()} /> : null}
          <View style={styles.completedContainer}>
            <Text style={styles.completedText}>This week is reviewed.</Text>
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {error ? (
            <ErrorBanner
              title="Could not save"
              message={error}
              onRetry={handleSubmit}
            />
          ) : null}
          <WeeklySummary summary={data.aiSummary} />

          <View style={styles.questionsContainer}>
            <ReviewQuestionInput
              question="What shipped this week?"
              value={answers.shipped}
              onChangeText={(text) => setAnswers({ ...answers, shipped: text })}
              placeholder="What actually left your desk…"
            />
            <ReviewQuestionInput
              question="What improved?"
              value={answers.improved}
              onChangeText={(text) => setAnswers({ ...answers, improved: text })}
              placeholder="A habit, a system, a skill…"
            />
            <ReviewQuestionInput
              question="What did you stay away from?"
              value={answers.avoided}
              onChangeText={(text) => setAnswers({ ...answers, avoided: text })}
              placeholder="The thing you chose not to feed…"
            />
            <ReviewQuestionInput
              question="Next week's focus?"
              value={answers.nextFocus}
              onChangeText={(text) => setAnswers({ ...answers, nextFocus: text })}
              placeholder="One clear focus…"
            />
          </View>

          <SubmitReviewButton onPress={handleSubmit} loading={loading} disabled={!ready} />
        </ScrollView>
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
  questionsContainer: {
    paddingHorizontal: spacing.m,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completedText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
