import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../constants/designTokens';
import { useDeadlinesStore } from '../../store/useDeadlinesStore';
import { DeadlineList } from '../../components/deadlines/DeadlineList';
import { DeadlineEditor } from '../../components/deadlines/DeadlineEditor';
import { ErrorBanner } from '../../components/shared/ErrorBanner';
import type { Deadline } from '../../types';

export default function DeadlinesScreen() {
  const {
    deadlines,
    loading,
    error,
    fetchDeadlines,
    createDeadline,
    updateDeadline,
    deleteDeadline,
    clearError,
  } = useDeadlinesStore();
  const [refreshing, setRefreshing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Deadline | null>(null);

  useEffect(() => {
    void fetchDeadlines();
  }, [fetchDeadlines]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeadlines();
    setRefreshing(false);
  };

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (deadline: Deadline) => {
    setEditing(deadline);
    setEditorOpen(true);
  };

  const handleDelete = (deadline: Deadline) => {
    Alert.alert(deadline.title, 'Remove this deadline?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteDeadline(deadline.id);
        },
      },
    ]);
  };

  if (loading && deadlines.length === 0 && !error) {
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

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {error ? (
          <ErrorBanner message={error} onRetry={() => void fetchDeadlines()} onDismiss={clearError} />
        ) : null}
        <DeadlineList
          deadlines={deadlines}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onAdd={openNew}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
        <DeadlineEditor
          key={editing?.id ?? 'new'}
          visible={editorOpen}
          deadline={editing}
          onClose={() => setEditorOpen(false)}
          onSave={async (input) => {
            if (editing) {
              await updateDeadline(editing.id, input);
            } else {
              await createDeadline({
                title: input.title,
                dueDate: input.dueDate,
                importance: input.importance,
              });
            }
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
