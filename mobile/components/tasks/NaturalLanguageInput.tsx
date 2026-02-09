import { TouchableOpacity, Text, StyleSheet, TextInput, View, ActivityIndicator, Platform } from 'react-native';
import { useState, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';

interface NaturalLanguageInputProps {
  onSubmit: (text: string) => Promise<void>;
  disabled?: boolean;
}

export function NaturalLanguageInput({ onSubmit, disabled }: NaturalLanguageInputProps) {
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    
    setLoading(true);
    try {
      await onSubmit(text.trim());
      setText('');
      setShowInput(false);
    } catch (error) {
      console.error('Failed to submit input:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setText('');
    setShowInput(false);
    setIsRecording(false);
  };

  const handleMicPress = () => {
    // Focus the input to show keyboard with voice input option
    inputRef.current?.focus();
    setIsRecording(true);
    // On iOS/Android, the keyboard will show voice input option
    // User can tap the microphone on the keyboard to start voice input
  };

  if (showInput) {
    return (
      <View style={styles.inputContainer}>
        <LinearGradient
          colors={['#1E2530', '#252B38']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inputWrapper}
        >
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Write anything... e.g., 'Workout every Monday' or 'Review project proposal'"
              placeholderTextColor={colors.textSecondary}
              value={text}
              onChangeText={setText}
              autoFocus
              multiline
              maxLength={500}
              editable={!loading}
              keyboardType="default"
              textContentType="none"
              autoCorrect={true}
              autoCapitalize="sentences"
              // Enable voice input on supported platforms
              enablesReturnKeyAutomatically={true}
            />
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonActive]}
              onPress={handleMicPress}
              disabled={loading}
            >
              <Ionicons
                name={isRecording ? "mic" : "mic-outline"}
                size={24}
                color={isRecording ? colors.category.leverage : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            💡 AI will determine if it's a task, schedule, or deadline, and set the category and recurrence.
            {Platform.OS === 'ios' || Platform.OS === 'android' ? ' Tap the mic to use voice input.' : ''}
          </Text>
        </LinearGradient>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, (!text.trim() || loading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!text.trim() || loading}
          >
            <LinearGradient
              colors={(!text.trim() || loading) 
                ? [colors.border, colors.border] 
                : [colors.category.leverage, colors.category.leverage + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.submitText}>Submit</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={() => setShowInput(true)}
      disabled={disabled}
    >
      <LinearGradient
        colors={disabled 
          ? [colors.border, colors.border] 
          : [colors.category.leverage, colors.category.leverage + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.buttonGradient}
      >
        <View style={styles.buttonContent}>
          <Ionicons name="sparkles" size={20} color={colors.background} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
            Write anything...
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: spacing.l,
    marginTop: spacing.m,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  buttonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  buttonTextDisabled: {
    color: colors.textSecondary,
  },
  inputContainer: {
    paddingHorizontal: spacing.l,
    marginTop: spacing.m,
  },
  inputWrapper: {
    borderRadius: borderRadius.medium,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
    padding: spacing.m,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  micButton: {
    padding: spacing.s,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  micButtonActive: {
    backgroundColor: colors.category.leverage + '20',
    borderColor: colors.category.leverage,
  },
  hint: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: spacing.s,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  submitButton: {
    flex: 1,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
  },
  submitText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
});
