import { View, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, gradients, spacing } from '../../constants/designTokens';
import { useNotificationStore } from '../../store/useNotificationStore';
import { NotificationList } from '../../components/notifications/NotificationList';
import { NotificationFilters } from '../../components/notifications/NotificationFilters';

export default function NotificationsScreen() {
  const {
    backendNotifications,
    loading,
    error,
    fetchNotifications,
    fetchSettings,
  } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [groupBy, setGroupBy] = useState<string>('none');

  useEffect(() => {
    fetchSettings();
    fetchNotifications({ filter: filter !== 'all' ? filter : undefined, search: search || undefined });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchNotifications({ filter: filter !== 'all' ? filter : undefined, search: search || undefined, groupBy: groupBy !== 'none' ? groupBy : undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, groupBy]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications({ filter: filter !== 'all' ? filter : undefined, search: search || undefined, groupBy: groupBy !== 'none' ? groupBy : undefined });
    setRefreshing(false);
  };

  if (loading && backendNotifications.length === 0) {
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
        <NotificationFilters
          filter={filter}
          search={search}
          groupBy={groupBy}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
          onGroupByChange={setGroupBy}
        />
        <NotificationList
          notifications={backendNotifications}
          refreshing={refreshing}
          onRefresh={onRefresh}
          groupBy={groupBy}
        />
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
