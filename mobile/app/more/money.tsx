import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../constants/designTokens';
import { useMoneyStore } from '../../store/useMoneyStore';
import { MoneySummaryCard } from '../../components/money/MoneySummaryCard';
import { IncomeTrendChart } from '../../components/money/IncomeTrendChart';
import { IncomeList } from '../../components/money/IncomeList';
import { AddIncomeButton } from '../../components/money/AddIncomeButton';

export default function MoneyScreen() {
  const { data, loading, error, fetchMoneySummary, createIncome } = useMoneyStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMoneySummary();
  }, [fetchMoneySummary]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMoneySummary();
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
            <ActivityIndicator size="large" color={colors.category.leverage} />
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
            <Text style={styles.emptyText}>No income logged yet. That's okay. Keep building.</Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.category.leverage} />
          }
        >
          <MoneySummaryCard summary={data} />
          <IncomeTrendChart income={data.income} />
          <IncomeList income={data.income} />
          <AddIncomeButton
            onAddIncome={(date, source, amount) => createIncome({ date, source, amount })}
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
});
