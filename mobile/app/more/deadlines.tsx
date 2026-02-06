import { View, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../constants/designTokens';
import { useDeadlinesStore } from '../../store/useDeadlinesStore';
import { DeadlineList } from '../../components/deadlines/DeadlineList';

export default function DeadlinesScreen() {
  const { deadlines, loading, error, fetchDeadlines } = useDeadlinesStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeadlines();
    setRefreshing(false);
  };

  if (loading && deadlines.length === 0) {
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

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <DeadlineList deadlines={deadlines} refreshing={refreshing} onRefresh={onRefresh} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
