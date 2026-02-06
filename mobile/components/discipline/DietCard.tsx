import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { DietEntry } from '../../types';

interface DietCardProps {
  diet: DietEntry;
  onToggle: () => void;
  onUpdate: (updates: Partial<DietEntry>) => void;
}

export function DietCard({ diet, onToggle, onUpdate }: DietCardProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState(diet.note || '');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onUpdate({ photoUri: result.assets[0].uri });
    }
  };

  const handleSaveNote = () => {
    onUpdate({ note: note.trim() });
    setShowNoteInput(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Diet</Text>
          <TouchableOpacity
            onPress={onToggle}
            activeOpacity={0.7}
            style={styles.toggleWrapper}
          >
            {diet.compliant ? (
              <LinearGradient
                colors={[colors.category.leverage, colors.category.leverage + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.toggleCompliant}
              >
                <Text style={styles.toggleTextCompliant}>Compliant</Text>
              </LinearGradient>
            ) : (
              <View style={styles.toggle}>
                <Text style={styles.toggleText}>Not Compliant</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {diet.photoUri && (
          <View style={styles.photoContainer}>
            <Image source={{ uri: diet.photoUri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => onUpdate({ photoUri: undefined })}
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {showNoteInput ? (
          <View style={styles.noteInputContainer}>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note about your meal..."
              placeholderTextColor={colors.textSecondary}
              multiline
              autoFocus
            />
            <View style={styles.noteButtons}>
              <TouchableOpacity
                style={styles.cancelNoteButton}
                onPress={() => {
                  setNote(diet.note || '');
                  setShowNoteInput(false);
                }}
              >
                <Text style={styles.cancelNoteText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveNoteButton}
                onPress={handleSaveNote}
              >
                <LinearGradient
                  colors={[colors.category.leverage, colors.category.leverage + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveNoteGradient}
                >
                  <Text style={styles.saveNoteText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowNoteInput(true)}
            >
              <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.actionText}>
                {diet.note ? 'Edit Note' : 'Add Note'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={pickImage}
            >
              <Ionicons name="camera-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.actionText}>
                {diet.photoUri ? 'Change Photo' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {diet.note && !showNoteInput && (
          <View style={styles.noteDisplay}>
            <Text style={styles.noteText}>{diet.note}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.l,
    borderRadius: borderRadius.medium,
    ...shadows.medium,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  toggleWrapper: {
    borderRadius: borderRadius.round,
  },
  toggle: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleCompliant: {
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  toggleText: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
  },
  toggleTextCompliant: {
    fontSize: typography.fontSize.caption,
    color: colors.background,
    fontWeight: typography.fontWeight.semibold,
  },
  photoContainer: {
    marginTop: spacing.m,
    position: 'relative',
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.background + 'CC',
    borderRadius: borderRadius.round,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.m,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.s,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  noteInputContainer: {
    marginTop: spacing.m,
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.s,
  },
  noteButtons: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  cancelNoteButton: {
    flex: 1,
    padding: spacing.s,
    alignItems: 'center',
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelNoteText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  saveNoteButton: {
    flex: 1,
    borderRadius: borderRadius.small,
    overflow: 'hidden',
  },
  saveNoteGradient: {
    padding: spacing.s,
    alignItems: 'center',
  },
  saveNoteText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  noteDisplay: {
    marginTop: spacing.m,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
});
