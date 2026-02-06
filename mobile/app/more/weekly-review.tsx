import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing } from '../../constants/designTokens';
import { useWeeklyReviewStore } from '../../store/useWeeklyReviewStore';
import { WeeklySummary } from '../../components/weekly-review/WeeklySummary';
import { ReviewQuestionInput } from '../../components/weekly-review/ReviewQuestionInput';
import { SubmitReviewButton } from '../../components/weekly-review/SubmitReviewButton';

export default function WeeklyReviewScreen() {
  const { data, loading, error, fetchWeeklyReview, submitWeeklyReview } = useWeeklyReviewStore();
  const [answers, setAnswers] = useState({
    question1: '',
    question2: '',
    question3: '',
    question4: '',
  });

  useEffect(() => {
    fetchWeeklyReview();
  }, [fetchWeeklyReview]);

  const handleSubmit = () => {
    submitWeeklyReview(answers);
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
            <ActivityIndicator size="large" color={colors.category.stability} />
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
          <View style={styles.completedContainer}>
            <Text style={styles.completedText}>Weekly review completed.</Text>
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
          <WeeklySummary summary={data.aiSummary} />
          
          <View style={styles.questionsContainer}>
            <ReviewQuestionInput
              question="What worked well this week?"
              value={answers.question1}
              onChangeText={(text) => setAnswers({ ...answers, question1: text })}
              placeholder="Share what went well..."
            />
            <ReviewQuestionInput
              question="What didn't work?"
              value={answers.question2}
              onChangeText={(text) => setAnswers({ ...answers, question2: text })}
              placeholder="What challenges did you face?"
            />
            <ReviewQuestionInput
              question="What should change next week?"
              value={answers.question3}
              onChangeText={(text) => setAnswers({ ...answers, question3: text })}
              placeholder="What adjustments will you make?"
            />
            <ReviewQuestionInput
              question="One commitment for next week?"
              value={answers.question4}
              onChangeText={(text) => setAnswers({ ...answers, question4: text })}
              placeholder="Make one clear commitment..."
            />
          </View>

          <SubmitReviewButton
            onPress={handleSubmit}
            loading={loading}
            disabled={!answers.question1 || !answers.question2 || !answers.question3 || !answers.question4}
          />
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
