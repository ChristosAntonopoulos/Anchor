import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../constants/designTokens';
import { apiClient } from '../../services/api';
import { PhoneUnlockEntryList } from '../../components/phoneUnlock/PhoneUnlockEntryList';
import type { PhoneUnlockEntry } from '../../types';

export default function UnlocksScreen() {
  const [entries, setEntries] = useState<PhoneUnlockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      setError(null);
      const data = await apiClient.getPhoneUnlockEntries();
      setEntries(data);
    } catch (err: any) {
      console.error('Failed to fetch phone unlock entries:', err);
      setError(err?.message || 'Failed to load unlock entries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEntries();
  };

  if (loading) {
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

  if (error) {
    return (
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
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
        <PhoneUnlockEntryList
          entries={entries}
          refreshing={refreshing}
          onRefresh={onRefresh}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
});
