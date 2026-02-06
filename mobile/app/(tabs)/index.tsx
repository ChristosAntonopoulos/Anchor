import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../constants/designTokens';
import { useTodayStore } from '../../store/useTodayStore';
import { TodayHeader } from '../../components/today/TodayHeader';
import { BetterTodayList } from '../../components/today/BetterTodayList';
import { CurrentBlockIndicator } from '../../components/today/CurrentBlockIndicator';
import { DisciplineQuickToggle } from '../../components/today/DisciplineQuickToggle';
import { DeadlineWarningBanner } from '../../components/today/DeadlineWarningBanner';

export default function HomeScreen() {
  const { data, loading, error, fetchToday, completeBetterItem, acceptBetterItem, editBetterItem, rejectBetterItem, updateDiscipline } = useTodayStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchToday();
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
            <ActivityIndicator size="large" color={colors.category.work} />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.category.work} />
          }
        >
          <TodayHeader date={data.day.date} />
          
          <BetterTodayList
            items={data.betterItems}
            onToggleItem={completeBetterItem}
            onAcceptItem={acceptBetterItem}
            onEditItem={editBetterItem}
            onRejectItem={rejectBetterItem}
          />

          <CurrentBlockIndicator block={data.currentBlock} />

          <DisciplineQuickToggle
            discipline={data.discipline}
            onToggle={(key) => {
              updateDiscipline({
                [key]: !data.discipline[key],
              });
            }}
          />

          {data.deadlineWarning && (
            <DeadlineWarningBanner warning={data.deadlineWarning} />
          )}
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
});
