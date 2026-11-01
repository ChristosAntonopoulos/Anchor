import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../constants/designTokens';
import { useTodayStore } from '../../store/useTodayStore';
import { DisciplineCard } from '../../components/discipline/DisciplineCard';
import { DietCard } from '../../components/discipline/DietCard';
import { apiClient } from '../../services/api';

export default function DisciplineScreen() {
  const { data, loading, error, fetchToday, updateDiscipline, updateDiet } = useTodayStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!data) {
      fetchToday();
    }
  }, [data, fetchToday]);

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
            <ActivityIndicator size="large" color={colors.category.health} />
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
          <View style={styles.emptyContainer}>
            <Text style={styles.errorText}>Error loading data</Text>
            <Text style={styles.errorDetail}>{error}</Text>
            <Text style={styles.emptyText} onPress={fetchToday}>
              Tap to retry
            </Text>
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
            <Text style={styles.emptyText}>No discipline data available.</Text>
            <Text style={styles.emptyText} onPress={fetchToday}>
              Tap to refresh
            </Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.category.health} />
          }
        >
          <DisciplineCard
            discipline={data.discipline}
            onToggleItem={async (blockId, itemId, value) => {
              try {
                const today = new Date().toISOString().split('T')[0];
                const updated = await apiClient.updateDisciplineToggle(today, blockId, itemId, value);
                // Update local state
                await fetchToday();
              } catch (error) {
                console.error('Failed to update toggle:', error);
              }
            }}
            onIncrementItem={async (blockId, itemId) => {
              try {
                const today = new Date().toISOString().split('T')[0];
                await apiClient.incrementDisciplineCounter(today, blockId, itemId);
                // Update local state
                await fetchToday();
              } catch (error) {
                console.error('Failed to increment counter:', error);
              }
            }}
            onDecrementItem={async (blockId, itemId) => {
              try {
                const today = new Date().toISOString().split('T')[0];
                await apiClient.decrementDisciplineCounter(today, blockId, itemId);
                // Update local state
                await fetchToday();
              } catch (error) {
                console.error('Failed to decrement counter:', error);
              }
            }}
            weeklyInsight="Weakest habit this week: Meditation. Try setting a daily reminder."
          />
          <DietCard
            diet={data.diet}
            onToggle={() => {
              updateDiet({
                compliant: !data.diet.compliant,
              });
            }}
            onUpdate={(updates) => updateDiet(updates)}
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
